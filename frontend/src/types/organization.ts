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
