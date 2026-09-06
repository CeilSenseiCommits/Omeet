# Project Roadmap

## Completed

- **Google OAuth 2.0 & User Profiles**:
  - Full Google OAuth sign-in flow and route guards (`ProtectedRoute`).
  - 1-Step profile completion modal with real-time unique handle availability check.
  - Avatar customization with Google profile photo or dynamic initials badge.
- **Organization Creation & Membership Core**:
  - Multi-step Create Organization page (`/create-organization`).
  - Atomic PostgreSQL transaction linking creator as `OWNER` in `organization_employees` and setting initial count.
  - Dynamic `OrganizationCarousel` loading user organizations from PostgreSQL.
- **Global Search & Public Profiles**:
  - Live debounced user search bar querying Neon PostgreSQL with affiliation resolution.
  - User public profile page (`/profile/:userId`) with active organizations and positions.
  - Dynamic "Invite to Organization" flow with permissions lookup, multi-org modal, and candidate pre-population.
- **Dedicated In-App Notification Center & Invitation Lifecycle**:
  - Dual-stream notification drawer (Received & Sent tabs).
  - Dynamic unread count badge tracking `PENDING` invitations.
  - In-app accept/decline without redirection, showing inline status (`✓ Accepted` / `✕ Declined`).
  - Cross-component `organization-updated` event dispatching to live-refresh carousel on Dashboard.
  - Atomic acceptance transaction inserting `organization_employees`, updating invitation status, and incrementing employee count.
  - Quick-share branded codes (`OM-XXXXXX`) with account-exclusive redemption.

## In Progress (Current Focus)

- **Organization Workspace Dynamic Backend Integration**:
  - Provision `conversations` and `conversation_participants` tables in PostgreSQL.
  - Provision `organization_meetings` table in PostgreSQL.
  - Replace static mock lookups in `OrgWorkspaceLayout.tsx` with dynamic API queries by organization UUID (`GET /api/organizations/:organizationId`).
  - Connect workspace sidebar to live channels, groups, and direct messages.

## Planned Next

- **Realtime Workspace Communication**:
  - WebSocket/SSE communication engine for real-time messaging across channels, groups, and DMs.
  - Realtime typing indicators, read receipts, and participant online presence.
- **Meetings & Audio/Video WebRTC Engine**:
  - Meeting creation and joining mapped to `organization_meetings`.
  - Hierarchical broadcast and speaking permission controls (`DIRECT_REPORTS`, `DEPTH_2`, `ORG_WIDE`).
  - Realtime meeting controls (mute, raise hand, participant list).

