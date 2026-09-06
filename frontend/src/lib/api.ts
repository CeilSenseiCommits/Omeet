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

import type { Organization, ActivityItem } from "../types/organization";

export const API_BASE_URL = "http://localhost:5000";

/**
 * Queries the user's active organizations from PostgreSQL backend:
 * GET /api/organizations/user/:userId
 * Returns empty array if none exist or on error. Never falls back to dummy data.
 */
export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/organizations/user/${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.organizations)) {
        return data.organizations.map((org: any) => {
          const initials = (org.name || "OR")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "OR";

          return {
            id: org.id,
            name: org.name,
            brief: org.brief,
            description: org.description || org.brief || "",
            position: org.position,
            department: org.department || "Organization",
            lastActivity: org.lastAccessedAt ? new Date(org.lastAccessedAt).toLocaleDateString() : "Just now",
            initials,
            accent: "bg-indigo-500/20 text-indigo-200",
            role: org.role,
            size: org.size,
            employeeCount: org.employeeCount,
          };
        });
      }
    }
  } catch (err) {
    console.error("Error fetching organizations from database:", err);
  }
  return [];
}

/**
 * Queries recent activity from PostgreSQL backend:
 * GET /api/users/:userId/activity
 * Dynamically aggregates real activity across organization_meetings, organization_employees, and organization_invitations.
 * Returns empty array if none exist or on error.
 */
export async function fetchUserActivity(userId: string): Promise<ActivityItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/${userId}/activity`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.activities)) {
        return data.activities;
      }
    }
  } catch (err) {
    console.error("Error fetching user activity from database:", err);
  }
  return [];
}
