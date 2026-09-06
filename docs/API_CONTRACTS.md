# API Contracts

All organization workspace endpoints require authenticated membership in `:organizationId`.

## In-App Notifications & Invitations

Notifications are currently dedicated to real, database-backed organization invitations across two primary streams: **Received** and **Sent**.

### GET /api/invitations/user/:userId

Returns all incoming invitations directed to the specified user (`oi.invitee_user_id = :userId`), including `PENDING`, `ACCEPTED`, and `REJECTED` states so history is retained in the notification drawer.

**Request**
- Path parameter: `userId` (UUID)

**Response**
```json
{
  "invitations": [
    {
      "id": "7b58c734-7164-4e3e-bc5d-0fa6d1dbb801",
      "invite_code": "OM-7K9P2X",
      "organization_id": "93f0cb18-20cf-4e31-8f85-3b9845d475ef",
      "organization_name": "OpenAI Research",
      "organization_brief": "Frontier AI lab and research collective.",
      "inviter_name": "Suryansh Rao",
      "inviter_avatar_url": "https://ui-avatars.com/api/?name=Suryansh+Rao&background=2563eb&color=ffffff",
      "position": "Staff Research Engineer",
      "department": "Reasoning & Alignment",
      "manager_name": "Suryansh Rao",
      "manager_position": "Founder & Research Lead",
      "status": "PENDING",
      "created_at": "2026-09-06T04:12:00.000Z",
      "expires_at": "2026-09-13T04:12:00.000Z"
    }
  ]
}
```

**Used by**
- `NotificationBell` (Calculates dynamic unread count where `status === 'PENDING'`)
- `NotificationDropdown` (Received tab)

---

### GET /api/invitations/sent/:userId

Returns all outgoing invitations sent by the authenticated user (`oi.inviter_user_id = :userId`), displaying the target invitee, position, status, and expiration.

**Request**
- Path parameter: `userId` (UUID)

**Response**
```json
{
  "invitations": [
    {
      "id": "7b58c734-7164-4e3e-bc5d-0fa6d1dbb801",
      "invite_code": "OM-7K9P2X",
      "organization_id": "93f0cb18-20cf-4e31-8f85-3b9845d475ef",
      "organization_name": "OpenAI Research",
      "invitee_id": "e42dc082-9f32-42ec-a068-07e3ea5935f8",
      "invitee_name": "Shivam Pandey",
      "invitee_username": "shivam",
      "invitee_avatar_url": "https://ui-avatars.com/api/?name=Shivam+Pandey&background=2563eb&color=ffffff",
      "position": "Staff Research Engineer",
      "department": "Reasoning & Alignment",
      "manager_name": "Suryansh Rao",
      "manager_position": "Founder & Research Lead",
      "status": "PENDING",
      "created_at": "2026-09-06T04:12:00.000Z",
      "expires_at": "2026-09-13T04:12:00.000Z"
    }
  ]
}
```

**Used by**
- `NotificationDropdown` (Sent tab)

---

### POST /api/invitations/:id/respond

Atomically processes an invitation response (`ACCEPT` or `REJECT`). When accepted, it creates an `organization_employees` membership record and increments `organizations.employee_count`.

**Request**
```json
{
  "action": "ACCEPT",
  "userId": "e42dc082-9f32-42ec-a068-07e3ea5935f8"
}
```

**Response**
```json
{
  "message": "Invitation accepted successfully",
  "status": "ACCEPTED",
  "organizationId": "93f0cb18-20cf-4e31-8f85-3b9845d475ef"
}
```

**Database Generation Rules**
- Atomic transaction:
  1. Validates invitation exists, is `PENDING`, matches `invitee_user_id = userId`, and has not expired.
  2. Updates `organization_invitations.status` to `'ACCEPTED'` (or `'REJECTED'`).
  3. If `ACCEPT`:
     - Inserts into `organization_employees (organization_id, user_id, manager_employee_id, position, role, salary, status, has_permission)`.
     - Increments `organizations.employee_count`.
  4. If `REJECT`:
     - Skips employee creation.
- Frontend dispatches `organization-updated` window event to refresh `OrganizationCarousel` on the dashboard.

**Used by**
- `NotificationItem` inline Accept/Decline action
- `InvitationPreviewPage`

---


### GET /api/me/organizations

**Expected request**
- Authenticated user context

**Expected response**
```json
{
  "organizations": [
    {
      "id": "openai-research",
      "name": "OpenAI Research"
    }
  ]
}
```

**Used by**
- Organization selector in InvitationPage

### POST /api/organizations/:organizationId/invitations

**Expected request**
```json
{
  "inviteeUserId": "user_1024",
  "position": "ML Engineer",
  "immediateSeniorId": "employee_205",
  "contactEmail": "hr@example.com",
  "contactPhone": "+91..."
}
```

**Expected response**
```json
{
  "invitationId": "inv_890",
  "status": "PENDING",
  "createdAt": "2024-03-10T12:00:00Z"
}
```

**Notes**
- **Validation**: Backend must validate that the inviter is authenticated, belongs to the organization, and has permission to invite. Must validate the invitee exists and is not already an active member, and that no duplicate pending invitations exist.
- **Token Generation**: The backend MUST generate the secure invitation token. The frontend will NOT generate this token.
- **Relationships**: The `inviterUserId` is derived from authentication context, not the request payload.

**Used by**
- Send Invitation action in InvitationPage

## Invitations (Receiver / Validation)

### POST /api/invitations/validate-code

**Expected request**
```json
{
  "code": "OPENAI-ML-2026"
}
```

**Expected response**
```json
{
  "invitationId": "inv_001",
  "isValid": true
}
```

**Used by**
- JoinOrganizationModal

### GET /api/invitations/:invitationId

**Expected request**
- Authenticated user context

**Expected response**
```json
{
  "invitationId": "inv_001",
  "code": "OPENAI-ML-2026",
  "organization": { "id": "org_001", "name": "OpenAI Research", "description": "...", "industry": "...", "size": "..." },
  "invitee": { "id": "user_1024", "name": "Suryansh Rao", "username": "suryansh" },
  "inviter": { "id": "user_201", "name": "Priya Sharma", "role": "HR Manager", "email": "...", "phone": "..." },
  "position": "ML Engineer",
  "department": "Applied AI",
  "employmentType": "Full-time",
  "joiningDate": "2026-09-15",
  "directSenior": { "id": "emp_301", "name": "Rahul Verma", "position": "Senior ML Engineer" },
  "contactEmail": "hr@...",
  "contactPhone": "+91...",
  "status": "PENDING",
  "createdAt": "2026-08-31T00:00:00Z",
  "expiresAt": "2026-09-07T00:00:00Z"
}
```

**Notes**
- Validates the invitation exists, hasn't expired, and belongs to the authenticated user.

**Used by**
- InvitationPreviewPage

### POST /api/invitations/:invitationId/accept

**Expected request**
- Authenticated user context

**Expected response**
```json
{
  "success": true,
  "message": "Invitation accepted successfully."
}
```

**Database Generation Rules**
- Backend marks the invitation status as `ACCEPTED`.
- Backend creates an `OrganizationEmployees` record binding the user to the organization with the specified role and reporting structure.
- Notification updates to reflect acceptance.

**Used by**
- InvitationPreviewPage Accept Action

### POST /api/invitations/:invitationId/decline

**Expected request**
- Authenticated user context

**Expected response**
```json
{
  "success": true,
  "message": "Invitation declined."
}
```

**Database Generation Rules**
- Backend marks the invitation status as `DECLINED`.
- Notifies the sender.

**Used by**
- InvitationPreviewPage Decline Action

## User Search and Profile APIs

### GET /api/users/search

Live PostgreSQL search across registered users by display name, `@username`, or email. Automatically enriches each user with their primary active organization and position. Supports excluding current user and existing organization members/pending invitees.

**Request**
- Query parameters:
  - `q`: Search query string (min length: 2 characters)
  - `currentUserId` *(optional)*: Exclude caller from search results
  - `orgId` *(optional)*: Exclude existing employees or pending invitees of an organization

**Response**
```json
{
  "users": [
    {
      "id": "e42dc082-9f32-42ec-a068-07e3ea5935f8",
      "name": "Shivam Pandey",
      "username": "shivam",
      "email": "shivam@example.com",
      "avatarUrl": "https://ui-avatars.com/api/?name=Shivam+Pandey&background=2563eb&color=ffffff",
      "initials": "SP",
      "bio": "Distributed systems engineer.",
      "timezone": "Asia/Kolkata",
      "organization": "OpenAI Research",
      "position": "Staff Research Engineer"
    }
  ]
}
```

**Used by**
- `SearchBar` (Top navigation with 300ms debounce and AbortController)
- `InviteToOrganization` (Invitee search and autocomplete)

---

### GET /api/users/profile/:userId

Fetches complete public profile data for any user by UUID or `@username`, including profile basics, active organization memberships, and roles.

**Request**
- Path parameter: `userId` (UUID or username handle)

**Response**
```json
{
  "user": {
    "id": "e42dc082-9f32-42ec-a068-07e3ea5935f8",
    "name": "Shivam Pandey",
    "username": "shivam",
    "email": "shivam@example.com",
    "avatarUrl": "https://ui-avatars.com/api/?name=Shivam+Pandey&background=2563eb&color=ffffff",
    "initials": "SP",
    "bio": "Distributed systems engineer.",
    "location": "Asia/Kolkata",
    "timezone": "Asia/Kolkata",
    "position": "Staff Research Engineer",
    "organization": "OpenAI Research",
    "organizations": ["OpenAI Research"],
    "skills": ["Collaboration", "Real-Time Comms", "Team Productivity"]
  }
}
```

**Used by**
- `PublicProfilePage` (`/profile/:userId`)


## Organization Details & Workspace

### GET /api/organizations/:id
Returns organization metadata, active employee count, live meeting count, and user's role and permission state. Used by `OrgWorkspaceLayout` and header.

### POST /api/organizations
Creates a new organization with an atomic transaction (organization record + owner employee record + default channels `# general` and `# random`).

---

## Organization Conversations & Chat System

### GET /api/organizations/:id/conversations
Returns chat rooms (channels), team groups, and direct messages for the organization sidebar, dynamically computing unread message counts for the authenticated user based on `conversation_participants.last_read_at`.

**Request**:
- Headers: `x-user-id: <uuid>` or Query `?userId=<uuid>`

**Response**:
```json
{
  "chatRooms": [
    { "id": "uuid", "name": "general", "unreadCount": 0, "active": true }
  ],
  "groups": [
    { "id": "uuid", "name": "Core Engineering", "unreadCount": 3, "active": true }
  ],
  "directMessages": [
    {
      "id": "conv-uuid",
      "userId": "user-uuid",
      "name": "Sarah Connor",
      "avatarUrl": "https://...",
      "role": "Lead Architect",
      "lastSeen": "Active now",
      "unreadCount": 2,
      "active": true
    }
  ]
}
```

### POST /api/organizations/:id/conversations/:convId/read
Marks a conversation as read by updating caller's `last_read_at = NOW()` in `conversation_participants`.

**Request**:
- Headers: `x-user-id: <uuid>` or Body `{ "userId": "<uuid>" }`

**Response**:
```json
{ "success": true }
```

### GET /api/organizations/:id/conversations/:convId/messages
Fetches message history for a conversation, auto-marks messages read for the requesting user, and returns recipient/group context.

**Request**:
- Headers: `x-user-id: <uuid>` or Query `?userId=<uuid>`

**Response**:
```json
{
  "conversation": {
    "id": "uuid",
    "type": "GROUP",
    "name": "Core Engineering",
    "topic": "Frontend and backend architecture",
    "isPrivate": false,
    "participantCount": 6
  },
  "recipient": null,
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "user-uuid",
      "senderName": "Suryansh Rao",
      "senderUsername": "suryansh",
      "senderAvatarUrl": "https://...",
      "senderPosition": "Staff Engineer",
      "content": "Standup starting in 5 minutes.",
      "messageType": "TEXT",
      "attachments": [],
      "replyToId": null,
      "isEdited": false,
      "createdAt": "2026-09-06T09:00:00Z"
    }
  ]
}
```

### POST /api/organizations/:id/conversations/:convId/messages
Sends a message (TEXT, SYSTEM, FILE, or MEETING_LINK) to a conversation. Updates `conversations.updated_at` and caller's `last_read_at`.

**Request**:
```json
{
  "content": "Here is the agenda for our review.",
  "messageType": "TEXT",
  "attachments": []
}
```

**Response**:
```json
{
  "message": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "senderName": "Suryansh Rao",
    "senderUsername": "suryansh",
    "senderAvatarUrl": "https://...",
    "senderPosition": "Staff Engineer",
    "content": "Here is the agenda for our review.",
    "messageType": "TEXT",
    "attachments": [],
    "isEdited": false,
    "createdAt": "2026-09-06T09:05:00Z"
  }
}
```

### GET /api/organizations/:id/conversations/:convId/details
Fetches detailed group info, member roster with roles (`OWNER`, `ADMIN`, `MEMBER`), caller permissions, and available candidate colleagues eligible to be added.

### POST /api/organizations/:id/conversations/:convId/participants
Enrolls a new member into the group (admin/owner permission required) and automatically posts a system audit message.

### DELETE /api/organizations/:id/conversations/:convId/participants/:targetUserId
Removes a member from the group (admin required) or executes self-leave. Enforces protection preventing removal of the group owner. Posts system activity message.

### DELETE /api/organizations/:id/conversations/:convId
Permanently deletes a custom group and cascades participants and messages. Protected against deleting default channels (`general` and `random`).

---

## Meetings & Video Conferencing API Suite

### POST /api/organizations/:id/meetings
Creates an organization-scoped meeting (Instant or Scheduled) with optional hierarchy mode toggle (`is_hierarchical: boolean`). Enrolls participants and dispatches invitations.

**Request Body**:
```json
{
  "title": "Weekly Sprint Planning",
  "hostUserId": "user-uuid",
  "scheduledAt": "2026-09-07T10:00:00Z",
  "meetingType": "SCHEDULED",
  "isHierarchical": false,
  "scope": "ORG_WIDE",
  "participantUserIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Response**:
```json
{
  "success": true,
  "meeting": {
    "id": "uuid",
    "meetingCode": "OM-ABC123",
    "title": "Weekly Sprint Planning",
    "status": "SCHEDULED"
  }
}
```

### POST /api/meetings/public
Creates an open, non-hierarchical meeting without organization binding (e.g. from Home page Meet section).

**Request Body**:
```json
{
  "title": "Quick Sync",
  "userId": "user-uuid",
  "meetingCode": "OM-XYZ789",
  "participantUserIds": ["optional-user-uuid"]
}
```

### GET /api/meetings/:meetingCode
Access gatekeeper check and meeting room resolution:
1. Runs automated cleanup rules (20-min no-show, 10-min abandonment).
2. For organization-scoped meetings: verifies caller is an active employee of the hosting organization. Returns 403 Forbidden with `isRestricted: true` if unauthorized.
3. For public meetings: open to all authenticated users.
4. Auto-enrolls the caller into `meeting_participants` and marks any pending `meeting_invitations` as `ACCEPTED`.

**Response**:
```json
{
  "meeting": {
    "id": "uuid",
    "meetingCode": "OM-ABC123",
    "title": "Weekly Sprint Planning",
    "status": "LIVE",
    "scope": "ORG_WIDE",
    "meetingType": "INSTANT",
    "isHierarchical": false,
    "scheduledAt": "2026-09-06T09:00:00Z",
    "startedAt": "2026-09-06T09:00:00Z",
    "endedAt": null,
    "isEnded": false,
    "host": {
      "id": "user-uuid",
      "name": "Suryansh Rao",
      "avatarUrl": "https://..."
    },
    "organization": {
      "id": "org-uuid",
      "name": "Acme Corp"
    },
    "userRole": "ADMIN",
    "participants": [
      { "id": "uuid", "name": "Suryansh Rao", "avatarUrl": "https://...", "role": "HOST" }
    ]
  }
}
```

### POST /api/meetings/join
Validates a meeting code entered via "Join with Code", checks organization membership constraints, registers participant, and returns meeting context.

**Request Body**:
```json
{
  "meetingCode": "OM-ABC123",
  "userId": "user-uuid"
}
```

### POST /api/meetings/:meetingCode/end
Meeting host ends the meeting for all participants:
- Verifies caller is `host_user_id`.
- Sets `organization_meetings.status = 'ENDED'` and `ended_at = NOW()`.
- Sets `meeting_participants.left_at = NOW()` for all active participants.

**Request Body**:
```json
{
  "userId": "host-user-uuid"
}
```

### POST /api/meetings/:meetingCode/leave
Individual participant leaves the meeting room:
- Sets `meeting_participants.left_at = NOW()` for the caller.
- Triggers auto-expiration check: if all participants have left, the 10-minute abandonment grace timer begins.

**Request Body**:
```json
{
  "userId": "caller-user-uuid"
}
```

### GET /api/meetings/invitations/user/:userId
Fetches all meeting invitations dispatched to a user, optionally filtered by `?organizationId=...`.

### POST /api/meetings/invitations/:id/respond
Responds to a meeting invitation (`ACCEPT` or `DECLINE`).

**Request Body**:
```json
{
  "action": "ACCEPT",
  "userId": "user-uuid"
}
```

### GET /api/organizations/:id/meetings
Returns ongoing, upcoming, and recently ended meetings for the organization dashboard `MeetingsTab`. Executes auto-clean rules before returning.
