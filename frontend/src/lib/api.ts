/**
 * One home for endpoint paths. Components should not repeat raw strings such as
 * "/api/search" because a future path change then has one editing location.
 * This file deliberately contains placeholder contracts for the future backend.
 */
export const API = {
  profile: "/api/profile",
  search: "/api/search",
  usersSearch: "/api/users/search?name=",
  userById: "/api/users/:userId",
  organizations: "/api/organizations",
  recentActivity: "/api/activity",
  createMeeting: "/api/meet/create",
  joinMeeting: "/api/meet/join",
  notifications: "/api/notifications",
  notificationsIncoming: "/api/notifications/incoming",
  notificationsOutgoing: "/api/notifications/outgoing",
  notificationsRead: "/api/notifications/:id/read",
  invitations: "/api/invitations",
  invitationsSent: "/api/invitations/sent",
  validateInvitation: "/api/invitations/validate",
  acceptInvitation: "/api/invitations/accept",
  declineInvitation: "/api/invitations/decline",
} as const;
