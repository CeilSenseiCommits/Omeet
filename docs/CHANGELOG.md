# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **3-Way Meeting Creation & Instant/Scheduled Workflows**:
  - **Direct Message Chat**: Launches meeting pre-populated with the recipient, with the ability to invite additional colleagues from the organization.
  - **Group Chat**: Launches meeting pre-populated with all group participants, with the ability to invite additional colleagues from the organization.
  - **Manual Creation ("Create Meeting" button)**: Opens meeting creation with an empty participant roster and searchable organization colleague picker.
  - **Instant vs. Scheduled Timing**: Users choose between starting an instant meeting (enters video conference immediately) or scheduling for a future date/time.
- **Access-Gated Video Conferencing Meeting Room (`/meeting/:meetingCode`)**:
  - **Organization Access Gate**: Meetings created inside an organization dashboard can ONLY be joined by verified active members of that organization. Unauthorized join attempts show a restricted access banner.
  - **Public Non-Hierarchical Meetings**: Meetings created outside an organization dashboard (e.g. from home page Meet section) are non-hierarchical and open to all authenticated participants.
  - **Rich Meeting Interface**: Responsive video grid with self preview tile, host/participant stream tiles, active speaker glow, floating control bar (mic, video, screen share, raise hand), participants drawer, and in-meeting chat.
- **Organization Header Refactoring & Org-Scoped Notification Center**:
  - Removed "Create Meeting" and "Join Meeting" buttons from the organization top bar (`OrgHeader.tsx`).
  - Added an **Organization-Scoped Notification Center** in `OrgHeader` filtering membership and meeting invites strictly to the active organization.
  - The home page notification bell retains global scope across all organizations.
- **Meeting Invitation Notifications & Upcoming Meetings Feed**:
  - Provisioned `meeting_invitations` table in PostgreSQL.
  - Creating a meeting dispatches meeting invite notifications with live status badges and direct "Join Meeting" triggers.
  - Invited users automatically see the meeting in their "Upcoming Meetings" feed.
- **Group Details, Member Management & Group Deletion**:
  - Clicking the group icon or header title in `OrgChatView` opens the interactive `GroupInfoModal`.
  - **Member Roster & Roles**: Displays group members with badges (`Owner`, `Admin`, `Member`), organization roles, and join dates.
  - **Add Members**: Group admins/owners can select and add organization colleagues not yet enrolled in the group.
  - **Remove Members**: Group admins/owners can remove members (with protection preventing removal of the group creator/owner).
  - **Delete Group**: Group admins/owners can permanently delete custom groups with confirmation dialog, cascading all participant associations and message history while protecting default channels (`# general` and `# random`).
  - **Leave Group**: Non-owner members can safely leave the group.
  - **Automated System Messages**: Dispatches contextual system activity announcements (`X added Y to the group`, `X left the group`, `X removed Y from the group`) to the timeline.
  - **API Endpoints**:
    - `GET /api/organizations/:id/conversations/:convId/details`: Returns conversation metadata, member roster with roles, caller permissions, and available candidate colleagues.
    - `POST /api/organizations/:id/conversations/:convId/participants`: Enrolls a new member and emits system audit message.
    - `DELETE /api/organizations/:id/conversations/:convId/participants/:targetUserId`: Removes member or processes self-leave.
    - `DELETE /api/organizations/:id/conversations/:convId`: Deletes group conversation and all associated records.
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
- **Group Chat & Direct Messaging Screen Overlay**:
  - Implemented `OrgChatView` spanning the Center Workspace and Right Utility Bar (`flex-1 min-w-0`), preserving the Left Sidebar.
  - Implemented toggle-to-close behavior: clicking the name of an opened conversation again in the left sidebar closes the chat screen and restores the Center Workspace (Meetings/Members/Invitations) and Right Utility Bar.
  - Close button (`✕`) in chat header and `Esc` key keyboard shortcut seamlessly dismiss the chat screen.
  - Active conversation indicator: Highlights the active conversation in `OrgSidebar` with glowing fuchsia border and background.
  - Real-time chat streaming with chronological message history, date dividers, optimistic sending, and auto-scroll to latest messages.
  - Direct Message mode: Displays recipient status, job title, department, "View Profile" shortcut, and 1-on-1 meeting trigger.
  - Group Chat mode: Displays channel/group badge, topic, participant count, and team huddle meeting trigger.
  - Provisioned `messages` table in PostgreSQL with composite index `(conversation_id, created_at ASC)` and endpoints `GET /api/organizations/:id/conversations/:convId/messages` & `POST /api/organizations/:id/conversations/:convId/messages`.

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

