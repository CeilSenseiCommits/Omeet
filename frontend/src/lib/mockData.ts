/**
 * Legacy mockData module - Re-exports canonical types from types/ directory.
 * All dummy tables (users, organizations, organization_employees, organization_invitations, recentActivity)
 * have been migrated to real PostgreSQL database tables and API endpoints.
 */

export type {
  DepartmentNode,
  OrganizationDetails,
  OrganizationChatRoom,
  DirectMessage,
  OrganizationGroup,
  OngoingMeeting,
  UpcomingMeeting,
  RecentlyEndedMeeting,
  OrganizationMeeting,
  OrganizationSummaryItem,
  Organization,
  ActivityItem,
} from "../types/organization";

export type { UserProfile } from "../types/user";

export type {
  IncomingInvitation,
  OutgoingInvitation,
  MeetingInvitation,
  ReceiverInvitation,
} from "../types/invitation";

export interface Notification {
  id: string;
  type: "Organization invitation" | "Meeting invitation" | "Organization announcement" | "Invitation sent" | "ORG_INVITATION";
  title: string;
  message: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
  status?: "Pending" | "Accepted" | "Expired" | "UNREAD";
  invitationId?: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
}
