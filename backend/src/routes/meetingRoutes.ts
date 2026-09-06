import { Router, Request, Response } from "express";
import { query } from "../db";

const router = Router();

/**
 * GET /api/meetings/:meetingCode
 * Access gate check and meeting room metadata resolution.
 * - If meeting belongs to an organization, caller MUST be an active member of that organization.
 * - If meeting is public (organization_id IS NULL), any user can join.
 */
router.get("/:meetingCode", async (req: Request, res: Response) => {
  try {
    const { meetingCode } = req.params;
    const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string) || "";

    const meetingResult = await query(
      `SELECT 
         m.id,
         m.meeting_code,
         m.title,
         m.organization_id,
         m.host_user_id,
         m.status,
         m.scope,
         m.meeting_type,
         m.is_hierarchical,
         m.scheduled_at,
         m.started_at,
         m.ended_at,
         o.name AS organization_name,
         u_host.name AS host_name,
         u_host.avatar_url AS host_avatar_url,
         COALESCE(
           (
             SELECT json_agg(json_build_object(
               'id', pu.id, 
               'name', pu.name, 
               'avatarUrl', pu.avatar_url, 
               'role', mp.role
             ))
             FROM meeting_participants mp
             JOIN users pu ON pu.id = mp.user_id
             WHERE mp.meeting_id = m.id
           ),
           '[]'::json
         ) AS participants
       FROM organization_meetings m
       LEFT JOIN organizations o ON o.id = m.organization_id
       JOIN users u_host ON u_host.id = m.host_user_id
       WHERE m.meeting_code = $1;`,
      [String(meetingCode || "").toUpperCase().trim()]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found. Please verify the meeting code." });
    }

    const meeting = meetingResult.rows[0];

    // Organization-restricted meeting validation
    if (meeting.organization_id) {
      if (!userId) {
        return res.status(401).json({ 
          error: "You must be signed in to join this organization meeting.",
          isRestricted: true,
          organizationName: meeting.organization_name
        });
      }

      const memberCheck = await query(
        `SELECT oe.id, oe.role, oe.position, oe.status
         FROM organization_employees oe
         WHERE oe.organization_id = $1 AND oe.user_id = $2 AND oe.status = 'ACTIVE';`,
        [meeting.organization_id, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({
          error: `This meeting is restricted to members of "${meeting.organization_name}". You are not an active member of this organization.`,
          isRestricted: true,
          organizationName: meeting.organization_name,
          organizationId: meeting.organization_id
        });
      }

      const callerMembership = memberCheck.rows[0];
      return res.status(200).json({
        meeting: {
          id: meeting.id,
          meetingCode: meeting.meeting_code,
          title: meeting.title,
          status: meeting.status,
          scope: meeting.scope,
          meetingType: meeting.meeting_type,
          isHierarchical: meeting.is_hierarchical,
          scheduledAt: meeting.scheduled_at,
          startedAt: meeting.started_at,
          host: {
            id: meeting.host_user_id,
            name: meeting.host_name,
            avatarUrl: meeting.host_avatar_url,
          },
          organization: {
            id: meeting.organization_id,
            name: meeting.organization_name,
          },
          userRole: callerMembership.role,
          userPosition: callerMembership.position,
          participants: meeting.participants || [],
        },
      });
    }

    // Non-hierarchical / Public meeting
    return res.status(200).json({
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meeting_code,
        title: meeting.title,
        status: meeting.status,
        scope: "PUBLIC",
        meetingType: meeting.meeting_type,
        isHierarchical: false,
        scheduledAt: meeting.scheduled_at,
        startedAt: meeting.started_at,
        host: {
          id: meeting.host_user_id,
          name: meeting.host_name,
          avatarUrl: meeting.host_avatar_url,
        },
        organization: null,
        userRole: "MEMBER",
        participants: meeting.participants || [],
      },
    });
  } catch (error) {
    console.error("Error verifying meeting access:", error);
    return res.status(500).json({ error: "Failed to load meeting room." });
  }
});

/**
 * POST /api/meetings/public
 * Creates an open non-hierarchical meeting without organization binding
 */
router.post("/public", async (req: Request, res: Response) => {
  try {
    const { title, userId, meetingCode: customCode, participantUserIds } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Meeting title is required." });
    }
    if (!userId) {
      return res.status(401).json({ error: "Host user ID is required." });
    }

    let meetingCode = customCode && typeof customCode === "string" && customCode.trim()
      ? customCode.trim().toUpperCase()
      : `OM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (!meetingCode.startsWith("OM-")) {
      meetingCode = `OM-${meetingCode}`;
    }

    const insertResult = await query(
      `INSERT INTO organization_meetings (
         organization_id,
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
       VALUES (NULL, $1, $2, $3, 'LIVE', 'PUBLIC', FALSE, 'INSTANT', NOW(), NOW())
       RETURNING *;`,
      [meetingCode, title.trim(), userId]
    );

    const meeting = insertResult.rows[0];

    await query(
      `INSERT INTO meeting_participants (meeting_id, user_id, role, joined_at)
       VALUES ($1, $2, 'HOST', NOW())
       ON CONFLICT (meeting_id, user_id) DO NOTHING;`,
      [meeting.id, userId]
    );

    // Insert invited participants & meeting invitations
    if (Array.isArray(participantUserIds) && participantUserIds.length > 0) {
      for (const pId of participantUserIds) {
        if (!pId || pId === userId) continue;
        await query(
          `INSERT INTO meeting_participants (meeting_id, user_id, role, joined_at)
           VALUES ($1, $2, 'LISTENER', NOW())
           ON CONFLICT (meeting_id, user_id) DO NOTHING;`,
          [meeting.id, pId]
        );
        await query(
          `INSERT INTO meeting_invitations (meeting_id, organization_id, inviter_user_id, invitee_user_id, status)
           VALUES ($1, NULL, $2, $3, 'PENDING')
           ON CONFLICT (meeting_id, invitee_user_id) DO NOTHING;`,
          [meeting.id, userId, pId]
        );
      }
    }

    return res.status(201).json({
      success: true,
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meeting_code,
        title: meeting.title,
        status: meeting.status,
      },
    });
  } catch (error) {
    console.error("Failed to create public meeting:", error);
    return res.status(500).json({ error: "Failed to create meeting." });
  }
});

/**
 * GET /api/meetings/invitations/user/:userId
 * Fetches meeting invitations for a user, optionally filtered by organizationId
 */
router.get("/invitations/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.query.organizationId as string | undefined;

    let sql = `
      SELECT 
        mi.id,
        mi.meeting_id,
        mi.organization_id,
        mi.status,
        mi.created_at,
        m.meeting_code,
        m.title,
        m.status AS meeting_status,
        m.scheduled_at,
        m.started_at,
        m.is_hierarchical,
        o.name AS organization_name,
        u_inviter.name AS inviter_name,
        u_inviter.avatar_url AS inviter_avatar_url
      FROM meeting_invitations mi
      JOIN organization_meetings m ON m.id = mi.meeting_id
      LEFT JOIN organizations o ON o.id = mi.organization_id
      JOIN users u_inviter ON u_inviter.id = mi.inviter_user_id
      WHERE mi.invitee_user_id = $1
    `;
    const params: any[] = [userId];

    if (organizationId) {
      params.push(organizationId);
      sql += ` AND mi.organization_id = $2`;
    }

    sql += ` ORDER BY mi.created_at DESC LIMIT 50;`;

    const result = await query(sql, params);

    const invitations = result.rows.map((row) => ({
      id: row.id,
      meetingId: row.meeting_id,
      meetingCode: row.meeting_code,
      title: row.title,
      meetingStatus: row.meeting_status,
      scheduledAt: row.scheduled_at,
      startedAt: row.started_at,
      organizationId: row.organization_id,
      organizationName: row.organization_name || "General Meeting",
      inviterName: row.inviter_name,
      inviterAvatarUrl: row.inviter_avatar_url,
      status: row.status,
      createdAt: row.created_at,
    }));

    return res.status(200).json({ invitations });
  } catch (error) {
    console.error("Failed to fetch meeting invitations:", error);
    return res.status(500).json({ error: "Failed to load meeting invitations." });
  }
});

/**
 * POST /api/meetings/invitations/:id/respond
 * Responds to a meeting invitation (ACCEPT / DECLINE)
 */
router.post("/invitations/:id/respond", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, userId } = req.body;

    if (!["ACCEPT", "DECLINE"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use ACCEPT or DECLINE." });
    }

    const newStatus = action === "ACCEPT" ? "ACCEPTED" : "DECLINED";

    const updateRes = await query(
      `UPDATE meeting_invitations
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND invitee_user_id = $3
       RETURNING *;`,
      [newStatus, id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Invitation not found or not authorized." });
    }

    return res.status(200).json({ success: true, invitation: updateRes.rows[0] });
  } catch (error) {
    console.error("Failed to respond to meeting invitation:", error);
    return res.status(500).json({ error: "Failed to respond to invitation." });
  }
});

export default router;
