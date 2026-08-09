# Frontend Specification

## Product Goal

The dashboard acts as a personal workspace hub, while each organization can become a dedicated workspace experience. The system should feel like a premium collaboration surface with strong hierarchy-aware organization views, meeting flows, and AI-informed summaries.

## Current UI Scope

### Dashboard

- Header with global search
- Header notification bell and notification dropdown with Incoming and Outgoing tabs
- Left navigation rail for primary app actions
- Center content with organization carousel, meet actions, and recent activity
- Right utility rail with profile and utility actions

### Global Notification Center

- Notification bell icon is rendered in the top header beside search and profile.
- Notification dropdown is a reusable data-driven surface with Incoming and Outgoing tabs.
- Incoming examples include organization invitations, meeting invitations, and organization announcements.
- Outgoing examples include sent invitations with state metadata such as Pending, Accepted, and Expired.

### Organization Workspace

- Workspace header with back navigation and action buttons
- Tabbed navigation for hierarchy, meetings, members, files, and AI
- Hierarchy tab with an interactive recursive tree and detailed department panel
- Meeting creation modal with hierarchy-aware placeholders

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
