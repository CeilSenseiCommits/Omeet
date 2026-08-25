# Frontend Progress

## Completed

- Dashboard layout
- Header with search
- Header notification bell and dropdown shell
- Global notification center tabs and item rendering
- Organization carousel
- Join Organization CTA and join invite-code modal integration inside the carousel
- Join organization modal with invite-code input and placeholder navigation handoff
- Meet section
- Recent activity feed
- Left sidebar navigation
- Right utility sidebar
- Organization workspace route
- Organization workspace header
- Workspace tabs
- Recursive hierarchy tree
- Department details panel
- Create meeting modal
- Notifications mock data layer
- Organization invitation mock data and token validation route shape
- Invitation creation page UI (Sender side)
- Navigation from profile to invitation creation
- Dummy invitee data integration for invitations
- Dummy organization selector with dependent fields (Position, Senior)
- Mock invitation submission form and validation

## In Progress

- Backend API wiring
- Meeting room interactions
- Organization member roster
- Invitation validation
- Backend integration
- Notification API wiring

## Pending

- Authentication
- Hierarchy editing UI
- AI assistant panel
- Real-time meeting state
- Realtime invitation updates
- Video meeting UI

## Backend Pending (Invitations)

- Authentication-derived inviter logic
- Organization permissions validation
- Organization retrieval API (`GET /api/me/organizations`)
- Employee/senior lookup API
- Real invitation POST endpoint (`POST /api/organizations/:organizationId/invitations`)
- Secure token generation
- Database persistence for invitations
- Invitation notifications
- Invitation expiration handling

## Technical Debt

- Using mock data instead of real API calls
- No authentication state
- No WebSocket or realtime sync
- No persistence for meeting creation
- Invitation token validation is mock-only
- Notification item states are mock-only

## Future Work

- Replace mock data with backend services
- Add real search API integration
- Add live meeting updates
- Add AI-generated organization summaries
- Add organization notifications
- Add real invitation lifecycle and token service integration
- Replace notification lookup mocks with GET /api/notifications, /incoming, /outgoing, and POST read endpoints
