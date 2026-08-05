/**
 * One home for endpoint paths. Components should not repeat raw strings such as
 * "/api/search" because a future path change then has one editing location.
 * This file deliberately contains no network call: the dashboard shell is static.
 */
export const API = {
  profile: "/api/profile",
  search: "/api/search",
  organizations: "/api/organizations",
} as const;
