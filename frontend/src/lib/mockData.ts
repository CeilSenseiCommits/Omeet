import type { DepartmentNode, OrganizationDetails, OrganizationMeeting, OrganizationSummaryItem } from "../types/organization";

export interface Organization {
  id: string;
  name: string;
  memberCount: number;
  activeMeetings: number;
  lastActivity: string;
  initials: string;
  accent: string;
}

export interface ActivityItem {
  id: string;
  organization: string;
  description: string;
  timestamp: string;
  dotClass: string;
}

export interface Notification {
  id: string;
  type: "Organization invitation" | "Meeting invitation" | "Organization announcement" | "Invitation sent";
  title: string;
  message: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
  status?: "Pending" | "Accepted" | "Expired";
}

export const notifications: Notification[] = [
  {
    id: "notify-001",
    type: "Organization invitation",
    title: "Organization invitation",
    message: "You have been invited to join OpenAI Research as an ML Engineer.",
    createdAt: "2 min ago",
    direction: "incoming",
  },
  {
    id: "notify-002",
    type: "Meeting invitation",
    title: "Meeting invitation",
    message: "Priya Sharma invited you to the Applied AI Weekly Review.",
    createdAt: "18 min ago",
    direction: "incoming",
  },
  {
    id: "notify-003",
    type: "Organization announcement",
    title: "Organization announcement",
    message: "New workspace access guidelines were published for Engineering.",
    createdAt: "1 hour ago",
    direction: "incoming",
  },
  {
    id: "notify-004",
    type: "Invitation sent",
    title: "Invitation sent to Suryansh Rao",
    message: "OpenAI Research invitation is pending acceptance.",
    createdAt: "5 min ago",
    direction: "outgoing",
    status: "Pending",
  },
  {
    id: "notify-005",
    type: "Invitation sent",
    title: "Invitation sent to Suraj Kumar",
    message: "Startup Team invitation was accepted by the recipient.",
    createdAt: "46 min ago",
    direction: "outgoing",
    status: "Accepted",
  },
  {
    id: "notify-006",
    type: "Invitation sent",
    title: "Invitation sent to Suresh Patel",
    message: "University Lab invitation expired before the recipient responded.",
    createdAt: "3 hours ago",
    direction: "outgoing",
    status: "Expired",
  },
];

export const organizations: Organization[] = [
  {
    id: "openai-research",
    name: "OpenAI Research",
    memberCount: 128,
    activeMeetings: 3,
    lastActivity: "12 min ago",
    initials: "OR",
    accent: "bg-fuchsia-500/20 text-fuchsia-200",
  },
  {
    id: "startup-team",
    name: "Startup Team",
    memberCount: 54,
    activeMeetings: 2,
    lastActivity: "27 min ago",
    initials: "ST",
    accent: "bg-sky-500/20 text-sky-200",
  },
  {
    id: "university-lab",
    name: "University Lab",
    memberCount: 81,
    activeMeetings: 4,
    lastActivity: "1 hour ago",
    initials: "UL",
    accent: "bg-amber-500/20 text-amber-200",
  },
  {
    id: "product-design",
    name: "Product Design",
    memberCount: 37,
    activeMeetings: 1,
    lastActivity: "3 hours ago",
    initials: "PD",
    accent: "bg-emerald-500/20 text-emerald-200",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "activity-1",
    organization: "OpenAI Research",
    description: "New member joined the research cohort",
    timestamp: "12 minutes ago",
    dotClass: "bg-fuchsia-400",
  },
  {
    id: "activity-2",
    organization: "Startup Team",
    description: "A meeting was scheduled for the investor review",
    timestamp: "34 minutes ago",
    dotClass: "bg-sky-400",
  },
  {
    id: "activity-3",
    organization: "University Lab",
    description: "A new document was uploaded to the workspace",
    timestamp: "1 hour ago",
    dotClass: "bg-amber-400",
  },
  {
    id: "activity-4",
    organization: "Product Design",
    description: "A design critique was published for review",
    timestamp: "2 hours ago",
    dotClass: "bg-emerald-400",
  },
  {
    id: "activity-5",
    organization: "OpenAI Research",
    description: "A roadmap update was shared with the team",
    timestamp: "3 hours ago",
    dotClass: "bg-fuchsia-400",
  },
];

export function searchMockData(query: string) {
  const normalized = query.toLowerCase();

  return {
    organizations: organizations
      .filter((organization) => organization.name.toLowerCase().includes(normalized))
      .map((organization) => organization.name),
    people: ["Aman Singh", "Priya Shah", "Nina Patel"].filter((person) => person.toLowerCase().includes(normalized)),
  };
}

export const organizationHierarchy: DepartmentNode = {
  id: "ceo",
  name: "CEO",
  manager: "Amina Patel",
  members: 14,
  activeMeetings: 2,
  description: "Executive oversight for the entire organization, with strategic planning and global alignment.",
  recentActivity: "Executive review completed for the upcoming launch cycle.",
  children: [
    {
      id: "engineering",
      name: "Engineering",
      manager: "Rahul Verma",
      members: 46,
      activeMeetings: 5,
      description: "Core product and platform development teams responsible for delivery and quality.",
      recentActivity: "Platform rollout finalized for the new workspace experience.",
      children: [
        {
          id: "backend",
          name: "Backend",
          manager: "Vikram Singh",
          members: 18,
          activeMeetings: 3,
          description: "APIs, services, and data infrastructure for the platform.",
          recentActivity: "Latency improvements shipped to the meeting services layer.",
        },
        {
          id: "ml",
          name: "ML",
          manager: "Neha Rao",
          members: 14,
          activeMeetings: 4,
          description: "Models, experimentation, and feature intelligence systems.",
          recentActivity: "A new insight engine was added to the team dashboard.",
        },
        {
          id: "devops",
          name: "DevOps",
          manager: "Arjun Mehta",
          members: 10,
          activeMeetings: 2,
          description: "Infrastructure reliability and delivery automation.",
          recentActivity: "Deployment guardrails and CI health checks improved.",
        },
      ],
    },
    {
      id: "research",
      name: "Research",
      manager: "Mina Chen",
      members: 24,
      activeMeetings: 3,
      description: "Research and experimentation for new products and AI experiences.",
      recentActivity: "A new synthesis report was shared with the leadership circle.",
      children: [
        {
          id: "nlp",
          name: "NLP",
          manager: "Disha Kapoor",
          members: 12,
          activeMeetings: 2,
          description: "Language models and contextual understanding systems.",
          recentActivity: "An evaluation pass improved retrieval quality.",
        },
        {
          id: "vision",
          name: "Vision",
          manager: "Tara Shah",
          members: 9,
          activeMeetings: 2,
          description: "Computer vision and multimodal research efforts.",
          recentActivity: "Annotations for the new dataset were finalized.",
        },
      ],
    },
    {
      id: "hr",
      name: "HR",
      manager: "Lina Gomez",
      members: 8,
      activeMeetings: 1,
      description: "People operations and culture support for the entire company.",
      recentActivity: "Team onboarding for the latest hires is underway.",
    },
  ],
};

export const organizationDetails: OrganizationDetails[] = [
  {
    id: "openai-research",
    name: "OpenAI Research",
    initials: "OR",
    accent: "bg-fuchsia-500/20 text-fuchsia-200",
    memberCount: 128,
    activeMeetings: 3,
    status: "Active",
    description: "A high-velocity research organization building frontier collaboration experiences.",
    hierarchy: organizationHierarchy,
    aiSummary: "The organization is trending toward faster cross-team collaboration and stronger research alignment across departments.",
  },
  {
    id: "startup-team",
    name: "Startup Team",
    initials: "ST",
    accent: "bg-sky-500/20 text-sky-200",
    memberCount: 54,
    activeMeetings: 2,
    status: "Active",
    description: "A focused startup group managing product delivery and early growth experiments.",
    hierarchy: organizationHierarchy,
    aiSummary: "Priority work is concentrated on launch readiness and investor-facing communication rituals.",
  },
];

export const organizationMeetings: OrganizationMeeting[] = [
  {
    id: "meeting-1",
    title: "Weekly Leadership Sync",
    status: "active",
    participants: 24,
    hierarchyMode: true,
    scope: "Entire Organization",
  },
  {
    id: "meeting-2",
    title: "Research Review",
    status: "upcoming",
    participants: 12,
    hierarchyMode: true,
    scope: "Research",
  },
];

export const organizationSummary: OrganizationSummaryItem[] = [
  { id: "summary-1", label: "AI summary", value: "Engineering and Research have coordinated around three active delivery waves this week." },
  { id: "summary-2", label: "Signal", value: "Manager alignment is improving after the latest weekly review session." },
  { id: "summary-3", label: "Next best action", value: "Prioritize the ML and Backend handoff before the next launch checkpoint." },
];

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
}

export const currentUser: AuthenticatedUser = {
  id: "user_456",
  name: "Suryansh Rao",
  email: "suryansh@example.com",
  initials: "SR",
};
