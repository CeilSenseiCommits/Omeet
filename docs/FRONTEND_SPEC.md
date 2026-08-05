# Frontend Specification

## Product Goal

The dashboard acts as a personal workspace hub, while each organization can become a dedicated workspace experience. The system should feel like a premium collaboration surface with strong hierarchy-aware organization views, meeting flows, and AI-informed summaries.

## Current UI Scope

### Dashboard

- Header with global search
- Left navigation rail for primary app actions
- Center content with organization carousel, meet actions, and recent activity
- Right utility rail with profile and utility actions

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
