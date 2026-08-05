# FRONTEND_SPEC.md

# Frontend Specification (MVP)

## Product Vision

A unified workspace where a user can belong to multiple organizations, communicate with people across organizations, start personal or organization-specific meetings, and navigate organizational hierarchies from a single interface.

Unlike traditional organization-management software, the **user is the center of the product**, not the organization. The dashboard acts as the user’s personal workspace, while every organization becomes a dedicated workspace that can be entered through an organization card.

The overall experience should feel like a combination of **Slack, Google Meet, Notion, and an organizational hierarchy platform**, with AI features integrated naturally into the workflow.

---

# Design Principles

## Workspace-first

The application should feel like a single continuous workspace rather than multiple disconnected pages.

## Minimal navigation

The user should always know where they are. Side rails remain fixed while the center content changes.

## Smooth transitions

Clicking an organization should transition into the organization workspace instead of performing a hard page reload.

## Context-aware meetings

Meetings should understand which organization they belong to and optionally use the organization hierarchy.

## AI-native

AI should assist with summaries, hierarchy understanding, search, and meeting intelligence rather than existing as a separate chatbot.

---

# Desktop Layout

## Overall Structure

+----------------------------------------------------------------------------------+
|                                  Top Header                                      |
+----------------------------------------------------------------------------------+
| Left Rail |                    Main Workspace                    | Right Rail    |
|           |                                                     |               |
|           |                                                     |               |
|           |                                                     |               |
|           |                                                     |               |
+----------------------------------------------------------------------------------+

The **left rail** contains primary navigation.

The **right rail** contains user and utility actions.

Only the **center workspace changes** between pages.

---

# Navigation Flow

Login
↓
Dashboard
↓
Click Organization Card
↓
Organization Workspace
├── Hierarchy
├── Meetings
│      ├── Create Organization Meeting
│      └── Join Organization Meeting
├── Members
├── Files
└── AI

The dashboard is the lobby.

Each organization is a room/workspace.

---

# Page 1: Authentication

## Purpose

Authenticate users before entering the workspace.

## Login Layout

+-----------------------------------------------------------+
|                       LOGO                                |
|                                                           |
|                  Welcome Back                             |
|                                                           |
|   Email                                                   |
|   [***************************]                           |
|                                                           |
|   Password                                                |
|   [***************************]                           |
|                                                           |
|   [ Login ]                                               |
|                                                           |
|   Continue with Google                                    |
|                                                           |
|   Create account                                          |
+-----------------------------------------------------------+

## Sign Up

Same layout with:

* Full Name
* Email
* Password
* Confirm Password
* Create Account

The design should be clean, centered, and minimal.

---

# Page 2: Dashboard (Home)

## Purpose

Acts as the user’s personal workspace.

The user immediately sees:

* Personalized greeting
* Organizations they belong to
* Global meeting controls
* Recent activity
* Search

## Layout

+----------------------------------------------------------------------------------+
| Avatar  Good morning, Suryansh                     [ Search organizations/people ] |
+----------------------------------------------------------------------------------+
| O |                                                                          | P |
| R |                                                                          | R |
| G |    Your Organizations                                                    | O |
|   |                                                                          | F |
| I |  [Org Card]   [Org Card]   [Org Card]   [Org Card]                        | I |
| C |                                                                          | L |
| O |                                                                          | E |
| N |--------------------------------------------------------------------------|   |
| S |                            Meet                                           | I |
|   |   [ Create Meeting ]   [ Join Meeting ]                                  | C |
|   |                                                                          | O |
|   |--------------------------------------------------------------------------| N |
|   |                        Recent Activity                                   | S |
|   |   - OpenAI Research: new member                                          |   |
|   |   - Startup Team: meeting scheduled                                      |   |
|   |   - University Lab: document updated                                     |   |
+----------------------------------------------------------------------------------+

---

## Header

### Left

* User profile photo
* Greeting
* One-line personalized message

Examples:

* Good morning, Suryansh
* Hope you have a productive day.
* You have 2 meetings today.

Later this message can be AI-generated.

### Right

Global search bar.

Search should support:

* Organizations
* People
* Meetings
* Departments (future)
* Files (future)

The search remains accessible from every page.

---

## Left Icon Rail

Purpose: Primary application navigation.

Icons:

* Home
* Organizations
* Notifications
* AI Assistant
* Settings

The rail remains fixed throughout the application.

---

## Right Utility Rail

Purpose: Personal utilities.

Icons:

* Profile
* Privacy
* Preferences
* Theme
* Account

---

## Organization Cards

### Purpose

Represent every organization the user belongs to.

These cards are displayed **horizontally** and should support horizontal scrolling.

### Card Content

* Organization logo
* Organization name
* Member count
* Active meetings
* Last activity
* Mini hierarchy preview (future)

Example:

OpenAI Research

128 members

3 active meetings

Last activity: 12 min ago

### Interaction

Clicking a card **does not navigate away from the app**.

Instead:

* Card expands
* Center workspace transitions
* User enters the organization workspace

This transition should feel similar to entering a workspace in Notion or Slack.

---

# Global Meet Section

Located directly below the organization cards.

## Create Meeting

Starts a **personal/global meeting**.

Characteristics:

* User-owned
* Can invite anyone
* Join via link or code
* Not tied to any organization

## Join Meeting

Allows joining any meeting through:

* Meeting code
* Invite link

Behaves similarly to Google Meet.

---

# Recent Activity

Displays updates across all organizations.

Examples:

* New member joined OpenAI Research
* Startup Team scheduled a meeting
* University Lab uploaded a file
* Research department created a new hierarchy node

This keeps the dashboard useful even when the user is not inside an organization.

---

# Page 3: Organization Workspace

## Purpose

Dedicated workspace for a single organization.

This is where organization-specific collaboration happens.

## Layout

+----------------------------------------------------------------------------------+
| ← Back   OpenAI Research                                 [ Start Meeting ] [ Join ] |
+----------------------------------------------------------------------------------+
| H | Hierarchy | Meetings | Members | Files | AI                                 |
| O |                                                                          | A |
| M |                                                                          | I |
| E |      Organization Workspace Content                                      |   |
|   |                                                                          |   |
| I |                                                                          |   |
| C |                                                                          |   |
| O |                                                                          |   |
| N |                                                                          |   |
| S |                                                                          |   |
+----------------------------------------------------------------------------------+

The left and right rails remain the same as the dashboard.

Only the center workspace changes.

---

## Organization Header

Displays:

* Organization name
* Logo
* Member count
* Active status
* Create Organization Meeting
* Join Organization Meeting

---

# Organization Meetings

These meetings belong to the organization.

Unlike dashboard meetings, they are **organization-scoped**.

## Create Organization Meeting

Creates a meeting visible only inside the organization.

Members do not need external invite links.

The meeting appears in:

* Organization meeting list
* Notifications
* Meeting history

## Join Organization Meeting

Displays currently active organization meetings.

Users join directly from the workspace.

---

# Hierarchy Mode (Signature Feature)

When creating an organization meeting, the host chooses whether the meeting should use the organization hierarchy.

## Meeting Creation Layout

+---------------------------------------------------------------+
| Create Organization Meeting                                   |
+---------------------------------------------------------------+
| Meeting Title                                                 |
| [_____________________________________________]               |
|                                                               |
| Hierarchy Mode                                                |
| ( ) OFF   (•) ON                                              |
|                                                               |
| If enabled, permissions and organization structure            |
| will be used during the meeting.                              |
|                                                               |
| Scope                                                         |
| (•) Entire Organization                                       |
| ( ) Engineering                                               |
| ( ) Research                                                  |
| ( ) Custom Selection                                          |
|                                                               |
|               [ Cancel ]   [ Start Meeting ]                  |
+---------------------------------------------------------------+

---

## Hierarchy Mode OFF

Meeting behaves like Google Meet.

* Everyone joins equally
* Flat participant list
* No organizational permissions
* Best for brainstorming and open discussions

---

## Hierarchy Mode ON

Meeting becomes organization-aware.

Example hierarchy:

CEO

├── Engineering

│   ├── Backend

│   └── ML

└── Research

Effects:

* Participant list grouped by department
* Attendance grouped by hierarchy
* Managers can moderate their teams
* Breakout rooms created automatically by department
* AI summaries organized by department
* Tasks assigned through reporting chains

Example participant panel:

CEO

└── Rahul

Engineering

├── Priya

├── Aman

└── Neha

Research

├── Arjun

└── Kavya

This is the primary differentiator of the product.

---

# Organization Tabs

## Hierarchy

### Purpose

Visualize the organization structure.

### Layout

+----------------------------------------------------------------------------------+
| OpenAI Research                                      [ Edit ] [ Invite ]         |
+----------------------------------------------------------------------------------+
| CEO                                                                           |
|  |                                                                            |
|  +-- Engineering                                                              |
|  |      +-- Backend                                                           |
|  |      +-- ML                                                                |
|  |                                                                            |
|  +-- Research                                                                 |
|         +-- NLP                                                               |
|         +-- Vision                                                            |
|                                                                                |
| Right Panel:                                                                  |
| - Employee details                                                            |
| - Reporting chain                                                             |
| - Contact                                                                     |
+----------------------------------------------------------------------------------+

Features:

* Expand/collapse
* Search employees
* View reporting chain
* Future drag-and-drop editing

This should be the **default landing page** inside an organization.

---

## Meetings

### Purpose

Manage all organization meetings.

### Layout

+----------------------------------------------------------------------------------+
| Meetings                                                     [ Create Meeting ] |
+----------------------------------------------------------------------------------+
| Active Meetings                                                                  |
|  - Weekly Sync                                  [ Join ]                         |
|  - Product Review                               [ Join ]                         |
|                                                                                |
| Upcoming Meetings                                                               |
|  - ML Standup        10:00 AM                                                  |
|  - Hiring Sync       3:00 PM                                                   |
|                                                                                |
| Past Meetings                                                                   |
|  - Sprint Review      AI Summary                                               |
|  - Architecture Call  Recording                                                |
+----------------------------------------------------------------------------------+

---

## Members

### Purpose

Display organization members.

Future features:

* Roles
* Departments
* Permissions
* Invite members
* Remove members

---

## Files

### Purpose

Store organization-specific files.

Future support:

* Documents
* PDFs
* Meeting recordings
* Shared assets

---

## AI

### Purpose

Organization-specific AI assistant.

Future capabilities:

* Summarize organization activity
* Explain hierarchy relationships
* Find reporting chains
* Suggest meeting attendees
* Detect communication bottlenecks
* Generate meeting summaries
* Search across organization documents

---

# Meeting Screen

## Purpose

Real-time collaboration interface.

## Layout

+----------------------------------------------------------------------------------+
| OpenAI Research | Weekly Sync                          10:42                     |
+----------------------------------------------------------------------------------+
|                                  Video Grid                                     |
|                                                                                |
|      [User]        [User]        [User]        [User]                          |
|                                                                                |
|      [User]        [User]        [User]        [User]                          |
|                                                                                |
+----------------------------------------------------------------------------------+
| Mute | Camera | Share | Chat | Participants | AI Summary | Leave               |
+----------------------------------------------------------------------------------+

If Hierarchy Mode is enabled, the participant panel displays the organizational tree instead of a flat list.

---

# Future Enhancements

## Dashboard

* AI daily summary
* Recommended organizations
* Smart meeting suggestions

## Organizations

* Department workspaces
* Channels/discussions
* Task management

## Meetings

* AI transcription
* Action item extraction
* Department-wise summaries
* Hierarchy analytics

## Search

* Semantic search
* AI-powered people lookup
* Relationship search

Example:

Who reports to Rahul?

Find ML engineers in Startup Team.

---

# Component Architecture (React)

AppLayout

├── TopHeader

├── LeftRail

├── RightRail

├── Dashboard

│   ├── GreetingSection

│   ├── OrganizationCarousel

│   │   └── OrganizationCard

│   ├── MeetSection

│   └── ActivityFeed

├── OrganizationLayout

│   ├── WorkspaceHeader

│   ├── HierarchyTree

│   ├── MeetingsPanel

│   ├── MembersPanel

│   ├── FilesPanel

│   └── AIAssistant

└── MeetingLayout

```
├── VideoGrid

├── ParticipantPanel

├── ChatPanel

└── MeetingControls
```

This document defines the complete frontend vision for the initial version of the organization workspace platform.

---

## Build log: Dashboard shell (2026-08-05)

Implemented the first desktop-only dashboard frame with React, TypeScript, Vite,
and Tailwind CSS.

- `App` is the composition root and currently renders the `Dashboard` page.
- `TopHeader` is a reusable persistent component for identity and global search.
- `Dashboard` owns the temporary left rail, center content, and right rail placeholders.
- The three workspace columns use Flexbox because their relationship is one-dimensional:
  fixed-width rails with a center region that takes the remaining width.
- API paths live in `src/lib/api.ts`, ready for future profile, search, and organization requests.
- The UI uses zinc-950 as the application background, zinc-900 for surfaces, and
  zinc-800 borders for a restrained dark SaaS visual hierarchy.

Not implemented in this milestone: routing, interactions, organization cards,
meeting controls, backend requests, or responsive mobile behavior.
# FRONTEND_SPEC.md

# Frontend Specification (MVP)

## Product Vision

A unified workspace where a user can belong to multiple organizations, communicate with people across organizations, start personal or organization-specific meetings, and navigate organizational hierarchies from a single interface.

Unlike traditional organization-management software, the **user is the center of the product**, not the organization. The dashboard acts as the user’s personal workspace, while every organization becomes a dedicated workspace that can be entered through an organization card.

The overall experience should feel like a combination of **Slack, Google Meet, Notion, and an organizational hierarchy platform**, with AI features integrated naturally into the workflow.

---

# Design Principles

## Workspace-first

The application should feel like a single continuous workspace rather than multiple disconnected pages.

## Minimal navigation

The user should always know where they are. Side rails remain fixed while the center content changes.

## Smooth transitions

Clicking an organization should transition into the organization workspace instead of performing a hard page reload.

## Context-aware meetings

Meetings should understand which organization they belong to and optionally use the organization hierarchy.

## AI-native

AI should assist with summaries, hierarchy understanding, search, and meeting intelligence rather than existing as a separate chatbot.

---

# Desktop Layout

## Overall Structure

+----------------------------------------------------------------------------------+
|                                  Top Header                                      |
+----------------------------------------------------------------------------------+
| Left Rail |                    Main Workspace                    | Right Rail    |
|           |                                                     |               |
|           |                                                     |               |
|           |                                                     |               |
|           |                                                     |               |
+----------------------------------------------------------------------------------+

The **left rail** contains primary navigation.

The **right rail** contains user and utility actions.

Only the **center workspace changes** between pages.

---

# Navigation Flow

Login
↓
Dashboard
↓
Click Organization Card
↓
Organization Workspace
├── Hierarchy
├── Meetings
│      ├── Create Organization Meeting
│      └── Join Organization Meeting
├── Members
├── Files
└── AI

The dashboard is the lobby.

Each organization is a room/workspace.

---

# Page 1: Authentication

## Purpose

Authenticate users before entering the workspace.

## Login Layout

+-----------------------------------------------------------+
|                       LOGO                                |
|                                                           |
|                  Welcome Back                             |
|                                                           |
|   Email                                                   |
|   [***************************]                           |
|                                                           |
|   Password                                                |
|   [***************************]                           |
|                                                           |
|   [ Login ]                                               |
|                                                           |
|   Continue with Google                                    |
|                                                           |
|   Create account                                          |
+-----------------------------------------------------------+

## Sign Up

Same layout with:

* Full Name
* Email
* Password
* Confirm Password
* Create Account

The design should be clean, centered, and minimal.

---

# Page 2: Dashboard (Home)

## Purpose

Acts as the user’s personal workspace.

The user immediately sees:

* Personalized greeting
* Organizations they belong to
* Global meeting controls
* Recent activity
* Search

## Layout

+----------------------------------------------------------------------------------+
| Avatar  Good morning, Suryansh                     [ Search organizations/people ] |
+----------------------------------------------------------------------------------+
| O |                                                                          | P |
| R |                                                                          | R |
| G |    Your Organizations                                                    | O |
|   |                                                                          | F |
| I |  [Org Card]   [Org Card]   [Org Card]   [Org Card]                        | I |
| C |                                                                          | L |
| O |                                                                          | E |
| N |--------------------------------------------------------------------------|   |
| S |                            Meet                                           | I |
|   |   [ Create Meeting ]   [ Join Meeting ]                                  | C |
|   |                                                                          | O |
|   |--------------------------------------------------------------------------| N |
|   |                        Recent Activity                                   | S |
|   |   - OpenAI Research: new member                                          |   |
|   |   - Startup Team: meeting scheduled                                      |   |
|   |   - University Lab: document updated                                     |   |
+----------------------------------------------------------------------------------+

---

## Header

### Left

* User profile photo
* Greeting
* One-line personalized message

Examples:

* Good morning, Suryansh
* Hope you have a productive day.
* You have 2 meetings today.

Later this message can be AI-generated.

### Right

Global search bar.

Search should support:

* Organizations
* People
* Meetings
* Departments (future)
* Files (future)

The search remains accessible from every page.

---

## Left Icon Rail

Purpose: Primary application navigation.

Icons:

* Home
* Organizations
* Notifications
* AI Assistant
* Settings

The rail remains fixed throughout the application.

---

## Right Utility Rail

Purpose: Personal utilities.

Icons:

* Profile
* Privacy
* Preferences
* Theme
* Account

---

## Organization Cards

### Purpose

Represent every organization the user belongs to.

These cards are displayed **horizontally** and should support horizontal scrolling.

### Card Content

* Organization logo
* Organization name
* Member count
* Active meetings
* Last activity
* Mini hierarchy preview (future)

Example:

OpenAI Research

128 members

3 active meetings

Last activity: 12 min ago

### Interaction

Clicking a card **does not navigate away from the app**.

Instead:

* Card expands
* Center workspace transitions
* User enters the organization workspace

This transition should feel similar to entering a workspace in Notion or Slack.

---

# Global Meet Section

Located directly below the organization cards.

## Create Meeting

Starts a **personal/global meeting**.

Characteristics:

* User-owned
* Can invite anyone
* Join via link or code
* Not tied to any organization

## Join Meeting

Allows joining any meeting through:

* Meeting code
* Invite link

Behaves similarly to Google Meet.

---

# Recent Activity

Displays updates across all organizations.

Examples:

* New member joined OpenAI Research
* Startup Team scheduled a meeting
* University Lab uploaded a file
* Research department created a new hierarchy node

This keeps the dashboard useful even when the user is not inside an organization.

---

# Page 3: Organization Workspace

## Purpose

Dedicated workspace for a single organization.

This is where organization-specific collaboration happens.

## Layout

+----------------------------------------------------------------------------------+
| ← Back   OpenAI Research                                 [ Start Meeting ] [ Join ] |
+----------------------------------------------------------------------------------+
| H | Hierarchy | Meetings | Members | Files | AI                                 |
| O |                                                                          | A |
| M |                                                                          | I |
| E |      Organization Workspace Content                                      |   |
|   |                                                                          |   |
| I |                                                                          |   |
| C |                                                                          |   |
| O |                                                                          |   |
| N |                                                                          |   |
| S |                                                                          |   |
+----------------------------------------------------------------------------------+

The left and right rails remain the same as the dashboard.

Only the center workspace changes.

---

## Organization Header

Displays:

* Organization name
* Logo
* Member count
* Active status
* Create Organization Meeting
* Join Organization Meeting

---

# Organization Meetings

These meetings belong to the organization.

Unlike dashboard meetings, they are **organization-scoped**.

## Create Organization Meeting

Creates a meeting visible only inside the organization.

Members do not need external invite links.

The meeting appears in:

* Organization meeting list
* Notifications
* Meeting history

## Join Organization Meeting

Displays currently active organization meetings.

Users join directly from the workspace.

---

# Hierarchy Mode (Signature Feature)

When creating an organization meeting, the host chooses whether the meeting should use the organization hierarchy.

## Meeting Creation Layout

+---------------------------------------------------------------+
| Create Organization Meeting                                   |
+---------------------------------------------------------------+
| Meeting Title                                                 |
| [_____________________________________________]               |
|                                                               |
| Hierarchy Mode                                                |
| ( ) OFF   (•) ON                                              |
|                                                               |
| If enabled, permissions and organization structure            |
| will be used during the meeting.                              |
|                                                               |
| Scope                                                         |
| (•) Entire Organization                                       |
| ( ) Engineering                                               |
| ( ) Research                                                  |
| ( ) Custom Selection                                          |
|                                                               |
|               [ Cancel ]   [ Start Meeting ]                  |
+---------------------------------------------------------------+

---

## Hierarchy Mode OFF

Meeting behaves like Google Meet.

* Everyone joins equally
* Flat participant list
* No organizational permissions
* Best for brainstorming and open discussions

---

## Hierarchy Mode ON

Meeting becomes organization-aware.

Example hierarchy:

CEO

├── Engineering

│   ├── Backend

│   └── ML

└── Research

Effects:

* Participant list grouped by department
* Attendance grouped by hierarchy
* Managers can moderate their teams
* Breakout rooms created automatically by department
* AI summaries organized by department
* Tasks assigned through reporting chains

Example participant panel:

CEO

└── Rahul

Engineering

├── Priya

├── Aman

└── Neha

Research

├── Arjun

└── Kavya

This is the primary differentiator of the product.

---

# Organization Tabs

## Hierarchy

### Purpose

Visualize the organization structure.

### Layout

+----------------------------------------------------------------------------------+
| OpenAI Research                                      [ Edit ] [ Invite ]         |
+----------------------------------------------------------------------------------+
| CEO                                                                           |
|  |                                                                            |
|  +-- Engineering                                                              |
|  |      +-- Backend                                                           |
|  |      +-- ML                                                                |
|  |                                                                            |
|  +-- Research                                                                 |
|         +-- NLP                                                               |
|         +-- Vision                                                            |
|                                                                                |
| Right Panel:                                                                  |
| - Employee details                                                            |
| - Reporting chain                                                             |
| - Contact                                                                     |
+----------------------------------------------------------------------------------+

Features:

* Expand/collapse
* Search employees
* View reporting chain
* Future drag-and-drop editing

This should be the **default landing page** inside an organization.

---

## Meetings

### Purpose

Manage all organization meetings.

### Layout

+----------------------------------------------------------------------------------+
| Meetings                                                     [ Create Meeting ] |
+----------------------------------------------------------------------------------+
| Active Meetings                                                                  |
|  - Weekly Sync                                  [ Join ]                         |
|  - Product Review                               [ Join ]                         |
|                                                                                |
| Upcoming Meetings                                                               |
|  - ML Standup        10:00 AM                                                  |
|  - Hiring Sync       3:00 PM                                                   |
|                                                                                |
| Past Meetings                                                                   |
|  - Sprint Review      AI Summary                                               |
|  - Architecture Call  Recording                                                |
+----------------------------------------------------------------------------------+

---

## Members

### Purpose

Display organization members.

Future features:

* Roles
* Departments
* Permissions
* Invite members
* Remove members

---

## Files

### Purpose

Store organization-specific files.

Future support:

* Documents
* PDFs
* Meeting recordings
* Shared assets

---

## AI

### Purpose

Organization-specific AI assistant.

Future capabilities:

* Summarize organization activity
* Explain hierarchy relationships
* Find reporting chains
* Suggest meeting attendees
* Detect communication bottlenecks
* Generate meeting summaries
* Search across organization documents

---

# Meeting Screen

## Purpose

Real-time collaboration interface.

## Layout

+----------------------------------------------------------------------------------+
| OpenAI Research | Weekly Sync                          10:42                     |
+----------------------------------------------------------------------------------+
|                                  Video Grid                                     |
|                                                                                |
|      [User]        [User]        [User]        [User]                          |
|                                                                                |
|      [User]        [User]        [User]        [User]                          |
|                                                                                |
+----------------------------------------------------------------------------------+
| Mute | Camera | Share | Chat | Participants | AI Summary | Leave               |
+----------------------------------------------------------------------------------+

If Hierarchy Mode is enabled, the participant panel displays the organizational tree instead of a flat list.

---

# Future Enhancements

## Dashboard

* AI daily summary
* Recommended organizations
* Smart meeting suggestions

## Organizations

* Department workspaces
* Channels/discussions
* Task management

## Meetings

* AI transcription
* Action item extraction
* Department-wise summaries
* Hierarchy analytics

## Search

* Semantic search
* AI-powered people lookup
* Relationship search

Example:

Who reports to Rahul?

Find ML engineers in Startup Team.

---

# Component Architecture (React)

AppLayout

├── TopHeader

├── LeftRail

├── RightRail

├── Dashboard

│   ├── GreetingSection

│   ├── OrganizationCarousel

│   │   └── OrganizationCard

│   ├── MeetSection

│   └── ActivityFeed

├── OrganizationLayout

│   ├── WorkspaceHeader

│   ├── HierarchyTree

│   ├── MeetingsPanel

│   ├── MembersPanel

│   ├── FilesPanel

│   └── AIAssistant

└── MeetingLayout

```
├── VideoGrid

├── ParticipantPanel

├── ChatPanel

└── MeetingControls
```

This document defines the complete frontend vision for the initial version of the organization workspace platform.
