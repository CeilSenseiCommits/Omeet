/**
 * One home for endpoint paths. Components should not repeat raw strings such as
 * "/api/search" because a future path change then has one editing location.
 * This file deliberately contains placeholder contracts for the future backend.
 */
export const API = {
  profile: "/api/profile",
  search: "/api/search",
  organizations: "/api/organizations",
  recentActivity: "/api/activity",
  createMeeting: "/api/meet/create",
  joinMeeting: "/api/meet/join",
} as const;
