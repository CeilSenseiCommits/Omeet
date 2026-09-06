import { Router, Request, Response } from "express";
import { pool, query } from "../db";
import { autoCleanExpiredMeetings } from "./meetingRoutes";

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
              COALESCE(cp.last_read_at, NOW()) AS last_read_at,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM messages m
                  WHERE m.conversation_id = c.id
                    AND ($2::uuid IS NULL OR m.sender_id != $2::uuid)
                    AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
                ),
                0
              ) AS unread_count
       FROM conversations c
       LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
       WHERE c.organization_id = $1 AND c.type = 'CHANNEL' AND (c.is_private = FALSE OR cp.user_id IS NOT NULL)
       ORDER BY c.name ASC;`,
      [orgId, userId || null]
    );

    const chatRooms = channelsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      unreadCount: Number(row.unread_count || 0),
      active: true,
    }));

    // 2. Fetch groups with live unread counts
    const groupsResult = await query(
      `SELECT c.id, c.name, c.topic,
              COALESCE(
                (
                  SELECT COUNT(*)::int
                  FROM messages m
                  JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
                  WHERE m.conversation_id = c.id
                    AND ($2::uuid IS NULL OR m.sender_id != $2::uuid)
                    AND m.created_at > cp.last_read_at
                ),
                0
              ) AS unread_count
       FROM conversations c
       WHERE c.organization_id = $1 AND c.type = 'GROUP'
       ORDER BY c.created_at ASC;`,
      [orgId, userId || null]
    );

    const groups = groupsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      unreadCount: Number(row.unread_count || 0),
      active: true,
    }));

    // 3. Fetch direct conversations with live unread count (most recently talked sorted)
    let directMessages: any[] = [];
    if (userId) {
      const dmResult = await query(
        `SELECT 
           c.id AS conversation_id,
           c.updated_at,
           u_other.id AS other_user_id,
           u_other.name AS other_user_name,
           u_other.avatar_url,
           oe.position,
           oe.last_accessed_at,
           COALESCE(
             (
               SELECT COUNT(*)::int
               FROM messages m
               WHERE m.conversation_id = c.id
                 AND m.sender_id = u_other.id
                 AND m.created_at > cp_me.last_read_at
             ),
             0
           ) AS unread_count
         FROM conversations c
         JOIN conversation_participants cp_me ON cp_me.conversation_id = c.id AND cp_me.user_id = $2
         JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != $2
         JOIN users u_other ON u_other.id = cp_other.user_id
         JOIN organization_employees oe ON oe.user_id = u_other.id AND oe.organization_id = $1 AND oe.status = 'ACTIVE'
         WHERE c.organization_id = $1 AND c.type = 'DIRECT'
         ORDER BY c.updated_at DESC;`,
        [orgId, userId]
      );

      directMessages = dmResult.rows.map((row) => {
        const isRecent = row.last_accessed_at && (Date.now() - new Date(row.last_accessed_at).getTime() < 15 * 60 * 1000);
        return {
          id: row.conversation_id,
          userId: row.other_user_id,
          name: row.other_user_name,
          avatarUrl: row.avatar_url,
          role: row.position || "Member",
          lastSeen: isRecent ? "Active now" : "Offline",
          unreadCount: Number(row.unread_count || 0),
          active: !!isRecent,
        };
      });
    }

    // 4. Fetch all organization members for DM prefix search
    const allMembersResult = await query(
      `SELECT u.id, u.name, u.username, u.avatar_url, oe.position, oe.department, oe.last_accessed_at
       FROM organization_employees oe
       JOIN users u ON u.id = oe.user_id
       WHERE oe.organization_id = $1 AND oe.status = 'ACTIVE'
         AND ($2::uuid IS NULL OR u.id != $2::uuid)
       ORDER BY u.name ASC;`,
      [orgId, userId || null]
    );

    const allMembers = allMembersResult.rows.map((emp) => {
      const isRecent = emp.last_accessed_at && (Date.now() - new Date(emp.last_accessed_at).getTime() < 15 * 60 * 1000);
      return {
        id: `dm-${emp.id}`,
        userId: emp.id,
        name: emp.name,
        username: emp.username,
        avatarUrl: emp.avatar_url,
        role: emp.position || "Member",
        department: emp.department,
        lastSeen: isRecent ? "Active now" : "Offline",
        unreadCount: 0,
        active: !!isRecent,
      };
    });

    return res.status(200).json({
      chatRooms,
      groups,
      directMessages,
      allMembers,
    });
  } catch (error) {
    console.error("Failed to fetch organization conversations:", error);
    return res.status(500).json({ error: "Failed to load conversations." });
  }
});

/**
 * POST /api/organizations/:id/conversations/:convId/read
 * Marks a conversation as read by updating caller's last_read_at in conversation_participants
 */
router.post("/:id/conversations/:convId/read", async (req: Request, res: Response) => {
  try {
    const { convId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }

    await query(
      `INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (conversation_id, user_id) 
       DO UPDATE SET last_read_at = NOW();`,
      [convId, userId]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to mark conversation as read:", error);
    return res.status(500).json({ error: "Failed to mark as read." });
  }
});

/**
 * GET /api/organizations/:id/meetings
 * Returns ongoing, upcoming, and recently ended meetings for MeetingsTab
 */
router.get("/:id/meetings", async (req: Request, res: Response) => {
  try {
    const orgId = String(req.params.id || "");
    const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string) || "";

    // Run auto-clean rules for expired/abandoned meetings
    await autoCleanExpiredMeetings(orgId);

    const meetingsResult = await query(
      `SELECT 
         m.id,
         m.meeting_code,
         m.title,
         m.status,
         m.scope,
         m.is_hierarchical,
         m.scheduled_at,
         m.started_at,
         m.ended_at,
         m.has_recording,
         m.has_ai_summary,
         m.host_user_id,
         u.name AS host_name,
         u.avatar_url AS host_avatar_url,
         c.name AS channel_name,
         COALESCE(
           (
             SELECT json_agg(json_build_object('id', pu.id, 'name', pu.name, 'avatarUrl', pu.avatar_url, 'role', mp.role))
             FROM meeting_participants mp
             JOIN users pu ON pu.id = mp.user_id
             WHERE mp.meeting_id = m.id
           ),
           '[]'::json
         ) AS participants_data
       FROM organization_meetings m
       JOIN users u ON u.id = m.host_user_id
       LEFT JOIN conversations c ON c.id = m.conversation_id
       WHERE m.organization_id = $1
         AND (
           m.status = 'LIVE' 
           OR m.status = 'ENDED'
           OR ($2::varchar = '' OR m.scope = 'ORG_WIDE' OR m.host_user_id = $2::uuid OR EXISTS (
             SELECT 1 FROM meeting_participants mp2 WHERE mp2.meeting_id = m.id AND mp2.user_id = $2::uuid
           ) OR EXISTS (
             SELECT 1 FROM meeting_invitations mi2 WHERE mi2.meeting_id = m.id AND mi2.invitee_user_id = $2::uuid
           ))
         )
       ORDER BY m.scheduled_at ASC;`,
      [orgId, userId || "00000000-0000-0000-0000-000000000000"]
    );

    const ongoingMeetings = meetingsResult.rows
      .filter((m) => m.status === "LIVE")
      .map((m) => {
        const participantNames = Array.isArray(m.participants_data) && m.participants_data.length > 0
          ? m.participants_data.map((p: any) => p.name)
          : [m.host_name];
        return {
          id: m.id,
          title: m.title,
          group: m.channel_name ? `#${m.channel_name}` : "Workspace Sync",
          participants: participantNames,
          meetingCode: m.meeting_code,
          isHierarchical: m.is_hierarchical,
        };
      });

    const upcomingMeetings = meetingsResult.rows
      .filter((m) => m.status === "SCHEDULED")
      .map((m) => {
        const d = new Date(m.scheduled_at);
        const participantNames = Array.isArray(m.participants_data) && m.participants_data.length > 0
          ? m.participants_data.map((p: any) => p.name)
          : [m.host_name];
        return {
          id: m.id,
          title: m.title,
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          organizer: m.host_name,
          group: m.channel_name ? `#${m.channel_name}` : "Workspace Sync",
          status: "Scheduled",
          meetingCode: m.meeting_code,
          participants: participantNames,
          isHierarchical: m.is_hierarchical,
        };
      });

    const recentlyEndedMeetings = meetingsResult.rows
      .filter((m) => m.status === "ENDED")
      .sort((a, b) => new Date(b.ended_at || b.scheduled_at).getTime() - new Date(a.ended_at || a.scheduled_at).getTime())
      .slice(0, 10)
      .map((m) => {
        let duration = "15m";
        if (m.started_at && m.ended_at) {
          const mins = Math.max(1, Math.round((new Date(m.ended_at).getTime() - new Date(m.started_at).getTime()) / 60000));
          duration = `${mins}m`;
        }
        let timeAgo = "Just now";
        if (m.ended_at) {
          const diffMins = Math.round((Date.now() - new Date(m.ended_at).getTime()) / 60000);
          if (diffMins < 1) timeAgo = "Just now";
          else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
          else {
            const hrs = Math.round(diffMins / 60);
            timeAgo = `${hrs}h ago`;
          }
        }
        const participantNames = Array.isArray(m.participants_data) && m.participants_data.length > 0
          ? m.participants_data.map((p: any) => p.name)
          : [m.host_name];

        return {
          id: m.id,
          title: m.title,
          meetingCode: m.meeting_code,
          duration,
          timeAgo,
          endedAt: m.ended_at,
          isHierarchical: m.is_hierarchical,
          hostName: m.host_name,
          participants: participantNames,
          participantsCount: participantNames.length,
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
    const { title, meetingType, scheduledAt, scope, participantUserIds, conversationId, userId, isHierarchical } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Meeting title is required." });
    }
    if (!userId) {
      return res.status(401).json({ error: "Host user ID is required." });
    }

    const isInstant = meetingType === "INSTANT" || (!scheduledAt && meetingType !== "SCHEDULED");
    const status = isInstant ? "LIVE" : "SCHEDULED";
    const meetingDate = scheduledAt ? new Date(scheduledAt) : new Date();
    const isHierarchicalMode = typeof isHierarchical === "boolean" ? isHierarchical : false;

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
         is_hierarchical,
         meeting_type,
         scheduled_at,
         started_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *;`,
      [
        orgId,
        conversationId || null,
        meetingCode,
        title.trim(),
        userId,
        status,
        scope || "ORG_WIDE",
        isHierarchicalMode,
        isInstant ? "INSTANT" : "SCHEDULED",
        meetingDate,
        isInstant ? new Date() : null,
      ]
    );

    const meeting = insertResult.rows[0];

    // 1. Insert host participant
    await query(
      `INSERT INTO meeting_participants (meeting_id, user_id, role, joined_at)
       VALUES ($1, $2, 'HOST', NOW())
       ON CONFLICT (meeting_id, user_id) DO NOTHING;`,
      [meeting.id, userId]
    );

    // 2. Insert invited participants & meeting invitations
    if (Array.isArray(participantUserIds) && participantUserIds.length > 0) {
      for (const pId of participantUserIds) {
        if (!pId || pId === userId) continue;
        // Participant table
        await query(
          `INSERT INTO meeting_participants (meeting_id, user_id, role, joined_at)
           VALUES ($1, $2, 'LISTENER', NOW())
           ON CONFLICT (meeting_id, user_id) DO NOTHING;`,
          [meeting.id, pId]
        );
        // Invitation notification record
        await query(
          `INSERT INTO meeting_invitations (meeting_id, organization_id, inviter_user_id, invitee_user_id, status)
           VALUES ($1, $2, $3, $4, 'PENDING')
           ON CONFLICT (meeting_id, invitee_user_id) DO NOTHING;`,
          [meeting.id, orgId, userId, pId]
        );
      }
    }

    // 3. If tied to conversation, post system activity message
    if (conversationId) {
      const hostUserRes = await query("SELECT name FROM users WHERE id = $1;", [userId]);
      const hostName = hostUserRes.rows[0]?.name || "Someone";
      const actionText = isInstant
        ? `${hostName} started an instant meeting: "${title.trim()}" (Code: ${meetingCode})`
        : `${hostName} scheduled a meeting: "${title.trim()}" for ${meetingDate.toLocaleString()} (Code: ${meetingCode})`;

      await query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, 'SYSTEM');`,
        [conversationId, userId, actionText]
      );
    }

    return res.status(201).json({
      success: true,
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meeting_code,
        title: meeting.title,
        status: meeting.status,
        meetingType: meeting.meeting_type,
        isHierarchical: meeting.is_hierarchical,
        scheduledAt: meeting.scheduled_at,
      },
    });
  } catch (error) {
    console.error("Failed to create meeting in database:", error);
    return res.status(500).json({ error: "Failed to create meeting." });
  }
});

/**
 * POST /api/organizations/:id/groups
 * Creates a new team group in the organization
 */
router.post("/:id/groups", async (req: Request, res: Response) => {
  try {
    const orgId = req.params.id;
    const { name, topic, userId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required." });
    }

    const groupResult = await query(
      `INSERT INTO conversations (organization_id, type, name, topic, is_private, created_by)
       VALUES ($1, 'GROUP', $2, $3, FALSE, $4)
       RETURNING *;`,
      [orgId, name.trim(), topic ? topic.trim() : null, userId || null]
    );

    const newGroup = groupResult.rows[0];

    // Add creator as owner participant if userId provided
    if (userId) {
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role)
         VALUES ($1, $2, 'OWNER')
         ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
        [newGroup.id, userId]
      );
    }

    return res.status(201).json({
      success: true,
      group: {
        id: newGroup.id,
        name: newGroup.name,
        topic: newGroup.topic,
        unreadCount: 0,
        active: true,
      },
    });
  } catch (error) {
    console.error("Failed to create group in PostgreSQL:", error);
    return res.status(500).json({ error: "Failed to create group." });
  }
});

/**
 * POST /api/organizations/:id/conversations/direct
 * Gets or creates a 1-on-1 direct conversation with another member
 */
router.post("/:id/conversations/direct", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const orgId = req.params.id;
    const { userId, targetUserId } = req.body;

    if (!userId || !targetUserId) {
      return res.status(400).json({ error: "Both user ID and target user ID are required." });
    }

    // 1. Check if direct conversation already exists between these 2 users in this org
    const existingResult = await client.query(
      `SELECT c.id 
       FROM conversations c
       JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = $2
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = $3
       WHERE c.organization_id = $1 AND c.type = 'DIRECT'
       LIMIT 1;`,
      [orgId, userId, targetUserId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        conversationId: existingResult.rows[0].id,
      });
    }

    // 2. Otherwise, create a new direct conversation atomically
    await client.query("BEGIN;");

    const convResult = await client.query(
      `INSERT INTO conversations (organization_id, type, is_private, created_by)
       VALUES ($1, 'DIRECT', TRUE, $2)
       RETURNING id;`,
      [orgId, userId]
    );

    const convId = convResult.rows[0].id;

    await client.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, 'MEMBER'), ($1, $3, 'MEMBER');`,
      [convId, userId, targetUserId]
    );

    await client.query("COMMIT;");

    return res.status(201).json({
      success: true,
      conversationId: convId,
    });
  } catch (error) {
    await client.query("ROLLBACK;");
    console.error("Failed to start direct conversation:", error);
    return res.status(500).json({ error: "Failed to initialize direct conversation." });
  } finally {
    client.release();
  }
});

/**
 * GET /api/organizations/:id/invitations/logs
 * Returns invitation history/logs sent for this organization
 */
router.get("/:id/invitations/logs", async (req: Request, res: Response) => {
  try {
    const orgId = req.params.id;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    const result = await query(
      `SELECT 
         oi.id,
         oi.invite_code,
         oi.position,
         oi.department,
         oi.role,
         oi.salary,
         oi.status,
         oi.created_at,
         oi.expires_at,
         u_invitee.id AS invitee_id,
         u_invitee.name AS invitee_name,
         u_invitee.username AS invitee_username,
         u_invitee.avatar_url AS invitee_avatar_url,
         u_manager.name AS manager_name,
         oe_manager.position AS manager_position
       FROM organization_invitations oi
       JOIN users u_invitee ON u_invitee.id = oi.invitee_user_id
       LEFT JOIN organization_employees oe_manager ON oe_manager.id = oi.manager_employee_id
       LEFT JOIN users u_manager ON u_manager.id = oe_manager.user_id
       WHERE oi.organization_id = $1
         AND ($2::uuid IS NULL OR oi.inviter_user_id = $2)
       ORDER BY oi.created_at DESC;`,
      [orgId, userId || null]
    );

    const logs = result.rows.map((row) => ({
      id: row.id,
      inviteCode: row.invite_code,
      position: row.position,
      department: row.department,
      role: row.role,
      salary: row.salary,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      inviteeId: row.invitee_id,
      inviteeName: row.invitee_name,
      inviteeUsername: row.invitee_username,
      inviteeAvatarUrl: row.invitee_avatar_url,
      managerName: row.manager_name,
      managerPosition: row.manager_position,
    }));

    return res.status(200).json({ logs });
  } catch (error) {
    console.error("Failed to query invitation logs:", error);
    return res.status(500).json({ error: "Failed to fetch invitation logs." });
  }
});

/**
 * GET /api/organizations/:id/members
 * Returns employee roster for Members tab and right panel (including email and phone for See Info)
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
         u.email,
         u.phone,
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
      email: row.email,
      phone: row.phone,
      bio: row.bio,
      timezone: row.timezone,
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

/**
 * GET /api/organizations/:id/conversations/:convId/messages
 * Retrieves conversation metadata and chronological messages
 */
router.get("/:id/conversations/:convId/messages", async (req: Request, res: Response) => {
  try {
    const { id: orgId, convId } = req.params;
    const requestingUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    // 1. Fetch conversation details
    const convResult = await query(
      `SELECT id, organization_id, type, name, topic, is_private, created_by, created_at, updated_at
       FROM conversations
       WHERE id = $1 AND organization_id = $2
       LIMIT 1;`,
      [convId, orgId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const conv = convResult.rows[0];

    // 2. Fetch participant info / recipient info
    let recipient: any = null;
    let participantCount = 0;

    const participantsResult = await query(
      `SELECT cp.user_id, cp.role, u.name, u.username, u.avatar_url, u.email, u.phone, oe.position, oe.department
       FROM conversation_participants cp
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN organization_employees oe ON oe.user_id = u.id AND oe.organization_id = $1
       WHERE cp.conversation_id = $2;`,
      [orgId, convId]
    );

    participantCount = participantsResult.rows.length;

    if (conv.type === "DIRECT") {
      const otherPerson = participantsResult.rows.find((p) => p.user_id !== requestingUserId);
      if (otherPerson) {
        recipient = {
          id: otherPerson.user_id,
          name: otherPerson.name,
          username: otherPerson.username,
          avatarUrl: otherPerson.avatar_url,
          email: otherPerson.email,
          phone: otherPerson.phone,
          position: otherPerson.position || "Member",
          department: otherPerson.department || "Core Workspace",
        };
      } else if (participantsResult.rows.length > 0) {
        // Chatting with self or single participant fallback
        const p = participantsResult.rows[0];
        recipient = {
          id: p.user_id,
          name: p.name,
          username: p.username,
          avatarUrl: p.avatar_url,
          email: p.email,
          phone: p.phone,
          position: p.position || "Member",
          department: p.department || "Core Workspace",
        };
      }
    }

    // 3. Fetch messages in chronological order
    const messagesResult = await query(
      `SELECT 
         m.id,
         m.conversation_id,
         m.sender_id,
         m.content,
         m.message_type,
         m.attachments,
         m.reply_to_id,
         m.is_edited,
         m.created_at,
         u.name AS sender_name,
         u.username AS sender_username,
         u.avatar_url AS sender_avatar_url,
         oe.position AS sender_position
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       LEFT JOIN organization_employees oe ON oe.user_id = u.id AND oe.organization_id = $1
       WHERE m.conversation_id = $2
       ORDER BY m.created_at ASC
       LIMIT 150;`,
      [orgId, convId]
    );

    const messages = messagesResult.rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderUsername: row.sender_username,
      senderAvatarUrl: row.sender_avatar_url,
      senderPosition: row.sender_position,
      content: row.content,
      messageType: row.message_type,
      attachments: row.attachments || [],
      replyToId: row.reply_to_id,
      isEdited: row.is_edited,
      createdAt: row.created_at,
    }));

    // 4. Update last_read_at for the requesting user
    if (requestingUserId) {
      await query(
        `UPDATE conversation_participants
         SET last_read_at = NOW()
         WHERE conversation_id = $1 AND user_id = $2;`,
        [convId, requestingUserId]
      );
    }

    return res.status(200).json({
      conversation: {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        topic: conv.topic,
        isPrivate: conv.is_private,
        participantCount,
      },
      recipient,
      messages,
    });
  } catch (error) {
    console.error("Failed to load conversation messages:", error);
    return res.status(500).json({ error: "Failed to load messages." });
  }
});

/**
 * POST /api/organizations/:id/conversations/:convId/messages
 * Sends a message in a conversation
 */
router.post("/:id/conversations/:convId/messages", async (req: Request, res: Response) => {
  try {
    const { id: orgId, convId } = req.params;
    const requestingUserId = (req.headers["x-user-id"] as string) || req.body.userId;
    const { content, messageType = "TEXT", attachments = [] } = req.body;

    if (!requestingUserId) {
      return res.status(401).json({ error: "User authentication required." });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    // 1. Verify conversation belongs to organization
    const convCheck = await query(
      "SELECT id FROM conversations WHERE id = $1 AND organization_id = $2 LIMIT 1;",
      [convId, orgId]
    );
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    // 2. Ensure user is in conversation_participants
    await query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, 'MEMBER')
       ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
      [convId, requestingUserId]
    );

    // 3. Insert message
    const insertResult = await query(
      `INSERT INTO messages (conversation_id, sender_id, content, message_type, attachments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, conversation_id, sender_id, content, message_type, attachments, is_edited, created_at;`,
      [convId, requestingUserId, content.trim(), messageType, JSON.stringify(attachments)]
    );

    const newMsg = insertResult.rows[0];

    // 4. Update conversation updated_at
    await query(
      "UPDATE conversations SET updated_at = NOW() WHERE id = $1;",
      [convId]
    );

    // 5. Update user's last_read_at
    await query(
      "UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2;",
      [convId, requestingUserId]
    );

    // 6. Fetch sender details for clean response
    const senderResult = await query(
      `SELECT u.name, u.username, u.avatar_url, oe.position
       FROM users u
       LEFT JOIN organization_employees oe ON oe.user_id = u.id AND oe.organization_id = $1
       WHERE u.id = $2
       LIMIT 1;`,
      [orgId, requestingUserId]
    );
    const sender = senderResult.rows[0] || {};

    return res.status(201).json({
      message: {
        id: newMsg.id,
        conversationId: newMsg.conversation_id,
        senderId: newMsg.sender_id,
        senderName: sender.name || "Member",
        senderUsername: sender.username || "user",
        senderAvatarUrl: sender.avatar_url,
        senderPosition: sender.position,
        content: newMsg.content,
        messageType: newMsg.message_type,
        attachments: newMsg.attachments,
        isEdited: newMsg.is_edited,
        createdAt: newMsg.created_at,
      },
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    return res.status(500).json({ error: "Failed to send message." });
  }
});

/**
 * GET /api/organizations/:id/conversations/:convId/details
 * Retrieves conversation details, members, user permissions, and available org candidates
 */
router.get("/:id/conversations/:convId/details", async (req: Request, res: Response) => {
  try {
    const { id: orgId, convId } = req.params;
    const requestingUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    // 1. Fetch conversation
    const convResult = await query(
      `SELECT c.id, c.organization_id, c.type, c.name, c.topic, c.is_private, c.created_by, c.created_at,
              u_creator.name AS creator_name, u_creator.username AS creator_username
       FROM conversations c
       LEFT JOIN users u_creator ON u_creator.id = c.created_by
       WHERE c.id = $1 AND c.organization_id = $2
       LIMIT 1;`,
      [convId, orgId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const conv = convResult.rows[0];

    // 2. Fetch current participants
    const participantsResult = await query(
      `SELECT 
         cp.user_id,
         cp.role AS group_role,
         cp.created_at AS joined_at,
         u.name,
         u.username,
         u.avatar_url,
         oe.position,
         oe.department,
         oe.role AS org_role
       FROM conversation_participants cp
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN organization_employees oe ON oe.user_id = u.id AND oe.organization_id = $1
       WHERE cp.conversation_id = $2
       ORDER BY 
         CASE WHEN cp.role = 'OWNER' THEN 1 WHEN cp.role = 'ADMIN' THEN 2 ELSE 3 END,
         u.name ASC;`,
      [orgId, convId]
    );

    const members = participantsResult.rows.map((row) => ({
      userId: row.user_id,
      name: row.name,
      username: row.username,
      avatarUrl: row.avatar_url,
      position: row.position || "Member",
      department: row.department,
      groupRole: row.group_role,
      orgRole: row.org_role,
      joinedAt: row.joined_at,
      isCreator: conv.created_by === row.user_id,
    }));

    // 3. Determine requesting user's permissions
    const callerParticipant = participantsResult.rows.find((p) => p.user_id === requestingUserId);
    const callerGroupRole = callerParticipant ? callerParticipant.group_role : null;

    // Check organization role of caller
    let isOrgAdmin = false;
    let isOrgOwner = false;
    if (requestingUserId) {
      const orgMemberResult = await query(
        `SELECT role, has_permission FROM organization_employees WHERE organization_id = $1 AND user_id = $2 LIMIT 1;`,
        [orgId, requestingUserId]
      );
      if (orgMemberResult.rows.length > 0) {
        const oe = orgMemberResult.rows[0];
        isOrgOwner = oe.role === "OWNER";
        isOrgAdmin = oe.role === "ADMIN" || oe.has_permission || isOrgOwner;
      }
    }

    const isGroupAdmin = callerGroupRole === "OWNER" || callerGroupRole === "ADMIN" || isOrgAdmin || isOrgOwner;
    const canDeleteGroup = conv.type === "GROUP" && (callerGroupRole === "OWNER" || conv.created_by === requestingUserId || isOrgOwner || isOrgAdmin);

    // 4. Fetch available organization members NOT in this group (candidates to add)
    const existingUserIds = participantsResult.rows.map((p) => p.user_id);
    let availableCandidates: any[] = [];
    if (existingUserIds.length > 0) {
      const candidatesResult = await query(
        `SELECT u.id AS user_id, u.name, u.username, u.avatar_url, oe.position, oe.department
         FROM organization_employees oe
         JOIN users u ON u.id = oe.user_id
         WHERE oe.organization_id = $1 AND oe.status = 'ACTIVE'
           AND u.id != ALL($2::uuid[])
         ORDER BY u.name ASC;`,
        [orgId, existingUserIds]
      );
      availableCandidates = candidatesResult.rows.map((c) => ({
        userId: c.user_id,
        name: c.name,
        username: c.username,
        avatarUrl: c.avatar_url,
        position: c.position || "Member",
        department: c.department,
      }));
    }

    return res.status(200).json({
      conversation: {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        topic: conv.topic,
        isPrivate: conv.is_private,
        createdAt: conv.created_at,
        creatorName: conv.creator_name,
        creatorUsername: conv.creator_username,
        memberCount: members.length,
      },
      members,
      callerRole: callerGroupRole,
      isCallerAdmin: !!isGroupAdmin,
      canDeleteGroup: !!canDeleteGroup,
      availableCandidates,
    });
  } catch (error) {
    console.error("Failed to fetch conversation details:", error);
    return res.status(500).json({ error: "Failed to load conversation details." });
  }
});

/**
 * POST /api/organizations/:id/conversations/:convId/participants
 * Adds member(s) to a group conversation
 */
router.post("/:id/conversations/:convId/participants", async (req: Request, res: Response) => {
  try {
    const { id: orgId, convId } = req.params;
    const requestingUserId = (req.headers["x-user-id"] as string) || req.body.userId;
    const { targetUserId, role = "MEMBER" } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: "Target user ID is required." });
    }

    // 1. Verify caller permission
    const callerCheck = await query(
      `SELECT cp.role AS group_role, oe.role AS org_role, oe.has_permission
       FROM organization_employees oe
       LEFT JOIN conversation_participants cp ON cp.conversation_id = $2 AND cp.user_id = $3
       WHERE oe.organization_id = $1 AND oe.user_id = $3
       LIMIT 1;`,
      [orgId, convId, requestingUserId]
    );

    const caller = callerCheck.rows[0];
    const isCallerAdmin = caller && (caller.group_role === "OWNER" || caller.group_role === "ADMIN" || caller.org_role === "OWNER" || caller.org_role === "ADMIN" || caller.has_permission);

    if (!isCallerAdmin) {
      return res.status(403).json({ error: "Only group admins or organization managers can add members." });
    }

    // 2. Add target user to conversation_participants
    await query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
      [convId, targetUserId, role]
    );

    // 3. Insert system announcement message
    const namesResult = await query(
      `SELECT u1.name AS adder_name, u2.name AS added_name
       FROM users u1, users u2
       WHERE u1.id = $1 AND u2.id = $2;`,
      [requestingUserId, targetUserId]
    );
    if (namesResult.rows.length > 0) {
      const { adder_name, added_name } = namesResult.rows[0];
      await query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, 'SYSTEM');`,
        [convId, requestingUserId, `${adder_name} added ${added_name} to the group.`]
      );
    }

    return res.status(200).json({ success: true, message: "Member added successfully." });
  } catch (error) {
    console.error("Failed to add participant to conversation:", error);
    return res.status(500).json({ error: "Failed to add member." });
  }
});

/**
 * DELETE /api/organizations/:id/conversations/:convId/participants/:targetUserId
 * Removes a member from group (or self leave)
 */
router.delete("/:id/conversations/:convId/participants/:targetUserId", async (req: Request, res: Response) => {
  try {
    const { id: orgId, convId, targetUserId } = req.params;
    const requestingUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    const isSelfLeaving = requestingUserId === targetUserId;

    if (!isSelfLeaving) {
      // Caller must be group admin or org admin
      const callerCheck = await query(
        `SELECT cp.role AS group_role, oe.role AS org_role, oe.has_permission
         FROM organization_employees oe
         LEFT JOIN conversation_participants cp ON cp.conversation_id = $2 AND cp.user_id = $3
         WHERE oe.organization_id = $1 AND oe.user_id = $3
         LIMIT 1;`,
        [orgId, convId, requestingUserId]
      );

      const caller = callerCheck.rows[0];
      const isCallerAdmin = caller && (caller.group_role === "OWNER" || caller.group_role === "ADMIN" || caller.org_role === "OWNER" || caller.org_role === "ADMIN" || caller.has_permission);

      if (!isCallerAdmin) {
        return res.status(403).json({ error: "Only group admins can remove members from this group." });
      }

      // Check target is not group creator / owner
      const targetCheck = await query(
        `SELECT cp.role, c.created_by
         FROM conversations c
         JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
         WHERE c.id = $1
         LIMIT 1;`,
        [convId, targetUserId]
      );
      if (targetCheck.rows.length > 0 && targetCheck.rows[0].created_by === targetUserId && caller.org_role !== "OWNER") {
        return res.status(400).json({ error: "Cannot remove the group owner." });
      }
    }

    // Delete participant
    await query(
      `DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2;`,
      [convId, targetUserId]
    );

    // Insert system message
    const namesResult = await query(
      `SELECT u1.name AS remover_name, u2.name AS removed_name
       FROM users u1, users u2
       WHERE u1.id = $1 AND u2.id = $2;`,
      [requestingUserId, targetUserId]
    );
    if (namesResult.rows.length > 0) {
      const { remover_name, removed_name } = namesResult.rows[0];
      const msg = isSelfLeaving ? `${removed_name} left the group.` : `${remover_name} removed ${removed_name} from the group.`;
      await query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, 'SYSTEM');`,
        [convId, requestingUserId, msg]
      );
    }

    return res.status(200).json({ success: true, message: "Member removed successfully." });
  } catch (error) {
    console.error("Failed to remove participant:", error);
    return res.status(500).json({ error: "Failed to remove member." });
  }
});

/**
 * DELETE /api/organizations/:id/conversations/:convId
 * Permanently deletes a group conversation
 */
router.delete("/:id/conversations/:convId", async (req: Request, res: Response) => {
  try {
    const { id: orgId, convId } = req.params;
    const requestingUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    // 1. Fetch conversation
    const convResult = await query(
      `SELECT id, type, name, created_by FROM conversations WHERE id = $1 AND organization_id = $2 LIMIT 1;`,
      [convId, orgId]
    );
    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }
    const conv = convResult.rows[0];

    // Cannot delete default channels general or random
    if (conv.type === "CHANNEL" && (conv.name === "general" || conv.name === "random")) {
      return res.status(400).json({ error: "Default workspace channels cannot be deleted." });
    }

    // 2. Permission check
    const callerCheck = await query(
      `SELECT cp.role AS group_role, oe.role AS org_role, oe.has_permission
       FROM organization_employees oe
       LEFT JOIN conversation_participants cp ON cp.conversation_id = $2 AND cp.user_id = $3
       WHERE oe.organization_id = $1 AND oe.user_id = $3
       LIMIT 1;`,
      [orgId, convId, requestingUserId]
    );
    const caller = callerCheck.rows[0];
    const canDelete = caller && (conv.created_by === requestingUserId || caller.group_role === "OWNER" || caller.org_role === "OWNER" || caller.org_role === "ADMIN");

    if (!canDelete) {
      return res.status(403).json({ error: "You do not have permission to delete this group." });
    }

    // 3. Delete conversation (cascade will handle participants and messages)
    await query("DELETE FROM conversations WHERE id = $1 AND organization_id = $2;", [convId, orgId]);

    return res.status(200).json({ success: true, message: "Group deleted successfully." });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return res.status(500).json({ error: "Failed to delete group." });
  }
});

export default router;


