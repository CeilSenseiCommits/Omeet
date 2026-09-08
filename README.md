# Omeet

Omeet is a hierarchical communication and meeting platform for organizations.
Unlike conventional meeting tools, Omeet uses an organization's reporting structure
to decide who can speak, who receives a broadcast, and how far a message travels.

> **Core idea:** communication follows the organizational tree.

## Why Omeet?

Large meetings can become noisy when many teams need to talk at once. Omeet is
designed to keep conversations structured: a manager can communicate with direct
reports, a selected number of levels below, or the whole organization—without
interrupting unrelated teams.

## Example

```text
CEO
├── VP Engineering
│   ├── Engineering Manager
│   │   ├── Engineer A
│   │   └── Engineer B
│   └── Design Manager
└── VP Operations
```

If the VP of Engineering broadcasts with a depth of two, recipients include the
Engineering Manager, Design Manager, Engineer A, and Engineer B—not VP Operations.

## MVP goals

- Create an organization and its reporting hierarchy.
- Invite people and assign their manager.
- Start and join meetings.
- Let moderators manage speaking permissions.
- Broadcast downward by a selected scope.
- Support real-time meeting events such as joining, leaving, muting, and raising a hand.

The first version will focus on structure and permissions. Audio/video transport,
recording, chat, and AI summaries can follow in later milestones.

## User roles

| Role | Main responsibilities |
| --- | --- |
| Organization owner | Creates the organization, controls settings, appoints top-level managers, and transfers ownership. |
| Manager | Invites and manages people in their subtree; starts and moderates meetings. |
| Employee | Joins meetings, participates when permitted, and requests to speak. |

## Communication scopes

| Scope | Recipients |
| --- | --- |
| `SELF` | The speaker only (useful for testing or private notes). |
| `DIRECT_REPORTS` | People directly managed by the speaker. |
| `DEPTH_2` | Direct reports and their direct reports. |
| `DEPTH_3` | Up to three levels below the speaker. |
| `ORG_WIDE` | Everyone in the organization. |

Future scopes may include a team-only room, upward communication, and custom groups.

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, TypeScript
- **Database:** Neon Serverless PostgreSQL (Connection pooled, SSL)
- **Authentication:** Google OAuth 2.0 (`@react-oauth/google` + `google-auth-library`)
- **Real-Time Communication (Planned):** WebSockets, WebRTC

## Project Status & Implemented Features

OMeet is actively under development with a fully functional frontend and database-backed backend:

- **Google OAuth Authentication & Profiles:** One-tap Google authentication with 1-step profile completion, live unique username validation, and dynamic avatars.
- **Organization Hierarchy & Management:** Organization creation with atomic multi-table transactions, owner role assignment, and dynamic dashboard carousel.
- **Home Multi-Workspace Suite:** 6 dedicated workspaces: Dashboard, Organizations, Meetings Hub, People (Personal 1-on-1 Chat), Groups, and Notifications.
- **Log-Based High-Throughput Chat:** Append-only commit log with monotonic sequence numbers (`seq`), reverse cursor 20-message pagination, and smooth "See More" prepend loading.
- **Meeting Participant & Invitee Separation:** Invited users are tracked strictly as pending invitees until they join; dynamic enrollment on entry; host-only initial roster; active filtering (`left_at IS NULL`).
- **Live Notifications & Ongoing Meeting Sync:** Green pulsating `● LIVE NOW` badges and direct "Join Live" CTA; synchronized polling across Home Meetings Hub and Organization Workspace.
- **Fixed Viewport Scroll Containment:** Viewport-pinned layout (`h-screen max-h-screen overflow-hidden`) with internal flexbox scroll containment preventing window overflow.
- **Live Search & Public Profiles:** Debounced search bar querying PostgreSQL users with organizational affiliation; public profile views with dynamic invitation handshake.
- **In-App Notification Center:** Dual-stream notification center (Received & Sent tabs) exclusively handling invitations with dynamic unread badges.
- **Frictionless In-App Acceptance:** Accept or decline invitations without page redirects; automatic `organization_employees` provisioning and live dashboard carousel refresh.
- **Branded Quick-Share Codes:** `OM-XXXXXX` invite codes with configurable expiration and account-exclusive redemption.

## Quickstart

### 1. Backend Setup
```bash
cd backend
npm install
npm run migrate # Initializes tables on Neon PostgreSQL
npm run dev     # Runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev     # Runs on http://localhost:5173
```

## Documentation

- [Master System Documentation](./docs/DOCUMENTATION.md)
- [Database Schema & Architecture](./docs/DATABASE_SCHEMA.md)
- [API Contracts](./docs/API_CONTRACTS.md)
- [Implementation Progress](./docs/IMPLEMENTATION_PROGRESS.md)
- [High-Level Design](./HLD.md)
- [Changelog](./docs/CHANGELOG.md)

## License

All rights reserved.

