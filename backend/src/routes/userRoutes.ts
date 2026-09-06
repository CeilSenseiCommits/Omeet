import { Router, Request, Response } from "express";
import { query } from "../db";
import { OAuth2Client } from "google-auth-library";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Reserved system handles that cannot be registered
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "system",
  "root",
  "omeet",
  "support",
  "help",
]);

/**
 * GET /api/users/check-username?username=xyz
 * Real-time username collision check against PostgreSQL
 */
router.get("/check-username", async (req: Request, res: Response) => {
  try {
    const raw = (req.query.username as string || "").trim();

    if (!raw) {
      return res.status(400).json({ available: false, message: "Username cannot be empty" });
    }

    // Format validation
    if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
      return res.status(200).json({
        available: false,
        message: "Only letters, numbers, and underscores are allowed",
      });
    }

    if (raw.length < 3) {
      return res.status(200).json({
        available: false,
        message: "Must be at least 3 characters",
      });
    }

    if (raw.length > 30) {
      return res.status(200).json({
        available: false,
        message: "Cannot exceed 30 characters",
      });
    }

    if (RESERVED_USERNAMES.has(raw.toLowerCase())) {
      return res.status(200).json({
        available: false,
        message: "Already used by someone",
      });
    }

    // Query Neon PostgreSQL
    const result = await query(
      `SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1;`,
      [raw]
    );

    if (result.rows.length > 0) {
      return res.status(200).json({
        available: false,
        message: "Already used by someone",
      });
    }

    return res.status(200).json({
      available: true,
      message: "Username is available",
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return res.status(500).json({ error: "Database error checking username" });
  }
});

/**
 * POST /api/users/google-auth
 * Signs in user with Google. Returns existing user or creates draft user if new.
 */
router.post("/google-auth", async (req: Request, res: Response) => {
  try {
    let { googleId, email, name, avatarUrl, idToken, isNewAccount } = req.body;

    // If real Google ID token is provided, verify it cryptographically
    if (idToken) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload) {
          googleId = payload.sub;
          email = payload.email;
          name = payload.name || name;
          avatarUrl = payload.picture || avatarUrl;
        }
      } catch (tokenErr) {
        console.warn("Could not verify Google ID token with library, using body values:", tokenErr);
      }
    }

    if (!googleId || !email) {
      return res.status(400).json({ error: "Missing required Google auth parameters" });
    }

    // Check if user already exists
    const existing = await query(
      `SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1;`,
      [googleId, email]
    );

    if (existing.rows.length > 0 && !isNewAccount) {
      const user = existing.rows[0];
      return res.status(200).json({
        user: {
          id: user.id,
          googleId: user.google_id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatar_url,
          initials: user.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          phone: user.phone,
          bio: user.bio,
          gender: user.gender,
          timezone: user.timezone,
          isOnboarded: user.is_onboarded,
        },
      });
    }

    // First time user or explicit create account mode
    const initials = (name || "Google User")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const fallbackAvatar =
      avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "User"
      )}&background=2563eb&color=ffffff&bold=true`;

    return res.status(200).json({
      user: {
        id: existing.rows[0]?.id || `temp_${Date.now()}`,
        googleId,
        email,
        username: "",
        name: name || "Google User",
        avatarUrl: fallbackAvatar,
        initials,
        gender: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        isOnboarded: false,
      },
    });
  } catch (error) {
    console.error("Google auth endpoint error:", error);
    return res.status(500).json({ error: "Internal server error during Google auth" });
  }
});

/**
 * POST /api/users/onboard
 * Completes user onboarding and inserts/updates the record in Neon PostgreSQL
 */
router.post("/onboard", async (req: Request, res: Response) => {
  try {
    const { googleId, email, username, name, avatarUrl, phone, bio, gender, timezone } = req.body;

    if (!googleId || !email || !username || !name) {
      return res.status(400).json({
        error: "Missing required onboarding fields: googleId, email, username, name",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Verify uniqueness
    const conflictCheck = await query(
      `SELECT id FROM users WHERE LOWER(username) = $1 AND email != $2 LIMIT 1;`,
      [cleanUsername, email]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ error: "Username is already used by someone" });
    }

    // Upsert into Neon PostgreSQL
    const upsertQuery = `
      INSERT INTO users (
        google_id,
        email,
        username,
        name,
        avatar_url,
        phone,
        bio,
        gender,
        timezone,
        is_onboarded,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW())
      ON CONFLICT (email) DO UPDATE SET
        google_id = EXCLUDED.google_id,
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        phone = EXCLUDED.phone,
        bio = EXCLUDED.bio,
        gender = EXCLUDED.gender,
        timezone = EXCLUDED.timezone,
        is_onboarded = TRUE,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await query(upsertQuery, [
      googleId,
      email,
      cleanUsername,
      name.trim(),
      avatarUrl,
      phone || null,
      bio || null,
      gender || null,
      timezone || "UTC",
    ]);

    const saved = result.rows[0];

    return res.status(201).json({
      success: true,
      user: {
        id: saved.id,
        googleId: saved.google_id,
        email: saved.email,
        username: saved.username,
        name: saved.name,
        avatarUrl: saved.avatar_url,
        initials: saved.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        phone: saved.phone,
        bio: saved.bio,
        gender: saved.gender,
        timezone: saved.timezone,
        isOnboarded: saved.is_onboarded,
        createdAt: saved.created_at,
      },
    });
  } catch (error) {
    console.error("Onboarding error in PostgreSQL:", error);
    return res.status(500).json({ error: "Failed to persist user in PostgreSQL" });
  }
});

/**
 * GET /api/users/search?q=query&orgId=uuid&currentUserId=uuid
 * Live search for existing registered OMeet users to invite into an organization
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const rawQ = (req.query.q as string || "").trim().replace(/^@/, "");
    const orgId = req.query.orgId as string || null;
    const currentUserId = (req.headers["x-user-id"] as string) || (req.query.currentUserId as string) || null;

    if (!rawQ || rawQ.length < 1) {
      return res.status(200).json({ users: [] });
    }

    const searchTerm = `%${rawQ}%`;

    const result = await query(
      `SELECT 
         u.id,
         u.name,
         u.username,
         u.email,
         u.avatar_url,
         u.bio,
         u.timezone
       FROM users u
       WHERE (
         u.username ILIKE $1 
         OR u.name ILIKE $1 
         OR u.email ILIKE $1
       )
       AND ($2::uuid IS NULL OR u.id != $2::uuid)
       AND ($3::uuid IS NULL OR u.id NOT IN (
         SELECT user_id FROM organization_employees WHERE organization_id = $3::uuid AND status = 'ACTIVE'
       ))
       AND ($3::uuid IS NULL OR u.id NOT IN (
         SELECT invitee_user_id FROM organization_invitations WHERE organization_id = $3::uuid AND status = 'PENDING'
       ))
       ORDER BY 
         CASE WHEN u.username ILIKE $1 THEN 1 ELSE 2 END,
         u.name ASC
       LIMIT 10;`,
      [searchTerm, currentUserId, orgId]
    );

    const users = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      email: row.email,
      avatarUrl: row.avatar_url,
      initials: row.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      bio: row.bio,
      timezone: row.timezone,
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error("User search error in PostgreSQL:", error);
    return res.status(500).json({ error: "Failed to search registered users." });
  }
});

export default router;
