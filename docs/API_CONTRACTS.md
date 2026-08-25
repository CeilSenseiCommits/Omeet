# API Contracts

## Notification APIs

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

### GET /api/organizations/:organizationId

**Expected request**
- Path parameter: organizationId

**Expected response**
```json
{
  "id": "openai-research",
  "name": "OpenAI Research",
  "memberCount": 128,
  "activeMeetings": 3,
  "status": "Active",
  "description": "A high-velocity research organization"
}
```

**Used by**
- OrgHeader
- OrgWorkspaceLayout

## Organization Hierarchy

### GET /api/organizations/:organizationId/hierarchy

**Expected request**
- Path parameter: organizationId

**Expected response**
```json
{
  "id": "ceo",
  "name": "CEO",
  "manager": "Amina Patel",
  "members": 14,
  "activeMeetings": 2,
  "description": "Executive oversight",
  "children": []
}
```

**Used by**
- HierarchyTab
- OrgTree

## Department Details

### GET /api/departments/:departmentId

**Expected request**
- Path parameter: departmentId

**Expected response**
```json
{
  "id": "engineering",
  "name": "Engineering",
  "manager": "Rahul Verma",
  "members": 46,
  "activeMeetings": 5,
  "description": "Core product and platform development"
}
```

**Used by**
- DepartmentDetailsPanel

## Meetings

### GET /api/organizations/:organizationId/meetings

**Expected request**
- Path parameter: organizationId

**Expected response**
```json
{
  "meetings": [
    {
      "id": "meeting-1",
      "title": "Weekly Leadership Sync",
      "status": "active",
      "participants": 24,
      "hierarchyMode": true,
      "scope": "Entire Organization"
    }
  ]
}
```

**Used by**
- OrgWorkspaceLayout meetings tab

### POST /api/organizations/:organizationId/meetings

**Expected request**
```json
{
  "title": "Strategy sync",
  "hierarchyMode": true,
  "scope": "Entire Organization"
}
```

**Expected response**
```json
{
  "meetingId": "meeting-123",
  "status": "created"
}
```

**Used by**
- CreateMeetingModal

### POST /api/organizations/:organizationId/meetings/join

**Expected request**
```json
{
  "meetingId": "meeting-123"
}
```

**Expected response**
```json
{
  "meetingId": "meeting-123",
  "status": "joined"
}
```

**Used by**
- OrgHeader join meeting action

## AI Summary

### GET /api/organizations/:organizationId/ai-summary

**Expected request**
- Path parameter: organizationId

**Expected response**
```json
{
  "summary": [
    {
      "label": "AI summary",
      "value": "Engineering and Research have coordinated around three active delivery waves this week."
    }
  ]
}
```

**Used by**
- AI tab in OrgWorkspaceLayout
