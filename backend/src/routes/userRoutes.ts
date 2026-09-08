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

    // If user already exists with this Google account or Gmail, always use the existing account!
    if (existing.rows.length > 0 && existing.rows[0].is_onboarded) {
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
          isOnboarded: true,
        },
      });
    }

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

    // Check if an account already exists and is onboarded with this email - prevent creating a duplicate ID
    const alreadyOnboarded = await query(
      `SELECT * FROM users WHERE email = $1 AND is_onboarded = TRUE LIMIT 1;`,
      [email]
    );
    if (alreadyOnboarded.rows.length > 0) {
      const user = alreadyOnboarded.rows[0];
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
          isOnboarded: true,
        },
        message: "You already have an active account with this email.",
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
         u.timezone,
         COALESCE(
           (
             SELECT o.name 
             FROM organization_employees oe 
             JOIN organizations o ON o.id = oe.organization_id 
             WHERE oe.user_id = u.id AND oe.status = 'ACTIVE' 
             ORDER BY oe.created_at ASC 
             LIMIT 1
           ),
           'OMeet Network'
         ) AS organization,
         COALESCE(
           (
             SELECT oe.position 
             FROM organization_employees oe 
             WHERE oe.user_id = u.id AND oe.status = 'ACTIVE' 
             ORDER BY oe.created_at ASC 
             LIMIT 1
           ),
           'Member'
         ) AS position
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
      initials: (row.name || "User")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      bio: row.bio,
      timezone: row.timezone,
      organization: row.organization,
      position: row.position,
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error("User search error in PostgreSQL:", error);
    return res.status(500).json({ error: "Failed to search registered users." });
  }
});

/**
 * GET /api/users/profile/:userId
 * Returns public user profile from PostgreSQL
 */
router.get("/profile/:userId", async (req: Request, res: Response) => {
  try {
    const rawId = (req.params.userId as string || "").trim();
    if (!rawId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await query(
      `SELECT * FROM users WHERE (id::text = $1 OR username = $1) LIMIT 1;`,
      [rawId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const u = result.rows[0];

    // Fetch active organizations
    const orgsResult = await query(
      `SELECT 
         o.id AS organization_id,
         o.name AS organization_name,
         oe.position,
         oe.role
       FROM organization_employees oe
       JOIN organizations o ON o.id = oe.organization_id
       WHERE oe.user_id = $1 AND oe.status = 'ACTIVE'
       ORDER BY oe.created_at ASC;`,
      [u.id]
    );

    const primaryOrg = orgsResult.rows[0];

    // Check friendship status if callerUserId is provided
    const callerUserId = ((req.headers["x-user-id"] as string) || (req.query.currentUserId as string) || "").trim();
    let friendshipStatus: "SELF" | "FRIENDS" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE" = "NONE";
    let friendshipId: string | null = null;

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (callerUserId && isUUID(callerUserId) && isUUID(u.id)) {
      if (callerUserId === u.id) {
        friendshipStatus = "SELF";
      } else {
        const friendResult = await query(
          `SELECT id, status, sender_user_id, receiver_user_id
           FROM friendships
           WHERE (sender_user_id = $1 AND receiver_user_id = $2)
              OR (sender_user_id = $2 AND receiver_user_id = $1)
           LIMIT 1;`,
          [callerUserId, u.id]
        );

        if (friendResult.rows.length > 0) {
          const fRow = friendResult.rows[0];
          friendshipId = fRow.id;
          if (fRow.status === "ACCEPTED") {
            friendshipStatus = "FRIENDS";
          } else if (fRow.status === "PENDING") {
            if (fRow.sender_user_id === callerUserId) {
              friendshipStatus = "REQUEST_SENT";
            } else {
              friendshipStatus = "REQUEST_RECEIVED";
            }
          } else {
            friendshipStatus = "NONE";
          }
        }
      }
    }

    return res.status(200).json({
      user: {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatar_url,
        initials: (u.name || "User")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        bio: u.bio || "Member of the OMeet collaboration ecosystem.",
        location: u.timezone || "Global (UTC)",
        timezone: u.timezone,
        position: primaryOrg?.position || "Member",
        organization: primaryOrg?.organization_name || "OMeet Network",
        organizations: orgsResult.rows.map((r: any) => r.organization_name),
        skills: ["Collaboration", "Real-Time Comms", "Team Productivity"],
        friendshipStatus,
        friendshipId,
      },
    });
  } catch (error) {
    console.error("Profile fetch error in PostgreSQL:", error);
    return res.status(500).json({ error: "Failed to load user profile" });
  }
});

/**
 * Helper to compute human-readable relative time
 */
function formatTimeAgo(dateInput: string | Date): string {
  const diffMs = Date.now() - new Date(dateInput).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

/**
 * GET /api/users/:userId/activity
 * Fetches real activity stream from PostgreSQL (meetings, new team members, invitations)
 */
router.get("/:userId/activity", async (req: Request, res: Response) => {
  try {
    const rawId = (req.params.userId as string || "").trim();
    if (!rawId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const activities: Array<{
      id: string;
      organization: string;
      description: string;
      timestamp: string;
      dotClass?: string;
      rawTime: Date;
    }> = [];

    // 1. Fetch recent meetings from organization_meetings
    const meetingsRes = await query(
      `SELECT 
         m.id, 
         m.title, 
         m.status, 
         m.created_at, 
         COALESCE(o.name, 'Open Meeting') AS organization_name
       FROM organization_meetings m
       LEFT JOIN organizations o ON o.id = m.organization_id
       WHERE m.host_user_id = $1::uuid
          OR m.organization_id IN (
            SELECT organization_id FROM organization_employees WHERE user_id = $1::uuid AND status = 'ACTIVE'
          )
       ORDER BY m.created_at DESC
       LIMIT 6;`,
      [rawId]
    );

    for (const m of meetingsRes.rows) {
      activities.push({
        id: `meet-${m.id}`,
        organization: m.organization_name,
        description: `Meeting "${m.title}" is ${m.status.toLowerCase()}`,
        timestamp: formatTimeAgo(m.created_at),
        dotClass: "bg-[#4963C8]",
        rawTime: new Date(m.created_at),
      });
    }

    // 2. Fetch new members who joined user's organizations
    const membersRes = await query(
      `SELECT 
         oe.id, 
         oe.position,
         oe.created_at, 
         u.name AS user_name,
         o.name AS organization_name
       FROM organization_employees oe
       JOIN users u ON u.id = oe.user_id
       JOIN organizations o ON o.id = oe.organization_id
       WHERE oe.organization_id IN (
         SELECT organization_id FROM organization_employees WHERE user_id = $1::uuid AND status = 'ACTIVE'
       )
       ORDER BY oe.created_at DESC
       LIMIT 6;`,
      [rawId]
    );

    for (const emp of membersRes.rows) {
      activities.push({
        id: `emp-${emp.id}`,
        organization: emp.organization_name,
        description: `${emp.user_name} joined as ${emp.position}`,
        timestamp: formatTimeAgo(emp.created_at),
        dotClass: "bg-[#10B981]",
        rawTime: new Date(emp.created_at),
      });
    }

    // 3. Fetch recent invitations involving this user
    const invitesRes = await query(
      `SELECT 
         oi.id, 
         oi.position, 
         oi.status, 
         oi.created_at, 
         o.name AS organization_name
       FROM organization_invitations oi
       JOIN organizations o ON o.id = oi.organization_id
       WHERE oi.invitee_user_id = $1::uuid OR oi.inviter_user_id = $1::uuid
       ORDER BY oi.created_at DESC
       LIMIT 6;`,
      [rawId]
    );

    for (const inv of invitesRes.rows) {
      activities.push({
        id: `inv-${inv.id}`,
        organization: inv.organization_name,
        description: `Invitation for ${inv.position} (${inv.status.toLowerCase()})`,
        timestamp: formatTimeAgo(inv.created_at),
        dotClass: "bg-[#D97706]",
        rawTime: new Date(inv.created_at),
      });
    }

    // Sort descending by rawTime
    activities.sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime());

    const result = activities.slice(0, 8).map(({ id, organization, description, timestamp, dotClass }) => ({
      id,
      organization,
      description,
      timestamp,
      dotClass,
    }));

    return res.status(200).json({ activities: result });
  } catch (error) {
    console.error("Activity fetch error in PostgreSQL:", error);
    return res.status(500).json({ error: "Failed to load user activity" });
  }
});

export default router;
