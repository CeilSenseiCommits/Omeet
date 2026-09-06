import { Router, Request, Response } from "express";
import { query } from "../db";

const router = Router();

/**
 * GET /api/friends
 * Returns all accepted friends of the user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }

    const friendsRes = await query(
      `SELECT 
         u.id, 
         u.name, 
         u.username, 
         u.avatar_url AS "avatarUrl", 
         u.email, 
         u.bio,
         f.id AS "friendshipId", 
         f.created_at AS "friendsSince",
         COALESCE(
           (
             SELECT json_build_object('name', o.name, 'position', oe.position)
             FROM organization_employees oe
             JOIN organizations o ON o.id = oe.organization_id
             WHERE oe.user_id = u.id AND oe.status = 'ACTIVE'
             ORDER BY oe.created_at ASC
             LIMIT 1
           ),
           NULL
         ) AS "primaryAffiliation"
       FROM friendships f
       JOIN users u ON (u.id = CASE WHEN f.sender_user_id = $1 THEN f.receiver_user_id ELSE f.sender_user_id END)
       WHERE (f.sender_user_id = $1 OR f.receiver_user_id = $1)
         AND f.status = 'ACCEPTED'
       ORDER BY u.name ASC;`,
      [userId]
    );

    return res.status(200).json({ friends: friendsRes.rows });
  } catch (err) {
    console.error("Failed to fetch friends:", err);
    return res.status(500).json({ error: "Failed to fetch friends." });
  }
});

/**
 * GET /api/friends/requests
 * Returns pending incoming and sent friend requests
 */
router.get("/requests", async (req: Request, res: Response) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }

    // Incoming requests (someone sent to me)
    const incomingRes = await query(
      `SELECT 
         f.id,
         f.status,
         f.created_at AS "createdAt",
         u.id AS "senderId",
         u.name AS "senderName",
         u.username AS "senderUsername",
         u.avatar_url AS "senderAvatarUrl",
         COALESCE(
           (
             SELECT oe.position
             FROM organization_employees oe
             WHERE oe.user_id = u.id AND oe.status = 'ACTIVE'
             LIMIT 1
           ),
           'Member'
         ) AS "senderPosition"
       FROM friendships f
       JOIN users u ON u.id = f.sender_user_id
       WHERE f.receiver_user_id = $1 AND f.status = 'PENDING'
       ORDER BY f.created_at DESC;`,
      [userId]
    );

    // Sent requests (I sent to someone)
    const sentRes = await query(
      `SELECT 
         f.id,
         f.status,
         f.created_at AS "createdAt",
         u.id AS "receiverId",
         u.name AS "receiverName",
         u.username AS "receiverUsername",
         u.avatar_url AS "receiverAvatarUrl"
       FROM friendships f
       JOIN users u ON u.id = f.receiver_user_id
       WHERE f.sender_user_id = $1 AND f.status = 'PENDING'
       ORDER BY f.created_at DESC;`,
      [userId]
    );

    return res.status(200).json({
      incoming: incomingRes.rows,
      sent: sentRes.rows,
      pendingCount: incomingRes.rows.length,
    });
  } catch (err) {
    console.error("Failed to fetch friend requests:", err);
    return res.status(500).json({ error: "Failed to fetch friend requests." });
  }
});

/**
 * POST /api/friends/request
 * Sends a friend request to targetUserId
 */
router.post("/request", async (req: Request, res: Response) => {
  try {
    const senderUserId = (req.headers["x-user-id"] as string) || req.body.senderUserId;
    const { targetUserId } = req.body;

    if (!senderUserId) {
      return res.status(401).json({ error: "Sender user ID required." });
    }
    if (!targetUserId || targetUserId === senderUserId) {
      return res.status(400).json({ error: "Cannot send friend request to yourself or invalid user." });
    }

    // Check existing friendship in either direction
    const existing = await query(
      `SELECT id, status, sender_user_id, receiver_user_id FROM friendships
       WHERE (sender_user_id = $1 AND receiver_user_id = $2)
          OR (sender_user_id = $2 AND receiver_user_id = $1);`,
      [senderUserId, targetUserId]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.status === "ACCEPTED") {
        return res.status(400).json({ error: "You are already friends." });
      }
      if (row.status === "PENDING") {
        if (row.sender_user_id === senderUserId) {
          return res.status(400).json({ error: "Friend request already sent." });
        } else {
          // The other person already sent a request to caller! Auto-accept
          await query(
            "UPDATE friendships SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1;",
            [row.id]
          );
          return res.status(200).json({ success: true, message: "Friend request accepted!" });
        }
      }
      // If was DECLINED, reset to PENDING
      await query(
        `UPDATE friendships 
         SET sender_user_id = $1, receiver_user_id = $2, status = 'PENDING', updated_at = NOW() 
         WHERE id = $3;`,
        [senderUserId, targetUserId, row.id]
      );
      return res.status(200).json({ success: true, message: "Friend request sent." });
    }

    await query(
      `INSERT INTO friendships (sender_user_id, receiver_user_id, status)
       VALUES ($1, $2, 'PENDING');`,
      [senderUserId, targetUserId]
    );

    return res.status(201).json({ success: true, message: "Friend request sent." });
  } catch (err) {
    console.error("Failed to send friend request:", err);
    return res.status(500).json({ error: "Failed to send friend request." });
  }
});

/**
 * POST /api/friends/requests/:id/respond
 * Accepts or declines a friend request
 */
router.post("/requests/:id/respond", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;
    const { action } = req.body;

    if (!["ACCEPT", "DECLINE"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use ACCEPT or DECLINE." });
    }

    const newStatus = action === "ACCEPT" ? "ACCEPTED" : "DECLINED";

    const updateRes = await query(
      `UPDATE friendships
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND receiver_user_id = $3
       RETURNING *;`,
      [newStatus, id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Friend request not found or unauthorized." });
    }

    return res.status(200).json({ success: true, status: newStatus });
  } catch (err) {
    console.error("Failed to respond to friend request:", err);
    return res.status(500).json({ error: "Failed to respond to friend request." });
  }
});

/**
 * POST /api/friends/chat/:friendUserId
 * Retrieves or initializes a personal 1-on-1 direct conversation with a friend
 */
router.post("/chat/:friendUserId", async (req: Request, res: Response) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || req.body.userId;
    const { friendUserId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID required." });
    }

    // Check if a direct personal conversation already exists between both users
    const existing = await query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = $1
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = $2
       WHERE c.organization_id IS NULL AND c.type = 'DIRECT'
       LIMIT 1;`,
      [userId, friendUserId]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({ conversationId: existing.rows[0].id });
    }

    // Create new personal conversation
    const newConv = await query(
      `INSERT INTO conversations (organization_id, type, is_private, created_by)
       VALUES (NULL, 'DIRECT', TRUE, $1)
       RETURNING id;`,
      [userId]
    );

    const convId = newConv.rows[0].id;

    // Enroll both users as participants
    await query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, 'MEMBER'), ($1, $3, 'MEMBER')
       ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
      [convId, userId, friendUserId]
    );

    return res.status(201).json({ conversationId: convId });
  } catch (err) {
    console.error("Failed to start personal friend chat:", err);
    return res.status(500).json({ error: "Failed to start chat." });
  }
});

export default router;
