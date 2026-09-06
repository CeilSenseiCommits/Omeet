# API Contracts

All organization workspace endpoints require authenticated membership in `:organizationId`.

### GET /api/notifications

**Expected request**
- Authenticated user context

**Expected response**
```json
{
  "notifications": [
    {
      "id": "notify-001",
      "type": "Organization invitation",
      "title": "Organization invitation",
      "message": "You have been invited to join OpenAI Research as an ML Engineer.",
      "createdAt": "2 min ago",
      "direction": "incoming"
    }
  ]
}
```

**Used by**
- NotificationBell
- NotificationDropdown

### GET /api/notifications/incoming

**Expected request**
- Authenticated user scope

**Expected response**
```json
{
  "notifications": [
    {
      "id": "notify-001",
      "type": "Organization invitation",
      "title": "Organization invitation",
      "message": "You have been invited to join OpenAI Research as an ML Engineer.",
      "createdAt": "2 min ago",
      "direction": "incoming"
    }
  ]
}
```

**Used by**
- NotificationDropdown Incoming tab

### GET /api/notifications/outgoing

**Expected request**
- Authenticated user scope

**Expected response**
```json
{
  "notifications": [
    {
      "id": "notify-004",
      "type": "Invitation sent",
      "title": "Invitation sent to Suryansh Rao",
      "message": "OpenAI Research invitation is pending acceptance.",
      "createdAt": "5 min ago",
      "direction": "outgoing",
      "status": "Pending"
    }
  ]
}
```

**Used by**
- NotificationDropdown Outgoing tab

### POST /api/notifications/:id/read

**Expected request**
```json
{
  "userId": "user_suryansh"
}
```

**Expected response**
```json
{
  "id": "notify-001",
  "isRead": true
}
```

**Used by**
- Future notification center read-state integration

### GET /api/invitations/sent

**Expected request**
- Authenticated user who is able to issue invitations

**Expected response**
```json
{
  "invitations": [
    {
      "id": "inv_004",
      "recipient": "Suryansh Rao",
      "organization": "OpenAI Research",
      "status": "Pending"
    }
  ]
}
```

**Used by**
- Outgoing notification content in the global notification surface

## Invitations (Creation)

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

### GET /api/users/search?name=

**Expected request**
- Query parameter: name

**Expected response**
```json
{
  "users": [
    {
      "id": "user_suraj",
      "name": "Suraj Kumar",
      "username": "suraj.kumar",
      "position": "ML Platform Engineer",
      "organization": "OpenAI Research"
    }
  ]
}
```

**Used by**
- SearchBar

### GET /api/users/:userId

**Expected request**
- Path parameter: userId

**Expected response**
```json
{
  "id": "user_suryansh",
  "name": "Suryansh Rao",
  "username": "suryansh.rao",
  "position": "Workspace admin",
  "organization": "OpenAI Research",
  "location": "Bangalore",
  "about": "Suryansh leads workspace administration and cross-org onboarding for research and delivery programs.",
  "skills": ["Platform strategy", "Workspace ops", "Collaboration"],
  "organizations": ["OpenAI Research", "Startup Team"]
}
```

**Used by**
- PublicProfilePage

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
