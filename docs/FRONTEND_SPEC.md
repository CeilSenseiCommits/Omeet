# Frontend Specification

## Organization Workspace

The organization workspace is available at `/organization/:organizationId` and is opened from an organization card on the dashboard. It composes the shared `AppLayout`, retaining the global header, search, left rail, and right utility rail.

- The workspace header provides dashboard back navigation, organization avatar, name, status, and Create Meeting / Join Meeting actions.
- Horizontal navigation contains Meetings (default), Members, Files, and AI.
- The left communication panel contains people search, a Create Group affordance, and chat-room, direct-message, and group sections. Items have mock unread counts and active styling; selecting a conversation is intentionally reserved for `feature/org-chat-layout`.
- The Meetings tab presents create/join cards, active group meetings, upcoming accepted/group meetings, and recently ended meetings. The recent section explicitly models organization-controlled recording and metadata retention.
- Members and Files currently use intentionally empty, centered states while their data-backed surfaces are deferred. AI uses the existing organization-summary mock layer.

## Architecture

- `OrgWorkspaceLayout` owns route state, selected tab, modal state, and workspace composition.
- Feature components are separated by responsibility: `OrgHeader`, `OrgTabs`, `OrgSidebar`, `MeetingsTab`, and modal components.
- `types/organization.ts` defines view models independently of React components; `lib/mockData.ts` is the temporary data source.
- The next chat-layout branch can attach conversation selection to `OrgSidebar` without changing meeting UI or the shared layout.

## UI Notes

- The organization carousel is the dashboard’s primary organization-listing surface.
- Its header exposes a Join Organization action that opens a modal-driven invite-code workflow.
- The join modal accepts a token/invite code and forwards that value into the invitation placeholder route flow via navigation state.

### Global Notification Center

- Notification bell icon is rendered in the top header beside search and profile.
- Notification dropdown is a reusable data-driven surface with Incoming and Outgoing tabs.
- Incoming examples include organization invitations, meeting invitations, and organization announcements.
- Outgoing examples include sent invitations with state metadata such as Pending, Accepted, and Expired.

### User Search and Public Profile

- Global search is now scoped to user name prefix discovery for people records.
- Search results are lexicographically sorted so Suraj Kumar, Suresh Patel, and Suryansh Rao appear in the expected order when typing Sur.
- A profile record can be opened through the dynamic profile route /profile/:userId.
- The public profile page is a public-read page that presents name, username, organization, location, role, about copy, skills, and organization exposure.

### Organization Workspace

- Workspace header with back navigation and action buttons
- Tabbed navigation for hierarchy, meetings, members, files, and AI
- Hierarchy tab with an interactive recursive tree and detailed department panel
- Meeting creation modal with hierarchy-aware placeholders

### Invitation Creation

- This section handles the **Sender side** of the invitation process. (Note: The receiver-side "Invitation Details / Accept Invitation" flow is a separate future implementation).
- A user can be invited to an organization by navigating to their public profile (`/profile/:userId`) and clicking "Invite to Organization".
- The route `/invitation/:userId` hosts the invitation form.
- **Invitee Card:** Displays the selected user's details (Avatar, Name, Username, ID) in a read-only format.
- **Organization Information:** Select organization with dynamic display of Company Name, Industry, Description, and Company Size (e.g. OpenAI Research, Artificial Intelligence, 100-250 employees).
- **Offered Role:** Configurable Position (ML Engineer), Department (Applied AI), Employment Type (Full-time), and Expected Joining Date (2026-09-15).
- **Reporting Structure:** Select and display cards for Direct Senior (e.g., Rahul Verma - RA badge, Senior ML Engineer) and Mentor (e.g., Ananya Mehta - AN badge, AI Research Lead).
- **Invited By:** Shows inviter profile (Name: Priya Sharma, Role: HR Manager, Email: priya@openai-research.com, Phone: +91 9876543210).
- **Invitation Details:** Configurable Invited On (2026-08-31) and Expires On (2026-09-07) timestamps.
- **Organization Contact:** Pre-fills contact email (hr@openai-research.com) and phone (+91 9876543210).
- **Validation:** Ensures required fields (Organization, Position, Contact Email) are filled before sending.
- **Mock Submission:** Clicking "Send Invitation" triggers a mock service that mimics network latency, persists to receiver mock storage, displays a success message, and redirects the user back to the profile page.
- **Cancel Behavior:** Discards the form and routes back to the profile page without submitting.

## Receiver-Side Invitation / Join Organization Flow

- **Purpose**: Allows a user to view the details of an organization invitation and accept or decline it.
- **Entry Points**:
  1. **Unique Code**: The user clicks "Join Organization" on the dashboard, enters an invitation code in the Join Modal, which validates the code and navigates to the preview page.
  2. **Notification Preview**: The user receives a global notification of type `ORG_INVITATION` and clicks the "Preview Invitation" action button.
- **Routes**:
  - Join by code is handled in the `JoinOrganizationModal` component overlaying the dashboard.
  - The preview page is located at `/invitation-preview/:invitationId`.
- **Invitation Preview Page**:
  - Displays comprehensive invitation details: Organization Info, Offered Role, Reporting Structure, Inviter Information, Invitation Metadata (dates and status), and Contact Information.
- **Actions**:
  - Accept and Decline buttons trigger mock service requests simulating a backend call, and update the local status to `ACCEPTED` or `DECLINED` respectively.
  - The frontend relies on opaque tokens and must not generate, decode, or blindly trust mock data representing the invitation.
- **Future Integration**: The client anticipates real backend validation of codes, token verification, and backend persistence for organization membership records.

## Architectural Principles

- Separate presentational components from data and routing concerns.
- Keep reusable UI primitives modular for future expansion.
- Model future backend contracts with typed placeholder interfaces and mock data.
- Favor composition over deeply nested conditional rendering.

## Layout Notes

- Desktop-first layout with wide center column and fixed side rails.
- Use dark surfaces and generous spacing for a SaaS-style product feel.
- Keep hover states and transitions subtle and consistent.
- Notification surfaces are small, contextual, and anchored to global header behavior rather than consuming full-page layout.
- The notification dropdown is explicit about its two backend-facing domains: incoming user-facing flows and outgoing organizational actions.

- **Purpose**: Allows a user to create a new organization/workspace.
- **Route**: `/create-organization`
- **UI Sections**:
  - Organization Information (Name, Description, Size)
  - Creator Information (Current Authenticated User Profile, Position)
- **Form Fields**: Organization Name (required), Position (required). Description and Size are optional.
- **Removed Fields**: "Industry / Organization Type" and "Department / Team" have been removed as per the data model simplification.
- **Validation**: Frontend validates required fields before submission.
- **Creator/Owner Behavior**: The creator is automatically registered in `organizations` (with `employee_count = 1`) and in `organization_employees` as the `OWNER` (Employee #1).
- **Navigation Behavior**: On success, redirects the user to the newly created organization's workspace (`/organization/:id`).
- **Data Persistence**: Inserts new records into both `dbOrganizations` and `dbOrganizationEmployees`, making the organization immediately appear on the Home Page dashboard.

- The experience is desktop-first and uses the existing dark SaaS visual language.
- Organization-scoped meetings keep meeting context limited to the organization and its groups.
- Create and join actions are functional mock modals; persistence and meeting-room navigation await backend wiring.

## Authentication & Route Guard

- **Purpose**: Restricts access to all internal application pages unless the user is authenticated.
- **Route**: `/login`
- **Mechanism**:
  - `AuthProvider` wraps the application root and persists session data in `localStorage`.
  - `ProtectedRoute` acts as an authentication guard wrapping all protected routes (`/`, `/create-organization`, `/organization/:id`, `/profile/:id`, `/invitation/:id`, `/invitation-preview/:id`).
  - If unauthenticated, navigating to any protected route immediately redirects the user to `/login`, preserving the intended destination in `location.state.from`.
  - **Login Flow**:
    - Focuses on Google OAuth single sign-on with a prominent "Continue with Google" action.
    - Includes quick demo account selectors (e.g. Suryansh Rao, Priya Sharma) and custom Google account input.
    - Upon signing in, the user is redirected to the home page (`/`) or their intended destination.
    - `TopHeader` displays the authenticated user's name, email, avatar, and provides a "Sign Out" action in the profile menu.
