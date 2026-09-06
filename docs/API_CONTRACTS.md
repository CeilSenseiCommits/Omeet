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


## Organization Details

## Organization and communication

### GET /api/organizations/:organizationId

Returns organization identity, avatar, status, member count, active-meeting count, and description. Used by the workspace header and utility rail.

### GET /api/organizations/:organizationId/chatrooms

Returns chat rooms available to the member: `id`, `name`, `unreadCount`, and membership/access state. Used by `OrgSidebar`.

### POST /api/organizations

**Expected request**
- Authenticated user context (backend resolves `userId` from auth)
```json
{
  "name": "Acme Corp",
  "description": "A technology company",
  "size": "1-10 employees",
  "position": "CEO"
}
```

**Expected response**
```json
{
  "organizationId": "org_12345",
  "name": "Acme Corp",
  "ownerId": "user_456",
  "employeeCount": 1,
  "createdAt": "2026-08-24T00:00:00Z"
}
```

**Database Generation Rules**
- Backend executes an atomic transaction:
  1. Inserts into `organizations` with `employee_count = 1`.
  2. Inserts into `organization_employees` linking creator to organization with `role = 'OWNER'` and specified `position`.
  3. Initializes `hierarchy_tree` with creator node.

**Used by**
- CreateOrganization page

## Organization Hierarchy

### GET /api/organizations/:organizationId/groups

Returns organization groups: `id`, `name`, `unreadCount`, and membership/access state. Used by `OrgSidebar` and meeting group labels.

### GET /api/organizations/:organizationId/direct-messages

Returns direct-message conversation summaries for the current member: conversation ID, person summary, last activity, unread count, and active/presence state. Used by `OrgSidebar`.

## Meetings

### GET /api/organizations/:organizationId/meetings

Returns meetings currently active for groups to which the current user belongs, including `id`, `title`, `group`, participant summaries, and join eligibility. Used by Ongoing Meetings.

### POST /api/organizations/:organizationId/meetings

Creates an organization-scoped meeting.

```json
{ "title": "Engineering Standup", "groupId": "group-backend", "scheduledAt": "2026-08-12T10:00:00Z" }
```

Responds with the created meeting ID and join URL. Used by Create Meeting.

### POST /api/organizations/:organizationId/meetings/join

Joins an authorized organization meeting using `meetingId` or a meeting code. Responds with meeting ID, authorization state, and join URL. Used by Join Meeting and active-meeting cards.

### GET /api/organizations/:organizationId/meetings/upcoming

Returns accepted invitations and meetings for the user’s groups, including time, date, organizer, group, and RSVP/status. Used by Upcoming Meetings.

### GET /api/organizations/:organizationId/meetings/recent

Returns recently ended meetings with duration, organization retention decisions, recording availability, AI-summary availability, and details URL. Used by Recently Ended.

## Existing global APIs

Notification and invitation endpoints remain documented by the corresponding dashboard surfaces and will be consolidated with authenticated API client implementation work.
