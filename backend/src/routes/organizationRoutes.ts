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

    // 2. Insert creator into organization_employees as OWNER with has_permission = true
    const empResult = await client.query(
      `INSERT INTO organization_employees (
         organization_id,
         user_id,
         position,
         role,
         status,
         has_permission,
         joining_date,
         last_accessed_at
       )
       VALUES ($1, $2, $3, 'OWNER', 'ACTIVE', TRUE, CURRENT_DATE, NOW())
       RETURNING *;`,
      [newOrg.id, userId, position.trim()]
    );

    // 3. Create default public channels (# general, # random) and enroll creator
    const genRes = await client.query(
      `INSERT INTO conversations (organization_id, type, name, topic, is_private, created_by)
       VALUES ($1, 'CHANNEL', 'general', 'Company-wide announcements and general discussion', FALSE, $2)
       RETURNING id;`,
      [newOrg.id, userId]
    );
    const randRes = await client.query(
      `INSERT INTO conversations (organization_id, type, name, topic, is_private, created_by)
       VALUES ($1, 'CHANNEL', 'random', 'Casual discussions and watercooler chat', FALSE, $2)
       RETURNING id;`,
      [newOrg.id, userId]
    );
    await client.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, 'OWNER'), ($3, $2, 'OWNER');`,
      [genRes.rows[0].id, userId, randRes.rows[0].id]
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
 * Fetches single organization details for the workspace layout
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    // 1. Fetch org
    const orgResult = await query("SELECT * FROM organizations WHERE id = $1 LIMIT 1;", [id]);
    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found." });
    }

    const org = orgResult.rows[0];

    // 2. Count active live meetings
    const liveMeetingsResult = await query(
      `SELECT COUNT(*) FROM organization_meetings WHERE organization_id = $1 AND status = 'LIVE';`,
      [id]
    );
    const activeMeetingsCount = parseInt(liveMeetingsResult.rows[0]?.count || "0", 10);

    // 3. Check membership
    let membership = null;
    if (userId) {
      const memberCheck = await query(
        `SELECT oe.*, u.name, u.avatar_url 
         FROM organization_employees oe
         JOIN users u ON u.id = oe.user_id
         WHERE oe.organization_id = $1 AND oe.user_id = $2 AND oe.status = 'ACTIVE' 
         LIMIT 1;`,
        [id, userId]
      );
      if (memberCheck.rows.length > 0) {
        membership = memberCheck.rows[0];
      }
    }

    // 4. Fetch leadership / hierarchy root
    const ownerResult = await query(
      `SELECT u.id, u.name, oe.position, oe.role 
       FROM organization_employees oe
       JOIN users u ON u.id = oe.user_id
       WHERE oe.organization_id = $1 AND (oe.role = 'OWNER' OR oe.manager_employee_id IS NULL)
       LIMIT 1;`,
      [id]
    );
    const owner = ownerResult.rows[0];

    const initials = (org.name || "Org")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const hierarchy = {
      id: "root-leadership",
      name: "Executive Leadership",
      manager: owner ? `${owner.name} (${owner.position || "Owner"})` : "Founding Team",
      members: org.employee_count,
      activeMeetings: activeMeetingsCount,
      description: org.brief || org.description || "Core organizational leadership.",
      recentActivity: "Active organizational workspace.",
    };

    return res.status(200).json({
      organization: {
        id: org.id,
        name: org.name,
        initials,
        accent: "#d946ef",
        brief: org.brief,
        description: org.description || org.brief || "No description provided.",
        size: org.size,
        employeeCount: org.employee_count,
        memberCount: org.employee_count,
        activeMeetings: activeMeetingsCount,
        status: "Active",
        ownerId: org.owner_id,
        createdAt: org.created_at,
        hierarchy,
        aiSummary: `${org.name} currently has ${org.employee_count} active team member(s) collaborating in this workspace.`,
      },
      userMembership: membership
        ? {
            role: membership.role,
            position: membership.position,
            status: membership.status,
            hasPermission: membership.has_permission || membership.role === "OWNER",
            isOwner: membership.role === "OWNER" || org.owner_id === userId,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch organization details:", error);
    return res.status(500).json({ error: "Database error fetching organization." });
  }
});

/**
 * GET /api/organizations/:id/conversations
 * Returns channels, direct messages, and groups for OrgSidebar
 */
router.get("/:id/conversations", async (req: Request, res: Response) => {
  try {
    const orgId = req.params.id;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    // 1. Fetch channels user is participant of OR public channels
    const channelsResult = await query(
      `SELECT c.id, c.name, c.type, c.topic, c.is_private,
              COALESCE(cp.last_read_at, NOW()) AS last_read_at
       FROM conversations c
       LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
       WHERE c.organization_id = $1 AND c.type = 'CHANNEL' AND (c.is_private = FALSE OR cp.user_id IS NOT NULL)
       ORDER BY c.name ASC;`,
      [orgId, userId || null]
    );

    const chatRooms = channelsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      unreadCount: 0,
      active: true,
    }));

    // 2. Fetch groups
    const groupsResult = await query(
      `SELECT c.id, c.name, c.topic
       FROM conversations c
       WHERE c.organization_id = $1 AND c.type = 'GROUP'
       ORDER BY c.name ASC;`,
      [orgId]
    );

    const groups = groupsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      unreadCount: 0,
      active: true,
    }));

    // 3. Fetch direct messages (other active employees in this org)
    const employeesResult = await query(
      `SELECT u.id, u.name, u.avatar_url, oe.position, oe.last_accessed_at
       FROM organization_employees oe
       JOIN users u ON u.id = oe.user_id
       WHERE oe.organization_id = $1 AND oe.status = 'ACTIVE'
         AND ($2::uuid IS NULL OR u.id != $2::uuid)
       ORDER BY oe.last_accessed_at DESC;`,
      [orgId, userId || null]
    );

    const directMessages = employeesResult.rows.map((emp) => {
      const isRecent = emp.last_accessed_at && (Date.now() - new Date(emp.last_accessed_at).getTime() < 15 * 60 * 1000);
      return {
        id: `dm-${emp.id}`,
        name: emp.name,
        role: emp.position || "Member",
        lastSeen: isRecent ? "Active now" : "Offline",
        unreadCount: 0,
        active: !!isRecent,
      };
    });

    return res.status(200).json({
      chatRooms,
      groups,
      directMessages,
    });
  } catch (error) {
    console.error("Failed to fetch organization conversations:", error);
    return res.status(500).json({ error: "Failed to load conversations." });
  }
});

/**
 * GET /api/organizations/:id/meetings
 * Returns ongoing, upcoming, and recently ended meetings for MeetingsTab
 */
router.get("/:id/meetings", async (req: Request, res: Response) => {
  try {
    const orgId = req.params.id;

    const meetingsResult = await query(
      `SELECT 
         m.id,
         m.meeting_code,
         m.title,
         m.status,
         m.scope,
         m.scheduled_at,
         m.started_at,
         m.ended_at,
         m.has_recording,
         m.has_ai_summary,
         u.name AS host_name,
         u.avatar_url AS host_avatar_url,
         c.name AS channel_name
       FROM organization_meetings m
       JOIN users u ON u.id = m.host_user_id
       LEFT JOIN conversations c ON c.id = m.conversation_id
       WHERE m.organization_id = $1
       ORDER BY m.scheduled_at ASC;`,
      [orgId]
    );

    const ongoingMeetings = meetingsResult.rows
      .filter((m) => m.status === "LIVE")
      .map((m) => ({
        id: m.id,
        title: m.title,
        group: m.channel_name ? `#${m.channel_name}` : "Workspace Sync",
        participants: [m.host_name],
        meetingCode: m.meeting_code,
      }));

    const upcomingMeetings = meetingsResult.rows
      .filter((m) => m.status === "SCHEDULED")
      .map((m) => {
        const d = new Date(m.scheduled_at);
        return {
          id: m.id,
          title: m.title,
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          organizer: m.host_name,
          group: m.channel_name ? `#${m.channel_name}` : "Workspace Sync",
          status: "Scheduled",
          meetingCode: m.meeting_code,
        };
      });

    const recentlyEndedMeetings = meetingsResult.rows
      .filter((m) => m.status === "ENDED")
      .map((m) => {
        let duration = "30m";
        if (m.started_at && m.ended_at) {
          const mins = Math.round((new Date(m.ended_at).getTime() - new Date(m.started_at).getTime()) / 60000);
          duration = `${mins}m`;
        }
        return {
          id: m.id,
          title: m.title,
          duration,
          recordingAvailable: m.has_recording,
          aiSummaryAvailable: m.has_ai_summary,
        };
      });

    return res.status(200).json({
      ongoingMeetings,
      upcomingMeetings,
      recentlyEndedMeetings,
    });
  } catch (error) {
    console.error("Failed to fetch organization meetings:", error);
    return res.status(500).json({ error: "Failed to load meetings." });
  }
});

/**
 * POST /api/organizations/:id/meetings
 * Schedules or starts a new meeting
 */
router.post("/:id/meetings", async (req: Request, res: Response) => {
  try {
    const orgId = req.params.id;
    const { title, scheduledAt, scope, conversationId, userId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Meeting title is required." });
    }
    if (!userId) {
      return res.status(401).json({ error: "Host user ID is required." });
    }

    const meetingDate = scheduledAt ? new Date(scheduledAt) : new Date();
    const isInstant = !scheduledAt || new Date(scheduledAt).getTime() <= Date.now() + 60000;
    const status = isInstant ? "LIVE" : "SCHEDULED";

    // Generate unique meeting code: e.g. OM-7F2A9B
    const hex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const meetingCode = `OM-${hex}`;

    const insertResult = await query(
      `INSERT INTO organization_meetings (
         organization_id,
         conversation_id,
         meeting_code,
         title,
         host_user_id,
         status,
         scope,
         scheduled_at,
         started_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *;`,
      [
        orgId,
        conversationId || null,
        meetingCode,
        title.trim(),
        userId,
        status,
        scope || "ORG_WIDE",
        meetingDate,
        isInstant ? new Date() : null,
      ]
    );

    const meeting = insertResult.rows[0];

    return res.status(201).json({
      success: true,
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meeting_code,
        title: meeting.title,
        status: meeting.status,
        scheduledAt: meeting.scheduled_at,
      },
    });
  } catch (error) {
    console.error("Failed to create meeting in database:", error);
    return res.status(500).json({ error: "Failed to create meeting." });
  }
});

/**
 * GET /api/organizations/:id/members
 * Returns employee roster for Members tab and right panel
 */
router.get("/:id/members", async (req: Request, res: Response) => {
  try {
    const orgId = req.params.id;

    const result = await query(
      `SELECT 
         oe.id AS employee_id,
         oe.position,
         oe.role,
         oe.department,
         oe.has_permission,
         oe.joining_date,
         oe.last_accessed_at,
         u.id AS user_id,
         u.name,
         u.username,
         u.avatar_url,
         u.bio,
         u.timezone,
         u_manager.name AS manager_name
       FROM organization_employees oe
       JOIN users u ON u.id = oe.user_id
       LEFT JOIN organization_employees oe_manager ON oe_manager.id = oe.manager_employee_id
       LEFT JOIN users u_manager ON u_manager.id = oe_manager.user_id
       WHERE oe.organization_id = $1 AND oe.status = 'ACTIVE'
       ORDER BY 
         CASE WHEN oe.role = 'OWNER' THEN 1 WHEN oe.role = 'ADMIN' THEN 2 ELSE 3 END,
         oe.created_at ASC;`,
      [orgId]
    );

    const members = result.rows.map((row) => ({
      id: row.user_id,
      employeeId: row.employee_id,
      name: row.name,
      username: row.username,
      avatarUrl: row.avatar_url,
      position: row.position,
      role: row.role,
      department: row.department,
      managerName: row.manager_name,
      hasPermission: row.has_permission,
      joiningDate: row.joining_date,
      lastAccessedAt: row.last_accessed_at,
    }));

    return res.status(200).json({ members });
  } catch (error) {
    console.error("Failed to fetch organization members:", error);
    return res.status(500).json({ error: "Failed to fetch members." });
  }
});

export default router;

