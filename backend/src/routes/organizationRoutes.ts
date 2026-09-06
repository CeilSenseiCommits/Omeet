import { Router, Request, Response } from "express";
import { pool, query } from "../db";

const router = Router();

/**
 * POST /api/organizations
 * Creates a new organization and atomically registers the creator as OWNER (Employee #1)
 */
router.post("/", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { name, brief, description, size, position, userId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Organization name is required." });
    }
    if (!position || !position.trim()) {
      return res.status(400).json({ error: "Creator position/job title is required." });
    }
    if (!userId) {
      return res.status(400).json({ error: "User ID is required to assign organization ownership." });
    }

    // Verify creator exists in users table
    const userCheck = await client.query("SELECT id FROM users WHERE id = $1 LIMIT 1;", [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "Creator user not found in database." });
    }

    // Begin atomic transaction
    await client.query("BEGIN;");

    // 1. Insert into organizations
    const orgResult = await client.query(
      `INSERT INTO organizations (name, brief, description, size, employee_count, owner_id)
       VALUES ($1, $2, $3, $4, 1, $5)
       RETURNING *;`,
      [
        name.trim(),
        brief ? brief.trim() : null,
        description ? description.trim() : null,
        size || null,
        userId,
      ]
    );

    const newOrg = orgResult.rows[0];

    // 2. Insert creator into organization_employees as OWNER
    const empResult = await client.query(
      `INSERT INTO organization_employees (
         organization_id,
         user_id,
         position,
         role,
         status,
         joining_date,
         last_accessed_at
       )
       VALUES ($1, $2, $3, 'OWNER', 'ACTIVE', CURRENT_DATE, NOW())
       RETURNING *;`,
      [newOrg.id, userId, position.trim()]
    );

    await client.query("COMMIT;");

    return res.status(201).json({
      success: true,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        brief: newOrg.brief,
        description: newOrg.description,
        size: newOrg.size,
        employeeCount: newOrg.employee_count,
        ownerId: newOrg.owner_id,
        createdAt: newOrg.created_at,
      },
      membership: {
        id: empResult.rows[0].id,
        role: "OWNER",
        position: empResult.rows[0].position,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK;");
    console.error("Failed to create organization in PostgreSQL:", error);
    return res.status(500).json({ error: "Database transaction failed while creating organization." });
  } finally {
    client.release();
  }
});

/**
 * GET /api/organizations/user/:userId
 * Fetches all organizations a user belongs to (for Home Page carousel)
 */
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT 
         o.id,
         o.name,
         o.brief,
         o.description,
         o.size,
         o.employee_count,
         o.owner_id,
         oe.role,
         oe.position,
         oe.status,
         oe.last_accessed_at,
         oe.joining_date
       FROM organization_employees oe
       JOIN organizations o ON o.id = oe.organization_id
       WHERE oe.user_id = $1 AND oe.status = 'ACTIVE'
       ORDER BY oe.last_accessed_at DESC;`,
      [userId]
    );

    const organizations = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      brief: row.brief,
      description: row.description,
      size: row.size,
      employeeCount: row.employee_count,
      role: row.role,
      position: row.position,
      isOwner: row.role === "OWNER" || row.owner_id === userId,
      lastAccessedAt: row.last_accessed_at,
      joiningDate: row.joining_date,
    }));

    return res.status(200).json({ organizations });
  } catch (error) {
    console.error("Failed to query user organizations:", error);
    return res.status(500).json({ error: "Failed to fetch organizations from database." });
  }
});

/**
 * GET /api/organizations/:id
 * Fetches single organization details with access control verification
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    // Fetch org
    const orgResult = await query("SELECT * FROM organizations WHERE id = $1 LIMIT 1;", [id]);
    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found." });
    }

    const org = orgResult.rows[0];

    // Access control check: Check if requesting user is an active employee or owner
    let membership = null;
    if (userId) {
      const memberCheck = await query(
        "SELECT * FROM organization_employees WHERE organization_id = $1 AND user_id = $2 AND status = 'ACTIVE' LIMIT 1;",
        [id, userId]
      );
      if (memberCheck.rows.length > 0) {
        membership = memberCheck.rows[0];
      }
    }

    return res.status(200).json({
      organization: {
        id: org.id,
        name: org.name,
        brief: org.brief,
        description: org.description,
        size: org.size,
        employeeCount: org.employee_count,
        ownerId: org.owner_id,
        createdAt: org.created_at,
      },
      userMembership: membership
        ? {
            role: membership.role,
            position: membership.position,
            status: membership.status,
            isOwner: membership.role === "OWNER" || org.owner_id === userId,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch organization details:", error);
    return res.status(500).json({ error: "Database error fetching organization." });
  }
});

export default router;
