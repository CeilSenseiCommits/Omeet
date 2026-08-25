# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Conditionally render the "Good morning" greeting in `TopHeader.tsx` only when the user is on the home page (`/`).
- Added a "Home" navigation button in `TopHeader.tsx` that replaces the greeting on all non-home pages (e.g., `/profile/:userId`, `/organization/:organizationId`).

### Changed
- Synchronized branch code across `feature/user-profile`, `feature/org-invitation-flow`, and `pages/invitation-page` to ensure the latest global header navigation changes are consistent across active UI branches.
