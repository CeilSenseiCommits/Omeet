# Project Roadmap

## Completed

- Implement Create Organization frontend page and routing (`/create-organization`)
- Add Create Organization mock API integration and dummy current user data

## Near Term

- Connect the workspace layout to real organization data.
- Add real API services for search, organization details, and meetings.
- Introduce loading and empty states for organization and meeting views.
- Replace notification mock content with server-side GET /api/notifications and read-state endpoints.
- Replace user search mock content with GET /api/users/search?name= and GET /api/users/:userId endpoints.
- Implement the receiver-side Invitation Details and Accept/Decline flow (sender-side is complete).

## Completed — feature/org-workspace

- Organization workspace route and shared application shell integration
- Communication sidebar with organization-scoped mock content
- Default meetings workspace with create/join, ongoing, upcoming, and recently ended sections
- Organization meeting and communication API contract documentation

## Next — feature/org-chat-layout

The branch has been created from `feature/org-workspace`. It will prepare the UI layout opened by a chat room, direct message, or group selection:

- Conversation header and message area
- Message composer with attachment, emoji, and call affordances
- Right-side conversation information panel
- Thread-ready visual structure

This branch will not implement chat messages, realtime transport, persistence, or call behavior.

## Later

- Connect organization, communication, and meeting surfaces to authenticated APIs.
- Implement member roster, files, meeting room, and realtime presence.
- Add permissions, recording retention controls, AI summaries, and organization administration.
