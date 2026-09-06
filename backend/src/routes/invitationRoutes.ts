import { Router, Request, Response } from "express";
import crypto from "crypto";
import { pool, query } from "../db";

const router = Router({ mergeParams: true });

/**
 * Generates a branded, unique invite code: e.g. "OM-7K9P2X"
 */
function generateInviteCode(): string {
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `OM-${hex}`;
}

/**
 * GET /api/organizations/:id/invitations/eligibility
 * Checks if the requesting user has permission to invite (has_permission = TRUE or role = 'OWNER')
 * and returns the list of eligible direct seniors (the inviter + all their direct/indirect subordinates).
 */
router.get("/eligibility", async (req: Request, res: Response) => {
  try {
    const orgId = req.params.id;
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    if (!userId) {
      return res.status(401).json({ error: "User ID required in x-user-id header or query." });
    }

    // 1. Fetch organization and verify inviter membership
    const orgResult = await query(
      `SELECT id, name, brief, description, owner_id FROM organizations WHERE id = $1 LIMIT 1;`,
      [orgId]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found." });
    }
    const org = orgResult.rows[0];

    const memberResult = await query(
      `SELECT oe.id, oe.position, oe.role, oe.has_permission, oe.status, u.name, u.avatar_url
       FROM organization_employees oe
       JOIN users u ON u.id = oe.user_id
       WHERE oe.organization_id = $1 AND oe.user_id = $2 AND oe.status = 'ACTIVE'
       LIMIT 1;`,
      [orgId, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        canInvite: false,
        reason: "You are not an active member of this organization.",
      });
    }

    const member = memberResult.rows[0];
    const isOwner = member.role === "OWNER" || org.owner_id === userId;
    const canInvite = isOwner || member.has_permission === true;

    if (!canInvite) {
      return res.status(403).json({
        canInvite: false,
        reason: "You do not have permission to invite members to this organization. Only the Owner and members with granted invite permissions can invite colleagues.",
        userRole: member.role,
        hasPermission: member.has_permission,
      });
    }

    // 2. Fetch eligible direct seniors via Recursive Common Table Expression (CTE)
    // Rule: Direct senior must be either the inviter themselves OR someone in their subordinate tree (direct or indirect)
    const hierarchyResult = await query(
      `WITH RECURSIVE subordinates AS (
         -- Depth 0: The inviter themselves
         SELECT 
           oe.id AS employee_id,
           oe.user_id,
           oe.position,
           oe.role,
           oe.manager_employee_id,
           u.name,
           u.username,
           u.email,
           u.avatar_url,
           0 AS depth
         FROM organization_employees oe
         JOIN users u ON u.id = oe.user_id
         WHERE oe.organization_id = $1 AND oe.user_id = $2 AND oe.status = 'ACTIVE'

         UNION ALL

         -- Depth > 0: Subordinates reporting directly or indirectly to members in subordinates
         SELECT 
           oe.id AS employee_id,
           oe.user_id,
           oe.position,
           oe.role,
           oe.manager_employee_id,
           u.name,
           u.username,
           u.email,
           u.avatar_url,
           s.depth + 1 AS depth
         FROM organization_employees oe
         JOIN users u ON u.id = oe.user_id
         JOIN subordinates s ON oe.manager_employee_id = s.employee_id
         WHERE oe.organization_id = $1 AND oe.status = 'ACTIVE'
       )
       SELECT * FROM subordinates ORDER BY depth ASC, name ASC;`,
      [orgId, userId]
    );

    const eligibleSeniors = hierarchyResult.rows.map((row) => ({
      employeeId: row.employee_id,
      userId: row.user_id,
      name: row.name,
      username: row.username,
      email: row.email,
      avatarUrl: row.avatar_url,
      position: row.position,
      role: row.role,
      depth: row.depth,
      isSelf: row.depth === 0,
      label: row.depth === 0 
        ? `Myself (${row.name} - ${row.position})`
        : `${row.name} - ${row.position} (Reports under you)`,
    }));

    return res.status(200).json({
      canInvite: true,
      isOwner,
      hasPermission: member.has_permission,
      inviterEmployeeId: member.id,
      inviterName: member.name,
      inviterPosition: member.position,
      organization: {
        id: org.id,
        name: org.name,
        brief: org.brief,
        description: org.description,
      },
      eligibleSeniors,
    });
  } catch (error) {
    console.error("Error checking invite eligibility:", error);
    return res.status(500).json({ error: "Failed to verify invite permissions." });
  }
});

/**
 * POST /api/organizations/:id/invitations
 * Creates an in-app invitation for an existing registered OMeet user with unique invite code and custom expiry
 */
router.post("/", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const orgId = req.params.id;
    const inviterUserId = (req.headers["x-user-id"] as string) || req.body.inviterUserId;
    const { inviteeUserId, position, department, managerEmployeeId, role, salary, expiryDays } = req.body;

    if (!inviterUserId) {
      return res.status(401).json({ error: "Inviter user ID required." });
    }
    if (!inviteeUserId) {
      return res.status(400).json({ error: "Invitee user must be selected from registered OMeet users." });
    }
    if (!position || !position.trim()) {
      return res.status(400).json({ error: "Target position is required." });
    }
    if (!managerEmployeeId) {
      return res.status(400).json({ error: "Direct senior (manager) must be assigned." });
    }

    // 1. Verify inviter permission
    const inviterCheck = await client.query(
      `SELECT oe.id, oe.role, oe.has_permission, o.owner_id
       FROM organization_employees oe
       JOIN organizations o ON o.id = oe.organization_id
       WHERE oe.organization_id = $1 AND oe.user_id = $2 AND oe.status = 'ACTIVE'
       LIMIT 1;`,
      [orgId, inviterUserId]
    );

    if (inviterCheck.rows.length === 0) {
      return res.status(403).json({ error: "You are not an active member of this organization." });
    }

    const inviter = inviterCheck.rows[0];
    const isOwner = inviter.role === "OWNER" || inviter.owner_id === inviterUserId;
    if (!isOwner && !inviter.has_permission) {
      return res.status(403).json({ error: "You do not have permission to invite members." });
    }

    // 2. Hierarchical Senior Constraint Verification
    // Direct senior MUST be inviter themselves OR in inviter's subordinate tree
    const seniorValidation = await client.query(
      `WITH RECURSIVE subordinates AS (
         SELECT oe.id AS employee_id
         FROM organization_employees oe
         WHERE oe.organization_id = $1 AND oe.user_id = $2 AND oe.status = 'ACTIVE'

         UNION ALL

         SELECT oe.id AS employee_id
         FROM organization_employees oe
         JOIN subordinates s ON oe.manager_employee_id = s.employee_id
         WHERE oe.organization_id = $1 AND oe.status = 'ACTIVE'
       )
       SELECT 1 FROM subordinates WHERE employee_id = $3 LIMIT 1;`,
      [orgId, inviterUserId, managerEmployeeId]
    );

    if (seniorValidation.rows.length === 0) {
      return res.status(400).json({
        error: "Hierarchical restriction violated: You can only assign yourself or someone in your subordinate tree as the direct senior.",
      });
    }

    // 3. Verify invitee exists and isn't already employed or pending
    const inviteeCheck = await client.query(`SELECT id, name, email FROM users WHERE id = $1 LIMIT 1;`, [inviteeUserId]);
    if (inviteeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Selected user does not exist in OMeet." });
    }

    const memberCheck = await client.query(
      `SELECT id FROM organization_employees WHERE organization_id = $1 AND user_id = $2 AND status = 'ACTIVE' LIMIT 1;`,
      [orgId, inviteeUserId]
    );
    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: "This user is already an active member of this organization." });
    }

    const pendingCheck = await client.query(
      `SELECT id FROM organization_invitations WHERE organization_id = $1 AND invitee_user_id = $2 AND status = 'PENDING' LIMIT 1;`,
      [orgId, inviteeUserId]
    );
    if (pendingCheck.rows.length > 0) {
      return res.status(400).json({ error: "An invitation is already pending for this user." });
    }

    // 4. Generate unique invite code & calculate expiration
    let inviteCode = generateInviteCode();
    // Ensure uniqueness
    let exists = await client.query(`SELECT id FROM organization_invitations WHERE invite_code = $1 LIMIT 1;`, [inviteCode]);
    while (exists.rows.length > 0) {
      inviteCode = generateInviteCode();
      exists = await client.query(`SELECT id FROM organization_invitations WHERE invite_code = $1 LIMIT 1;`, [inviteCode]);
    }

    const durationDays = parseInt(expiryDays, 10) || 7;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // 5. Insert into organization_invitations
    const insertResult = await client.query(
      `INSERT INTO organization_invitations (
         invite_code,
         organization_id,
         inviter_user_id,
         inviter_employee_id,
         invitee_user_id,
         position,
         department,
         manager_employee_id,
         role,
         salary,
         status,
         expires_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11)
       RETURNING *;`,
      [
        inviteCode,
        orgId,
        inviterUserId,
        inviter.id,
        inviteeUserId,
        position.trim(),
        department ? department.trim() : null,
        managerEmployeeId,
        role || "MEMBER",
        salary ? parseFloat(salary) : null,
        expiresAt,
      ]
    );

    const newInvite = insertResult.rows[0];

    return res.status(201).json({
      success: true,
      invitation: {
        id: newInvite.id,
        inviteCode: newInvite.invite_code,
        organizationId: newInvite.organization_id,
        inviteeUserId: newInvite.invitee_user_id,
        position: newInvite.position,
        department: newInvite.department,
        managerEmployeeId: newInvite.manager_employee_id,
        role: newInvite.role,
        salary: newInvite.salary,
        status: newInvite.status,
        expiresAt: newInvite.expires_at,
        createdAt: newInvite.created_at,
      },
    });
  } catch (error) {
    console.error("Error creating organization invitation:", error);
    return res.status(500).json({ error: "Database error creating invitation." });
  } finally {
    client.release();
  }
});

/**
 * GET /api/invitations/user/:userId
 * Fetches all pending, unexpired invitations for a specific user (queried upon login / home page load)
 */
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT 
         oi.id,
         oi.invite_code,
         oi.organization_id,
         oi.position,
         oi.department,
         oi.role,
         oi.salary,
         oi.status,
         oi.expires_at,
         oi.created_at,
         o.name AS organization_name,
         o.brief AS organization_brief,
         o.description AS organization_description,
         u_inviter.name AS inviter_name,
         u_inviter.avatar_url AS inviter_avatar_url,
         oe_manager.position AS manager_position,
         u_manager.name AS manager_name
       FROM organization_invitations oi
       JOIN organizations o ON o.id = oi.organization_id
       JOIN users u_inviter ON u_inviter.id = oi.inviter_user_id
       JOIN organization_employees oe_manager ON oe_manager.id = oi.manager_employee_id
       JOIN users u_manager ON u_manager.id = oe_manager.user_id
        WHERE oi.invitee_user_id = $1 
          AND (
            (oi.status = 'PENDING' AND (oi.expires_at IS NULL OR oi.expires_at > NOW()))
            OR oi.status IN ('ACCEPTED', 'REJECTED')
          )
        ORDER BY 
          CASE WHEN oi.status = 'PENDING' THEN 1 ELSE 2 END,
          oi.updated_at DESC
        LIMIT 30;`,
      [userId]
    );

    const invitations = result.rows.map((row) => ({
      id: row.id,
      inviteCode: row.invite_code,
      organizationId: row.organization_id,
      organizationName: row.organization_name,
      organizationBrief: row.organization_brief,
      organizationDescription: row.organization_description,
      position: row.position,
      department: row.department,
      role: row.role,
      salary: row.salary,
      inviterName: row.inviter_name,
      inviterAvatarUrl: row.inviter_avatar_url,
      managerName: row.manager_name,
      managerPosition: row.manager_position,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      status: row.status,
    }));

    return res.status(200).json({ invitations });
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    return res.status(500).json({ error: "Failed to query pending invitations." });
  }
});

/**
 * GET /api/invitations/sent/:userId
 * Fetches invitations sent by the user (as an inviter / HR / manager)
 */
router.get("/sent/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT 
         oi.id,
         oi.invite_code,
         oi.organization_id,
         oi.position,
         oi.department,
         oi.role,
         oi.status,
         oi.expires_at,
         oi.created_at,
         o.name AS organization_name,
         u_invitee.name AS invitee_name,
         u_invitee.username AS invitee_username,
         u_invitee.avatar_url AS invitee_avatar_url
       FROM organization_invitations oi
       JOIN organizations o ON o.id = oi.organization_id
       JOIN users u_invitee ON u_invitee.id = oi.invitee_user_id
       WHERE oi.inviter_user_id = $1
       ORDER BY oi.created_at DESC
       LIMIT 30;`,
      [userId]
    );

    const sentInvitations = result.rows.map((row) => ({
      id: row.id,
      inviteCode: row.invite_code,
      organizationId: row.organization_id,
      organizationName: row.organization_name,
      position: row.position,
      department: row.department,
      role: row.role,
      status: row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      inviteeName: row.invitee_name,
      inviteeUsername: row.invitee_username,
      inviteeAvatarUrl: row.invitee_avatar_url,
    }));

    return res.status(200).json({ invitations: sentInvitations });
  } catch (error) {
    console.error("Error fetching sent invitations:", error);
    return res.status(500).json({ error: "Failed to query sent invitations." });
  }
});

/**
 * GET /api/invitations/code/:code
 * Validates an invite code and returns invitation preview.
 * ENFORCES ACCOUNT EXCLUSIVITY: Checks that requesting user matches invitee_user_id.
 */
router.get("/code/:code", async (req: Request, res: Response) => {
  try {
    const rawCode = ((req.params.code as string) || "").trim().toUpperCase();
    const requestingUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    if (!rawCode) {
      return res.status(400).json({ isValid: false, error: "Invite code is required." });
    }

    const result = await query(
      `SELECT 
         oi.id,
         oi.invite_code,
         oi.organization_id,
         oi.invitee_user_id,
         oi.position,
         oi.department,
         oi.role,
         oi.salary,
         oi.status,
         oi.expires_at,
         oi.created_at,
         o.name AS organization_name,
         o.brief AS organization_brief,
         o.description AS organization_description,
         u_inviter.name AS inviter_name,
         u_inviter.avatar_url AS inviter_avatar_url,
         oe_manager.position AS manager_position,
         u_manager.name AS manager_name,
         u_invitee.username AS invitee_username,
         u_invitee.name AS invitee_name
       FROM organization_invitations oi
       JOIN organizations o ON o.id = oi.organization_id
       JOIN users u_inviter ON u_inviter.id = oi.inviter_user_id
       JOIN users u_invitee ON u_invitee.id = oi.invitee_user_id
       JOIN organization_employees oe_manager ON oe_manager.id = oi.manager_employee_id
       JOIN users u_manager ON u_manager.id = oe_manager.user_id
       WHERE UPPER(oi.invite_code) = $1 
       LIMIT 1;`,
      [rawCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ isValid: false, error: "Invalid invitation code. Please check the code and try again." });
    }

    const invite = result.rows[0];

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ isValid: false, error: "This invitation code has expired." });
    }

    // Check if already used
    if (invite.status !== "PENDING") {
      return res.status(400).json({ isValid: false, error: `This invitation has already been ${invite.status.toLowerCase()}.` });
    }

    // ENFORCE ACCOUNT EXCLUSIVITY
    if (requestingUserId && invite.invitee_user_id !== requestingUserId) {
      return res.status(403).json({
        isValid: false,
        isWrongAccount: true,
        error: `This invitation code was issued exclusively to @${invite.invitee_username} (${invite.invitee_name}). You are logged in with a different account.`,
      });
    }

    return res.status(200).json({
      isValid: true,
      invitationId: invite.id,
      inviteCode: invite.invite_code,
      organizationId: invite.organization_id,
      organizationName: invite.organization_name,
      organizationBrief: invite.organization_brief,
      organizationDescription: invite.organization_description,
      position: invite.position,
      department: invite.department,
      role: invite.role,
      salary: invite.salary,
      inviterName: invite.inviter_name,
      inviterAvatarUrl: invite.inviter_avatar_url,
      managerName: invite.manager_name,
      managerPosition: invite.manager_position,
      expiresAt: invite.expires_at,
      createdAt: invite.created_at,
    });
  } catch (error) {
    console.error("Error validating invite code:", error);
    return res.status(500).json({ isValid: false, error: "Server error validating invitation code." });
  }
});

/**
 * GET /api/invitations/:id
 * Fetches invitation details for the InvitationPreviewPage with exclusivity check
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const inviteId = req.params.id;
    const requestingUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string);

    const result = await query(
      `SELECT 
         oi.id,
         oi.invite_code,
         oi.organization_id,
         oi.inviter_user_id,
         oi.invitee_user_id,
         oi.position,
         oi.department,
         oi.role,
         oi.salary,
         oi.status,
         oi.expires_at,
         oi.created_at,
         o.name AS organization_name,
         o.brief AS organization_brief,
         o.description AS organization_description,
         u_inviter.name AS inviter_name,
         u_inviter.avatar_url AS inviter_avatar_url,
         oe_manager.position AS manager_position,
         u_manager.name AS manager_name,
         u_invitee.username AS invitee_username,
         u_invitee.name AS invitee_name
       FROM organization_invitations oi
       JOIN organizations o ON o.id = oi.organization_id
       JOIN users u_inviter ON u_inviter.id = oi.inviter_user_id
       JOIN users u_invitee ON u_invitee.id = oi.invitee_user_id
       JOIN organization_employees oe_manager ON oe_manager.id = oi.manager_employee_id
       JOIN users u_manager ON u_manager.id = oe_manager.user_id
       WHERE oi.id = $1 
       LIMIT 1;`,
      [inviteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invitation not found." });
    }

    const invite = result.rows[0];

    // Exclusivity / Authorization check:
    // User can view if:
    // 1. User is the invitee
    // 2. User is the inviter who created the invitation
    // 3. User is an owner, admin, or has permission in that organization
    let isAuthorized = false;
    let isSenderOrAdmin = false;

    if (!requestingUserId) {
      isAuthorized = true;
    } else if (invite.invitee_user_id === requestingUserId) {
      isAuthorized = true;
    } else if (invite.inviter_user_id === requestingUserId) {
      isAuthorized = true;
      isSenderOrAdmin = true;
    } else {
      const permCheck = await query(
        `SELECT id, role, has_permission FROM organization_employees 
         WHERE organization_id = $1 AND user_id = $2 
         LIMIT 1;`,
        [invite.organization_id, requestingUserId]
      );
      if (permCheck.rows.length > 0) {
        const emp = permCheck.rows[0];
        if (emp.role === "OWNER" || emp.role === "ADMIN" || emp.has_permission) {
          isAuthorized = true;
          isSenderOrAdmin = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        error: `This invitation was issued exclusively to @${invite.invitee_username}. You are logged in with a different account.`,
      });
    }

    return res.status(200).json({
      invitation: {
        id: invite.id,
        inviteCode: invite.invite_code,
        organizationId: invite.organization_id,
        organizationName: invite.organization_name,
        organizationBrief: invite.organization_brief,
        organizationDescription: invite.organization_description,
        inviteeUserId: invite.invitee_user_id,
        inviteeName: invite.invitee_name,
        inviteeUsername: invite.invitee_username,
        inviterUserId: invite.inviter_user_id,
        position: invite.position,
        department: invite.department,
        role: invite.role,
        salary: invite.salary,
        status: invite.status,
        inviterName: invite.inviter_name,
        inviterAvatarUrl: invite.inviter_avatar_url,
        managerName: invite.manager_name,
        managerPosition: invite.manager_position,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
        isSenderOrAdmin,
      },
    });
  } catch (error) {
    console.error("Error fetching invitation by id:", error);
    return res.status(500).json({ error: "Database error fetching invitation." });
  }
});

/**
 * POST /api/invitations/:id/respond
 * Action: 'ACCEPT' or 'REJECT' an in-app invitation
 */
router.post("/:id/respond", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const inviteId = req.params.id;
    const { action, userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required." });
    }
    if (action !== "ACCEPT" && action !== "REJECT") {
      return res.status(400).json({ error: "Action must be 'ACCEPT' or 'REJECT'." });
    }

    const inviteResult = await client.query(
      `SELECT * FROM organization_invitations WHERE id = $1 AND invitee_user_id = $2 AND status = 'PENDING' LIMIT 1;`,
      [inviteId, userId]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ error: "Invitation not found or no longer pending." });
    }

    const invite = inviteResult.rows[0];

    // Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await client.query(`UPDATE organization_invitations SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1;`, [inviteId]);
      return res.status(410).json({ error: "This invitation has expired." });
    }

    if (action === "REJECT") {
      await client.query(`UPDATE organization_invitations SET status = 'REJECTED', updated_at = NOW() WHERE id = $1;`, [inviteId]);
      return res.status(200).json({ success: true, message: "Invitation rejected." });
    }

    // ACCEPT: Atomic transaction
    await client.query("BEGIN;");

    // 1. Update invitation status
    await client.query(`UPDATE organization_invitations SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1;`, [inviteId]);

    // 2. Increment organization employee_count
    await client.query(
      `UPDATE organizations SET employee_count = employee_count + 1, updated_at = NOW() WHERE id = $1;`,
      [invite.organization_id]
    );

    // 3. Insert into organization_employees
    const newEmployee = await client.query(
      `INSERT INTO organization_employees (
         organization_id,
         user_id,
         manager_employee_id,
         position,
         role,
         salary,
         has_permission,
         status,
         joining_date,
         last_accessed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, 'ACTIVE', CURRENT_DATE, NOW())
       RETURNING *;`,
      [
        invite.organization_id,
        invite.invitee_user_id,
        invite.manager_employee_id,
        invite.position,
        invite.role,
        invite.salary,
      ]
    );

    // 4. Enroll new employee into public organization channels (e.g. general, random)
    await client.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       SELECT id, $1, 'MEMBER'
       FROM conversations
       WHERE organization_id = $2 AND is_private = FALSE
       ON CONFLICT (conversation_id, user_id) DO NOTHING;`,
      [invite.invitee_user_id, invite.organization_id]
    );

    await client.query("COMMIT;");

    return res.status(200).json({
      success: true,
      message: "Successfully joined organization!",
      organizationId: invite.organization_id,
      membership: newEmployee.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK;");
    console.error("Error processing invitation response:", error);
    return res.status(500).json({ error: "Failed to process invitation." });
  } finally {
    client.release();
  }
});

export default router;
