# API Contracts

All organization workspace endpoints require authenticated membership in `:organizationId`.

## Organization and communication

### GET /api/organizations/:organizationId

Returns organization identity, avatar, status, member count, active-meeting count, and description. Used by the workspace header and utility rail.

### GET /api/organizations/:organizationId/chatrooms

Returns chat rooms available to the member: `id`, `name`, `unreadCount`, and membership/access state. Used by `OrgSidebar`.

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
