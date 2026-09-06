export interface IncomingInvitation {
  id: string;
  inviteCode: string;
  organizationId: string;
  organizationName: string;
  organizationBrief?: string;
  organizationDescription?: string;
  position: string;
  department?: string;
  role: string;
  salary?: number | string | null;
  inviterName: string;
  inviterAvatarUrl?: string | null;
  managerName: string;
  managerPosition: string;
  expiresAt: string;
  createdAt: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
}

export interface OutgoingInvitation {
  id: string;
  inviteCode: string;
  organizationId: string;
  organizationName: string;
  position: string;
  department?: string;
  role: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  inviteeName: string;
  inviteeUsername: string;
  inviteeAvatarUrl?: string | null;
}

export interface MeetingInvitation {
  id: string;
  meetingId: string;
  meetingCode: string;
  title: string;
  meetingStatus: string;
  scheduledAt: string;
  startedAt?: string;
  organizationId?: string;
  organizationName: string;
  inviterName: string;
  inviterAvatarUrl?: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}
