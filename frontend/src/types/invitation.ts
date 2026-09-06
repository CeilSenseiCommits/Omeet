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

export interface ReceiverInvitation {
  invitationId: string;
  code: string;
  organization: {
    id: string;
    name: string;
    description: string;
    industry?: string;
    size?: string;
  };
  invitee: {
    id: string;
    name: string;
    username: string;
  };
  inviter: {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  position: string;
  department: string;
  employmentType: string;
  joiningDate: string;
  directSenior: {
    id: string;
    name: string;
    position: string;
  };
  mentor?: {
    id: string;
    name: string;
    position: string;
  };
  teamLead?: {
    id: string;
    name: string;
    position: string;
  };
  contactEmail: string;
  contactPhone: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
}
