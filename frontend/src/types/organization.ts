export interface DepartmentNode {
  id: string;
  name: string;
  manager: string;
  members: number;
  activeMeetings: number;
  description: string;
  recentActivity: string;
  children?: DepartmentNode[];
}

export interface OrganizationDetails {
  id: string;
  name: string;
  initials: string;
  accent: string;
  memberCount: number;
  activeMeetings: number;
  status: string;
  description: string;
  hierarchy: DepartmentNode;
  aiSummary: string;
}

export interface OrganizationChatRoom {
  id: string;
  name: string;
  unreadCount: number;
  active: boolean;
}

export interface DirectMessage {
  id: string;
  name: string;
  role: string;
  lastSeen: string;
  unreadCount: number;
  active: boolean;
}

export interface OrganizationGroup {
  id: string;
  name: string;
  unreadCount: number;
  active: boolean;
}

export interface OngoingMeeting {
  id: string;
  title: string;
  group: string;
  participants: string[];
}

export interface UpcomingMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  organizer: string;
  group: string;
  status: string;
}

export interface RecentlyEndedMeeting {
  id: string;
  title: string;
  duration: string;
  recordingAvailable: boolean;
  aiSummaryAvailable: boolean;
}

export interface OrganizationMeeting {
  id: string;
  title: string;
  status: "active" | "upcoming";
  participants: number;
  hierarchyMode: boolean;
  scope: string;
}

export interface OrganizationSummaryItem {
  id: string;
  label: string;
  value: string;
}
