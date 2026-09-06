import { Router, Request, Response } from "express";
import { query } from "../db";

const router = Router();

/**
 * GET /api/personal/conversations
 * Lists personal direct chats with friends and personal groups
 */
router.get("/conversations", async (req: Request, res: Response) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }

    // 1. Direct chats with friends (organization_id IS NULL AND type = 'DIRECT')
    const dmsResult = await query(
      `SELECT 
         c.id AS conversation_id,
         c.updated_at,
         u_other.id AS other_user_id,
         u_other.name AS other_user_name,
         u_other.username AS other_user_username,
         u_other.avatar_url,
         COALESCE(
           (
             SELECT oe.position
             FROM organization_employees oe
             WHERE oe.user_id = u_other.id AND oe.status = 'ACTIVE'
             LIMIT 1
           ),
           'Member'
         ) AS position,
         COALESCE(
           (
             SELECT COUNT(*)::int
             FROM messages m
             WHERE m.conversation_id = c.id
               AND m.sender_id = u_other.id
               AND m.created_at > cp_me.last_read_at
           ),
           0
         ) AS unread_count,
         (
           SELECT m.content 
           FROM messages m 
           WHERE m.conversation_id = c.id 
           ORDER BY m.created_at DESC 
           LIMIT 1
         ) AS last_message,
         (
           SELECT m.created_at 
           FROM messages m 
           WHERE m.conversation_id = c.id 
           ORDER BY m.created_at DESC 
           LIMIT 1
         ) AS last_message_time
       FROM conversations c
       JOIN conversation_participants cp_me ON cp_me.conversation_id = c.id AND cp_me.user_id = $1
       JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != $1
       JOIN users u_other ON u_other.id = cp_other.user_id
       WHERE c.organization_id IS NULL AND c.type = 'DIRECT'
       ORDER BY c.updated_at DESC;`,
      [userId]
    );

    const directMessages = dmsResult.rows.map((row) => ({
      id: row.conversation_id,
      userId: row.other_user_id,
      name: row.other_user_name,
      username: row.other_user_username,
      avatarUrl: row.avatar_url,
      position: row.position,
      unreadCount: Number(row.unread_count || 0),
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
    }));

    // 2. Personal groups (organization_id IS NULL AND type = 'GROUP')
    const groupsResult = await query(
      `SELECT 
         c.id, 
         c.name, 
         c.topic, 
         c.created_by,
         c.updated_at,
         (
           SELECT COUNT(*)::int 
           FROM conversation_participants cp 
           WHERE cp.conversation_id = c.id
         ) AS member_count,
         COALESCE(
           (
             SELECT COUNT(*)::int
             FROM messages m
             JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
             WHERE m.conversation_id = c.id
               AND m.sender_id != $1
               AND m.created_at > cp.last_read_at
           ),
           0
         ) AS unread_count,
         (
           SELECT m.content 
           FROM messages m 
           WHERE m.conversation_id = c.id 
           ORDER BY m.created_at DESC 
           LIMIT 1
         ) AS last_message,
         (
           SELECT m.created_at 
           FROM messages m 
           WHERE m.conversation_id = c.id 
           ORDER BY m.created_at DESC 
           LIMIT 1
         ) AS last_message_time
       FROM conversations c
       JOIN conversation_participants cp_me ON cp_me.conversation_id = c.id AND cp_me.user_id = $1
       WHERE c.organization_id IS NULL AND c.type = 'GROUP'
       ORDER BY c.updated_at DESC;`,
      [userId]
    );

    const groups = groupsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      topic: row.topic,
      memberCount: Number(row.member_count || 0),
      unreadCount: Number(row.unread_count || 0),
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
    }));

    return res.status(200).json({ directMessages, groups });
  } catch (err) {
    console.error("Failed to load personal conversations:", err);
    return res.status(500).json({ error: "Failed to load conversations." });
  }
});

/**
 * GET /api/personal/conversations/:convId/messages
 * Retrieves message stream for a personal conversation
 */
router.get("/conversations/:convId/messages", async (req: Request, res: Response) => {
  try {
    const { convId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }

    // 1. Fetch conversation
    const convResult = await query(
      "SELECT id, type, name, topic, created_by, is_private FROM conversations WHERE id = $1 LIMIT 1;",
      [convId]
    );
    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }
    const conv = convResult.rows[0];

    // 2. Fetch recipient if DIRECT
    let recipient: any = null;
    if (conv.type === "DIRECT") {
      const recResult = await query(
        `SELECT u.id, u.name, u.username, u.avatar_url, u.email, u.phone, u.bio,
                COALESCE(
                  (SELECT oe.position FROM organization_employees oe WHERE oe.user_id = u.id AND oe.status = 'ACTIVE' LIMIT 1),
                  'Member'
                ) AS position
         FROM conversation_participants cp
         JOIN users u ON u.id = cp.user_id
         WHERE cp.conversation_id = $1 AND cp.user_id != $2
         LIMIT 1;`,
        [convId, userId]
      );
      if (recResult.rows.length > 0) {
        const r = recResult.rows[0];
        recipient = {
          id: r.id,
          name: r.name,
          username: r.username,
          avatarUrl: r.avatar_url,
          email: r.email,
          phone: r.phone,
          position: r.position,
          bio: r.bio,
        };
      }
    }

    // 3. Count participants
    const countRes = await query(
      "SELECT COUNT(*)::int AS count FROM conversation_participants WHERE conversation_id = $1;",
      [convId]
    );
    const participantCount = countRes.rows[0]?.count || 0;

    // 4. Fetch messages
    const messagesResult = await query(
      `SELECT 
         m.id,
         m.conversation_id,
         m.sender_id,
         u.name AS sender_name,
         u.username AS sender_username,
         u.avatar_url AS sender_avatar_url,
         m.content,
         m.message_type,
         m.attachments,
         m.reply_to_id,
         m.is_edited,
         m.created_at
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT 100;`,
      [convId]
    );

    const messages = messagesResult.rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderUsername: row.sender_username,
      senderAvatarUrl: row.sender_avatar_url,
      content: row.content,
      messageType: row.message_type,
      attachments: row.attachments || [],
      replyToId: row.reply_to_id,
      isEdited: row.is_edited,
      createdAt: row.created_at,
    }));

    // 5. Update caller's last_read_at
    await query(
      `UPDATE conversation_participants
       SET last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2;`,
      [convId, userId]
    );

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
  } catch (err) {
    console.error("Failed to load personal messages:", err);
    return res.status(500).json({ error: "Failed to load messages." });
  }
});

/**
 * POST /api/personal/conversations/:convId/messages
 * Sends a message in a personal conversation
 */
router.post("/conversations/:convId/messages", async (req: Request, res: Response) => {
  try {
    const { convId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;
    const { content, messageType = "TEXT", attachments = [] } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    // Insert message
    const insertRes = await query(
      `INSERT INTO messages (conversation_id, sender_id, content, message_type, attachments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, conversation_id, sender_id, content, message_type, attachments, is_edited, created_at;`,
      [convId, userId, content.trim(), messageType, JSON.stringify(attachments)]
    );

    const newMsg = insertRes.rows[0];

    // Update conversation updated_at
    await query("UPDATE conversations SET updated_at = NOW() WHERE id = $1;", [convId]);

    // Update sender last_read_at
    await query(
      "UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2;",
      [convId, userId]
    );

    // Fetch sender details
    const senderRes = await query("SELECT name, username, avatar_url FROM users WHERE id = $1;", [userId]);
    const sender = senderRes.rows[0] || {};

    return res.status(201).json({
      message: {
        id: newMsg.id,
        conversationId: newMsg.conversation_id,
        senderId: newMsg.sender_id,
        senderName: sender.name || "Member",
        senderUsername: sender.username || "user",
        senderAvatarUrl: sender.avatar_url,
        content: newMsg.content,
        messageType: newMsg.message_type,
        attachments: newMsg.attachments,
        isEdited: newMsg.is_edited,
        createdAt: newMsg.created_at,
      },
    });
  } catch (err) {
    console.error("Failed to post personal message:", err);
    return res.status(500).json({ error: "Failed to send message." });
  }
});

/**
 * POST /api/personal/conversations/:convId/read
 * Marks a personal conversation as read
 */
router.post("/conversations/:convId/read", async (req: Request, res: Response) => {
  try {
    const { convId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }

    await query(
      `UPDATE conversation_participants
       SET last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2;`,
      [convId, userId]
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to mark personal conversation read:", err);
    return res.status(500).json({ error: "Failed to mark read." });
  }
});

/**
 * POST /api/personal/groups
 * Creates a personal group with title, topic, and friend participants
 */
router.post("/groups", async (req: Request, res: Response) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;
    const { name, topic, memberUserIds = [] } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required." });
    }

    // Create group conversation (organization_id = NULL)
    const convResult = await query(
      `INSERT INTO conversations (organization_id, type, name, topic, is_private, created_by)
       VALUES (NULL, 'GROUP', $1, $2, TRUE, $3)
       RETURNING id, name, topic, created_at;`,
      [name.trim(), topic ? topic.trim() : "", userId]
    );

    const group = convResult.rows[0];

    // Enroll creator as OWNER
    await query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, 'OWNER');`,
      [group.id, userId]
    );

    // Enroll selected friends as MEMBERS
    if (Array.isArray(memberUserIds)) {
      for (const mId of memberUserIds) {
        if (!mId || mId === userId) continue;
        await query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role)
           VALUES ($1, $2, 'MEMBER')
           ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
          [group.id, mId]
        );
      }
    }

    // Insert system message
    const creatorRes = await query("SELECT name FROM users WHERE id = $1;", [userId]);
    const creatorName = creatorRes.rows[0]?.name || "Creator";
    await query(
      `INSERT INTO messages (conversation_id, sender_id, content, message_type)
       VALUES ($1, $2, $3, 'SYSTEM');`,
      [group.id, userId, `${creatorName} created the group "${name.trim()}".`]
    );

    return res.status(201).json({ success: true, group });
  } catch (err) {
    console.error("Failed to create personal group:", err);
    return res.status(500).json({ error: "Failed to create group." });
  }
});

/**
 * GET /api/personal/groups/:convId/details
 * Gets member roster and permissions for a personal group
 */
router.get("/groups/:convId/details", async (req: Request, res: Response) => {
  try {
    const { convId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    const convResult = await query(
      `SELECT c.id, c.type, c.name, c.topic, c.created_by, c.created_at, u.name AS creator_name
       FROM conversations c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1 AND c.organization_id IS NULL AND c.type = 'GROUP'
       LIMIT 1;`,
      [convId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    const conv = convResult.rows[0];

    const participantsRes = await query(
      `SELECT 
         cp.user_id,
         cp.role AS group_role,
         cp.created_at AS joined_at,
         u.name,
         u.username,
         u.avatar_url,
         COALESCE(
           (SELECT oe.position FROM organization_employees oe WHERE oe.user_id = u.id AND oe.status = 'ACTIVE' LIMIT 1),
           'Member'
         ) AS position
       FROM conversation_participants cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.conversation_id = $1
       ORDER BY 
         CASE WHEN cp.role = 'OWNER' THEN 1 WHEN cp.role = 'ADMIN' THEN 2 ELSE 3 END,
         u.name ASC;`,
      [convId]
    );

    const members = participantsRes.rows.map((row) => ({
      userId: row.user_id,
      name: row.name,
      username: row.username,
      avatarUrl: row.avatar_url,
      position: row.position,
      groupRole: row.group_role,
      joinedAt: row.joined_at,
      isCreator: conv.created_by === row.user_id,
    }));

    const caller = members.find((m) => m.userId === userId);
    const isCallerAdmin = caller && (caller.groupRole === "OWNER" || caller.groupRole === "ADMIN" || conv.created_by === userId);

    // Candidates: user's friends who are not yet in this group
    const existingIds = members.map((m) => m.userId);
    const candidatesRes = await query(
      `SELECT 
         u.id AS user_id, u.name, u.username, u.avatar_url
       FROM friendships f
       JOIN users u ON (u.id = CASE WHEN f.sender_user_id = $1 THEN f.receiver_user_id ELSE f.sender_user_id END)
       WHERE (f.sender_user_id = $1 OR f.receiver_user_id = $1)
         AND f.status = 'ACCEPTED'
         AND u.id != ALL($2::uuid[])
       ORDER BY u.name ASC;`,
      [userId, existingIds]
    );

    return res.status(200).json({
      conversation: {
        id: conv.id,
        name: conv.name,
        topic: conv.topic,
        createdAt: conv.created_at,
        creatorName: conv.creator_name,
        memberCount: members.length,
      },
      members,
      isCallerAdmin: !!isCallerAdmin,
      canDeleteGroup: conv.created_by === userId,
      availableCandidates: candidatesRes.rows,
    });
  } catch (err) {
    console.error("Failed to load personal group details:", err);
    return res.status(500).json({ error: "Failed to load group details." });
  }
});

/**
 * POST /api/personal/groups/:convId/participants
 * Adds members to a personal group
 */
router.post("/groups/:convId/participants", async (req: Request, res: Response) => {
  try {
    const { convId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;
    const { targetUserId, role = "MEMBER" } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: "Target user ID required." });
    }

    await query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
      [convId, targetUserId, role]
    );

    const namesRes = await query(
      "SELECT u1.name AS adder, u2.name AS added FROM users u1, users u2 WHERE u1.id = $1 AND u2.id = $2;",
      [userId, targetUserId]
    );
    if (namesRes.rows.length > 0) {
      const { adder, added } = namesRes.rows[0];
      await query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, 'SYSTEM');`,
        [convId, userId, `${adder} added ${added} to the group.`]
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to add participant to personal group:", err);
    return res.status(500).json({ error: "Failed to add member." });
  }
});

/**
 * DELETE /api/personal/groups/:convId/participants/:targetUserId
 * Removes member or self-leave from personal group
 */
router.delete("/groups/:convId/participants/:targetUserId", async (req: Request, res: Response) => {
  try {
    const { convId, targetUserId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    await query("DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2;", [
      convId,
      targetUserId,
    ]);

    const namesRes = await query(
      "SELECT u1.name AS remover, u2.name AS removed FROM users u1, users u2 WHERE u1.id = $1 AND u2.id = $2;",
      [userId, targetUserId]
    );
    if (namesRes.rows.length > 0) {
      const { remover, removed } = namesRes.rows[0];
      const msg = userId === targetUserId ? `${removed} left the group.` : `${remover} removed ${removed} from the group.`;
      await query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, 'SYSTEM');`,
        [convId, userId, msg]
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to remove member from personal group:", err);
    return res.status(500).json({ error: "Failed to remove member." });
  }
});

/**
 * DELETE /api/personal/groups/:convId
 * Deletes a personal group
 */
router.delete("/groups/:convId", async (req: Request, res: Response) => {
  try {
    const { convId } = req.params;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    const convResult = await query(
      "SELECT created_by FROM conversations WHERE id = $1 AND organization_id IS NULL AND type = 'GROUP';",
      [convId]
    );
    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    if (convResult.rows[0].created_by !== userId) {
      return res.status(403).json({ error: "Only the group creator can delete this group." });
    }

    await query("DELETE FROM conversations WHERE id = $1;", [convId]);

    return res.status(200).json({ success: true, message: "Group deleted successfully." });
  } catch (err) {
    console.error("Failed to delete personal group:", err);
    return res.status(500).json({ error: "Failed to delete group." });
  }
});

export default router;
