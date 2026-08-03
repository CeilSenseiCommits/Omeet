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

## Proposed technology stack

- **Frontend:** React and TypeScript
- **Backend:** Node.js, TypeScript, and a REST API
- **Database:** PostgreSQL
- **Real-time events:** WebSockets
- **Caching / shared real-time state:** Redis
- **Audio/video:** WebRTC, with a media server when the product scales

These are proposals, not final decisions. See [HLD.md](./HLD.md) for the architecture and the questions we will answer before implementation.

## Project status

This repository currently contains product and architecture planning. No application code has been written yet.

## Documents

- [High-level design](./HLD.md)
- [Project brief](./docs/project-brief.md) *(to be added later from the original idea notes)*

## Getting started with Git

The local repository uses a `main` branch. When you make a meaningful change:

```bash
git status
git add README.md HLD.md
git commit -m "docs: add initial project documentation"
git push
```

`git status` shows what changed, `git add` selects changes for the next snapshot,
`git commit` creates that snapshot locally, and `git push` sends it to GitHub.

## License

No license has been chosen yet. Until one is added, others do not automatically
have permission to reuse the code.
