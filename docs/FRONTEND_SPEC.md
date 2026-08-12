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

- The experience is desktop-first and uses the existing dark SaaS visual language.
- Organization-scoped meetings keep meeting context limited to the organization and its groups.
- Create and join actions are functional mock modals; persistence and meeting-room navigation await backend wiring.
