import { Router, Request, Response } from "express";
import { query } from "../db";

const router = Router();

/**
 * Helper to auto-terminate abandoned or no-show meetings per business rules:
 * 1. Scheduled meeting with no-shows > 20 mins past scheduled_at: marked ENDED
 * 2. Active meeting where all participants left > 10 mins ago: marked ENDED
 */
export async function autoCleanExpiredMeetings(organizationId?: string): Promise<void> {
  try {
    // 1. Scheduled meetings with no one joining 20 mins past scheduled time
    await query(
      `UPDATE organization_meetings m
       SET status = 'ENDED', ended_at = NOW(), updated_at = NOW()
       WHERE m.status IN ('SCHEDULED', 'LIVE')
         AND ($1::uuid IS NULL OR m.organization_id = $1::uuid)
         AND m.scheduled_at < NOW() - INTERVAL '20 minutes'
         AND (
           NOT EXISTS (
             SELECT 1 FROM meeting_participants mp
             WHERE mp.meeting_id = m.id AND mp.left_at IS NULL
           )
           AND (
             SELECT COUNT(*) FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id != m.host_user_id
           ) = 0
         );`,
      [organizationId || null]
    );

    // 2. Active meetings where people joined and everyone left > 10 minutes ago
    await query(
      `UPDATE organization_meetings m
       SET status = 'ENDED', ended_at = NOW(), updated_at = NOW()
       WHERE m.status = 'LIVE'
         AND ($1::uuid IS NULL OR m.organization_id = $1::uuid)
         AND EXISTS (
           SELECT 1 FROM meeting_participants mp WHERE mp.meeting_id = m.id
         )
         AND NOT EXISTS (
           SELECT 1 FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.left_at IS NULL
         )
         AND (
           SELECT MAX(mp.left_at) FROM meeting_participants mp WHERE mp.meeting_id = m.id
         ) < NOW() - INTERVAL '10 minutes';`,
      [organizationId || null]
    );
  } catch (err) {
    console.error("Error in autoCleanExpiredMeetings:", err);
  }
}

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

    // Execute auto-clean rules before resolving
    await autoCleanExpiredMeetings();

    const rawCode = String(meetingCode || "").toUpperCase().trim();
    let normalizedCode = rawCode;
    if (!normalizedCode.startsWith("OM-") && normalizedCode.length > 0) {
      normalizedCode = `OM-${normalizedCode}`;
    }

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
       WHERE m.meeting_code = $1 OR m.meeting_code = $2;`,
      [rawCode, normalizedCode]
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

      // Auto-register participant and mark pending invitation accepted
      if (userId) {
        await query(
          `INSERT INTO meeting_participants (meeting_id, user_id, role, joined_at)
           VALUES ($1, $2, 'LISTENER', NOW())
           ON CONFLICT (meeting_id, user_id) DO NOTHING;`,
          [meeting.id, userId]
        );
        await query(
          `UPDATE meeting_invitations
           SET status = 'ACCEPTED', updated_at = NOW()
           WHERE meeting_id = $1 AND invitee_user_id = $2 AND status = 'PENDING';`,
          [meeting.id, userId]
        );
      }

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
          endedAt: meeting.ended_at,
          isEnded: meeting.status === "ENDED",
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
    if (userId && meeting.status !== "ENDED") {
      await query(
        `INSERT INTO meeting_participants (meeting_id, user_id, role, joined_at)
         VALUES ($1, $2, 'LISTENER', NOW())
         ON CONFLICT (meeting_id, user_id) DO NOTHING;`,
        [meeting.id, userId]
      );
      await query(
        `UPDATE meeting_invitations
         SET status = 'ACCEPTED', updated_at = NOW()
         WHERE meeting_id = $1 AND invitee_user_id = $2 AND status = 'PENDING';`,
        [meeting.id, userId]
      );
    }

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
        endedAt: meeting.ended_at,
        isEnded: meeting.status === "ENDED",
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
 * POST /api/meetings/:meetingCode/end
 * Meeting creator / host ends the meeting for all participants.
 */
router.post("/:meetingCode/end", async (req: Request, res: Response) => {
  try {
    const { meetingCode } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Host user ID is required." });
    }

    const rawCode = String(meetingCode || "").toUpperCase().trim();
    let normalizedCode = rawCode;
    if (!normalizedCode.startsWith("OM-") && normalizedCode.length > 0) {
      normalizedCode = `OM-${normalizedCode}`;
    }

    const meetingResult = await query(
      `SELECT id, host_user_id, status FROM organization_meetings
       WHERE meeting_code = $1 OR meeting_code = $2;`,
      [rawCode, normalizedCode]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found." });
    }

    const meeting = meetingResult.rows[0];

    // Verify caller is the host
    if (meeting.host_user_id !== userId) {
      return res.status(403).json({ error: "Only the meeting host can end the meeting for all participants." });
    }

    // Mark meeting as ENDED
    await query(
      `UPDATE organization_meetings
       SET status = 'ENDED', ended_at = NOW(), updated_at = NOW()
       WHERE id = $1;`,
      [meeting.id]
    );

    // Mark all remaining participants as left
    await query(
      `UPDATE meeting_participants
       SET left_at = NOW()
       WHERE meeting_id = $1 AND left_at IS NULL;`,
      [meeting.id]
    );

    return res.status(200).json({ success: true, message: "Meeting ended for all participants." });
  } catch (error) {
    console.error("Failed to end meeting for all:", error);
    return res.status(500).json({ error: "Failed to end meeting." });
  }
});

/**
 * POST /api/meetings/:meetingCode/leave
 * Participant leaves the meeting room (sets left_at).
 */
router.post("/:meetingCode/leave", async (req: Request, res: Response) => {
  try {
    const { meetingCode } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required." });
    }

    const rawCode = String(meetingCode || "").toUpperCase().trim();
    let normalizedCode = rawCode;
    if (!normalizedCode.startsWith("OM-") && normalizedCode.length > 0) {
      normalizedCode = `OM-${normalizedCode}`;
    }

    const meetingResult = await query(
      `SELECT id FROM organization_meetings
       WHERE meeting_code = $1 OR meeting_code = $2;`,
      [rawCode, normalizedCode]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found." });
    }

    const meetingId = meetingResult.rows[0].id;

    await query(
      `UPDATE meeting_participants
       SET left_at = NOW()
       WHERE meeting_id = $1 AND user_id = $2 AND left_at IS NULL;`,
      [meetingId, userId]
    );

    // Run auto-clean in case all participants have left
    await autoCleanExpiredMeetings();

    return res.status(200).json({ success: true, message: "Left meeting room." });
  } catch (error) {
    console.error("Failed to record leaving meeting:", error);
    return res.status(500).json({ error: "Failed to record leaving meeting." });
  }
});

/**
 * POST /api/meetings/join
 * Verifies code, checks organization membership permissions, registers participant,
 * and returns meeting details to caller.
 */
router.post("/join", async (req: Request, res: Response) => {
  try {
    const { meetingCode, userId } = req.body;

    if (!meetingCode || typeof meetingCode !== "string" || !meetingCode.trim()) {
      return res.status(400).json({ error: "Please enter a valid meeting code." });
    }

    const rawCode = meetingCode.toUpperCase().trim();
    let normalizedCode = rawCode;
    if (!normalizedCode.startsWith("OM-") && normalizedCode.length > 0) {
      normalizedCode = `OM-${normalizedCode}`;
    }

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
         o.name AS organization_name,
         u_host.name AS host_name
       FROM organization_meetings m
       LEFT JOIN organizations o ON o.id = m.organization_id
       JOIN users u_host ON u_host.id = m.host_user_id
       WHERE m.meeting_code = $1 OR m.meeting_code = $2;`,
      [rawCode, normalizedCode]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found. Please verify the meeting code." });
    }

    const meeting = meetingResult.rows[0];

    // Organization-restricted validation
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
          error: `Access Denied: This meeting is restricted to members of "${meeting.organization_name}". You are not an active member of this organization.`,
          isRestricted: true,
          organizationName: meeting.organization_name,
          organizationId: meeting.organization_id
        });
      }

      const callerMembership = memberCheck.rows[0];

      // Insert participant & update invitation
      await query(
        `INSERT INTO meeting_participants (meeting_id, user_id, role, joined_at)
         VALUES ($1, $2, 'LISTENER', NOW())
         ON CONFLICT (meeting_id, user_id) DO NOTHING;`,
        [meeting.id, userId]
      );
      await query(
        `UPDATE meeting_invitations
         SET status = 'ACCEPTED', updated_at = NOW()
         WHERE meeting_id = $1 AND invitee_user_id = $2 AND status = 'PENDING';`,
        [meeting.id, userId]
      );

      return res.status(200).json({
        success: true,
        meeting: {
          id: meeting.id,
          meetingCode: meeting.meeting_code,
          title: meeting.title,
          status: meeting.status,
          isHierarchical: meeting.is_hierarchical,
          organization: {
            id: meeting.organization_id,
            name: meeting.organization_name,
          },
          userRole: callerMembership.role,
        }
      });
    }

    // Public meeting
    if (userId) {
      await query(
        `INSERT INTO meeting_participants (meeting_id, user_id, role, joined_at)
         VALUES ($1, $2, 'LISTENER', NOW())
         ON CONFLICT (meeting_id, user_id) DO NOTHING;`,
        [meeting.id, userId]
      );
      await query(
        `UPDATE meeting_invitations
         SET status = 'ACCEPTED', updated_at = NOW()
         WHERE meeting_id = $1 AND invitee_user_id = $2 AND status = 'PENDING';`,
        [meeting.id, userId]
      );
    }

    return res.status(200).json({
      success: true,
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meeting_code,
        title: meeting.title,
        status: meeting.status,
        isHierarchical: false,
        organization: null,
        userRole: "MEMBER",
      }
    });
  } catch (error) {
    console.error("Failed to join meeting by code:", error);
    return res.status(500).json({ error: "Failed to join meeting." });
  }
});

/**
 * POST /api/meetings/public
 * Creates an open non-hierarchical meeting without organization binding (Instant or Scheduled)
 */
router.post("/public", async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      userId, 
      meetingCode: customCode, 
      participantUserIds,
      meetingType = "INSTANT",
      scheduledAt
    } = req.body;

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

    const isScheduled = meetingType === "SCHEDULED";
    const status = isScheduled ? "SCHEDULED" : "LIVE";
    const schedTime = isScheduled && scheduledAt ? new Date(scheduledAt) : new Date();
    const startTime = isScheduled ? null : new Date();

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
       VALUES (NULL, $1, $2, $3, $4, 'PUBLIC', FALSE, $5, $6, $7)
       RETURNING *;`,
      [meetingCode, title.trim(), userId, status, meetingType, schedTime, startTime]
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
        meetingType: meeting.meeting_type,
        scheduledAt: meeting.scheduled_at,
      },
    });
  } catch (error) {
    console.error("Failed to create public meeting:", error);
    return res.status(500).json({ error: "Failed to create meeting." });
  }
});

/**
 * GET /api/meetings/user/:userId
 * Returns upcoming, recent, and active meetings across all organizations & personal meetings for user
 */
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Run auto-clean rules
    await autoCleanExpiredMeetings();

    // 1. Upcoming meetings
    const upcomingRes = await query(
      `SELECT DISTINCT
         m.id,
         m.meeting_code,
         m.title,
         m.status,
         m.scheduled_at,
         m.started_at,
         m.is_hierarchical,
         m.scope,
         m.meeting_type,
         m.organization_id,
         o.name AS organization_name,
         u_host.id AS host_id,
         u_host.name AS host_name,
         u_host.avatar_url AS host_avatar_url
       FROM organization_meetings m
       LEFT JOIN organizations o ON o.id = m.organization_id
       JOIN users u_host ON u_host.id = m.host_user_id
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id AND mp.user_id = $1
       LEFT JOIN meeting_invitations mi ON mi.meeting_id = m.id AND mi.invitee_user_id = $1
       WHERE (m.host_user_id = $1 OR mp.user_id = $1 OR (mi.invitee_user_id = $1 AND mi.status != 'DECLINED'))
         AND m.status = 'SCHEDULED'
         AND m.scheduled_at >= NOW() - INTERVAL '15 minutes'
       ORDER BY m.scheduled_at ASC;`,
      [userId]
    );

    // 2. Active live meetings
    const activeRes = await query(
      `SELECT DISTINCT
         m.id,
         m.meeting_code,
         m.title,
         m.status,
         m.scheduled_at,
         m.started_at,
         m.is_hierarchical,
         m.scope,
         m.meeting_type,
         m.organization_id,
         o.name AS organization_name,
         u_host.id AS host_id,
         u_host.name AS host_name,
         u_host.avatar_url AS host_avatar_url,
         (
           SELECT COUNT(*)::int FROM meeting_participants p WHERE p.meeting_id = m.id AND p.left_at IS NULL
         ) AS active_count
       FROM organization_meetings m
       LEFT JOIN organizations o ON o.id = m.organization_id
       JOIN users u_host ON u_host.id = m.host_user_id
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id AND mp.user_id = $1
       WHERE (m.host_user_id = $1 OR mp.user_id = $1)
         AND m.status = 'LIVE'
       ORDER BY m.started_at DESC;`,
      [userId]
    );

    // 3. Recently ended meetings
    const recentRes = await query(
      `SELECT DISTINCT
         m.id,
         m.meeting_code,
         m.title,
         m.status,
         m.scheduled_at,
         m.started_at,
         m.ended_at,
         m.is_hierarchical,
         m.scope,
         m.organization_id,
         o.name AS organization_name,
         u_host.id AS host_id,
         u_host.name AS host_name,
         u_host.avatar_url AS host_avatar_url,
         (
           SELECT COUNT(*)::int FROM meeting_participants p WHERE p.meeting_id = m.id
         ) AS participant_count
       FROM organization_meetings m
       LEFT JOIN organizations o ON o.id = m.organization_id
       JOIN users u_host ON u_host.id = m.host_user_id
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id AND mp.user_id = $1
       WHERE (m.host_user_id = $1 OR mp.user_id = $1)
         AND m.status = 'ENDED'
       ORDER BY m.ended_at DESC NULLS LAST
       LIMIT 15;`,
      [userId]
    );

    return res.status(200).json({
      upcoming: upcomingRes.rows.map((row) => ({
        id: row.id,
        meetingCode: row.meeting_code,
        title: row.title,
        status: row.status,
        scheduledAt: row.scheduled_at,
        isHierarchical: row.is_hierarchical,
        organizationName: row.organization_name || "Open Meeting",
        organizationId: row.organization_id,
        host: {
          id: row.host_id,
          name: row.host_name,
          avatarUrl: row.host_avatar_url,
        },
      })),
      active: activeRes.rows.map((row) => ({
        id: row.id,
        meetingCode: row.meeting_code,
        title: row.title,
        status: row.status,
        startedAt: row.started_at,
        activeCount: Number(row.active_count || 1),
        isHierarchical: row.is_hierarchical,
        organizationName: row.organization_name || "Open Meeting",
        organizationId: row.organization_id,
        host: {
          id: row.host_id,
          name: row.host_name,
          avatarUrl: row.host_avatar_url,
        },
      })),
      recent: recentRes.rows.map((row) => {
        const start = row.started_at ? new Date(row.started_at).getTime() : 0;
        const end = row.ended_at ? new Date(row.ended_at).getTime() : 0;
        const durationMins = start && end && end > start ? Math.round((end - start) / (60 * 1000)) : 0;

        return {
          id: row.id,
          meetingCode: row.meeting_code,
          title: row.title,
          status: row.status,
          endedAt: row.ended_at,
          duration: `${durationMins} min`,
          participantCount: Number(row.participant_count || 1),
          isHierarchical: row.is_hierarchical,
          organizationName: row.organization_name || "Open Meeting",
          organizationId: row.organization_id,
          host: {
            id: row.host_id,
            name: row.host_name,
            avatarUrl: row.host_avatar_url,
          },
        };
      }),
    });
  } catch (error) {
    console.error("Failed to fetch user meetings:", error);
    return res.status(500).json({ error: "Failed to load meetings." });
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
