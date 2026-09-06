# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Dynamic Organization Workspace Dashboard (`/organization/:organizationId`)**:
  - Replaced static mock data lookups with live database queries by organization UUID (`GET /api/organizations/:id`).
  - Added real-time telemetry: active employee count, live meetings count, and user's role/permissions.
  - Implemented sleek loading spinner and dedicated error view with "Return to dashboard" button.
- **Unified Conversations Architecture (`conversations` & `conversation_participants`)**:
  - Provisioned database tables supporting public/private channels (`# general`, `# random`), team groups, and 1-on-1 direct messages.
  - Auto-provisions `# general` and `# random` channels upon organization creation and auto-enrolls members upon invitation acceptance.
  - Connected `OrgSidebar.tsx` to `GET /api/organizations/:id/conversations`.
- **Synchronous Organization Meetings System (`organization_meetings` & `meeting_participants`)**:
  - Provisioned database tables supporting scheduled, live, and concluded organization meetings with branded meeting codes (`OM-XXXXXX`).
  - Connected `CreateMeetingModal.tsx` to `POST /api/organizations/:id/meetings` with instant state refresh.
  - Connected `MeetingsTab.tsx` to live ongoing, upcoming, and recently ended meetings.
- **Live Organization Member Roster & Interactive Profile**:
  - Dynamic employee table showing avatar, display name, `@username`, title, department, reporting manager, and role badges (`OWNER`, `ADMIN`, `MEMBER`).
  - Added live search bar filtering employees across name, handle, role, department, and direct senior.
  - Clicking any member opens `OrgEmployeeProfileModal` with contact info reveal ("See Info"), 1-on-1 direct message trigger, and meeting invitation action.
- **Organization Sidebar Reordering & Direct Message Prefix Search**:
  - Reordered sidebar sections: **Direct Messages** on top, **Groups** second (with `+` group creation action), and **Chat Rooms** third.
  - Direct messages only show actual conversations sorted by most recent activity.
  - Searching direct messages dynamically queries all organization colleagues with matching prefix.
- **Team Group Creation Modal**:
  - Added `CreateGroupModal` connected to `POST /api/organizations/:id/groups` for creating team/department channels with automated participant enrollment.
- **Permission-Gated Organization Invitations Tab & Candidate Preview**:
  - Added `Invitations` tab in workspace center navigation visible only to users with invitation permissions (`hasPermission = true` or `role = 'OWNER'/'ADMIN'`).
  - Provides metrics cards (Total, Pending, Accepted, Declined) and audit table of invitations with copyable codes (`OM-XXXXXX`) and candidate metadata (`GET /api/organizations/:id/invitations/logs`).
  - Added real-time search bar to search and filter by specific status (pending, accepted, declined/rejected, expired) alongside candidate name, position, department, and invite code.
  - Added quick status filter pills (`All`, `Pending`, `Accepted`, `Declined`, `Expired`).
  - Clicking any invitation row opens the exact invitation preview page (`/invitation-preview/:id`) as seen by the invitee, with sender authorization check and preview indicator.

- **Live Search Bar Integration**:
  - Connected `SearchBar.tsx` to live backend search (`GET /api/users/search?q=...`) querying Neon PostgreSQL.
  - Implemented 300ms debouncing and `AbortController` cancellation for rapid keystroke optimization.
  - Returns registered user identity enriched with primary organization and job title (`{name} (@{username}) • {organization} · {position}`).
  - Seamless navigation to `/profile/:userId` upon selection.
- **Dynamic Public Profile & Invitation Handshake**:
  - Created live `GET /api/users/profile/:userId` returning profile details, active organization memberships, positions, and skills.
  - Enhanced "Invite to Organization" button on `PublicProfilePage.tsx` to query caller's organizations with invitation permissions (`has_permission = true` / `role = 'OWNER'/'ADMIN'`).
  - Added interactive organization selection modal if caller belongs to multiple eligible organizations.
  - Pre-populates candidate data in `InviteToOrganization.tsx` via `?candidateId=...`, locking invitee input and eliminating mock "User not found" errors.
  - Redirects user smoothly back to `/profile/:id` upon invite dispatch or cancellation.
- **Dedicated In-App Notification Center for Invitations**:
  - Implemented dual-tab notification drawer: **Received** (`GET /api/invitations/user/:userId`) and **Sent** (`GET /api/invitations/sent/:userId`).
  - Dynamic unread count badge on `NotificationBell` tracking only `PENDING` incoming invitations.
  - Backend retains invitation history (`ACCEPTED`, `REJECTED`) so notifications remain accessible after action.
- **In-App Acceptance & Atomic Employee Creation**:
  - Inline Accept and Decline actions in `NotificationItem.tsx` without full-page navigation.
  - Removes action buttons and displays permanent status text (`✓ Accepted` / `✕ Declined`).
  - Custom cross-component event (`organization-updated`) triggers live re-rendering of `OrganizationCarousel` on the dashboard.
  - Backend transaction atomically writes `organization_employees` membership, updates `organization_invitations` status, and increments `organizations.employee_count`.
- **Quick-Share Branded Invite Codes & Account Exclusivity**:
  - Generates branded `OM-XXXXXX` invite codes with custom expiration durations.
  - Enforces account exclusivity during code redemption, ensuring only the intended recipient can accept.

### Changed
- Deprecated legacy static `/invitation/:userId` page, redirecting requests to the standardized `/organization/:orgId/invite?candidateId=:userId` route.
- Synchronized top navigation and route guards across all active pages.
- Conditionally render the "Good morning" greeting in `TopHeader.tsx` only on the home page (`/`), displaying a "Home" button on other subpages.

