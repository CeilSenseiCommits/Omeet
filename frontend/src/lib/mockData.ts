import type {
  DepartmentNode,
  DirectMessage,
  OngoingMeeting,
  OrganizationChatRoom,
  OrganizationDetails,
  OrganizationGroup,
  OrganizationMeeting,
  OrganizationSummaryItem,
  RecentlyEndedMeeting,
  UpcomingMeeting,
} from "../types/organization";

export interface Organization {
  id: string;
  name: string;
  brief?: string;
  description?: string;
  position?: string;
  department?: string;
  lastActivity: string;
  initials: string;
  accent: string;
  avatarUrl?: string;
  role?: string;
  size?: string;
  employeeCount?: number;
}

export interface ActivityItem {
  id: string;
  organization: string;
  description: string;
  timestamp: string;
  dotClass: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  initials: string;
  position: string;
  organization: string;
  location: string;
  about: string;
  skills: string[];
  organizations: string[];
}

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

export const users: UserProfile[] = [
  {
    id: "user_suryansh",
    name: "Suryansh Rao",
    username: "suryansh.rao",
    initials: "SR",
    position: "Workspace admin",
    organization: "OpenAI Research",
    location: "Bangalore",
    about: "Suryansh leads workspace administration and cross-org onboarding for research and delivery programs.",
    skills: ["Platform strategy", "Workspace ops", "Collaboration"],
    organizations: ["OpenAI Research", "Startup Team"],
  },
  {
    id: "user_suraj",
    name: "Suraj Kumar",
    username: "suraj.kumar",
    initials: "SK",
    position: "ML Platform Engineer",
    organization: "OpenAI Research",
    location: "Hyderabad",
    about: "Suraj owns ML platform readiness and research tooling integration across applied AI programs.",
    skills: ["Python", "ML Infrastructure", "Pipelines"],
    organizations: ["OpenAI Research", "University Lab"],
  },
  {
    id: "user_suresh",
    name: "Suresh Patel",
    username: "suresh.patel",
    initials: "SP",
    position: "Research Operations Lead",
    organization: "University Lab",
    location: "Ahmedabad",
    about: "Suresh coordinates research operations, secure data access, and team readiness for lab programs.",
    skills: ["Operations", "Research planning", "Governance"],
    organizations: ["University Lab"],
  },
  {
    id: "user_aman",
    name: "Aman Singh",
    username: "aman.singh",
    initials: "AS",
    position: "Backend Engineer",
    organization: "Startup Team",
    location: "Delhi",
    about: "Aman designs and ships the backend systems that power the product and collaboration surfaces.",
    skills: ["Node.js", "APIs", "Architecture"],
    organizations: ["Startup Team"],
  },
  {
    id: "user_priya",
    name: "Priya Sharma",
    username: "priya.sharma",
    initials: "PS",
    position: "ML Engineer",
    organization: "OpenAI Research",
    location: "Bangalore",
    about: "Priya leads applied ML programs and contributes to research delivery and experimentation.",
    skills: ["Applied AI", "Evaluation", "Research"],
    organizations: ["OpenAI Research"],
  },
  {
    id: "user_rahul",
    name: "Rahul Verma",
    username: "rahul.verma",
    initials: "RV",
    position: "Engineering Manager",
    organization: "Engineering",
    location: "Bangalore",
    about: "Rahul mentors engineering squads and supports the operating rhythm of cross-functional delivery.",
    skills: ["Engineering leadership", "Delivery", "Mentoring"],
    organizations: ["OpenAI Research", "Engineering"],
  },
  {
    id: "user_nina",
    name: "Nina Patel",
    username: "nina.patel",
    initials: "NP",
    position: "Product Designer",
    organization: "Product Design",
    location: "Mumbai",
    about: "Nina designs product surfaces and helps teams align on collaborative workspace patterns.",
    skills: ["Design systems", "Workflows", "Research synthesis"],
    organizations: ["Product Design"],
  },
  {
    id: "user_vikram",
    name: "Vikram Singh",
    username: "vikram.singh",
    initials: "VS",
    position: "Backend Platform Lead",
    organization: "OpenAI Research",
    location: "Pune",
    about: "Vikram owns platform services, observability, and API readiness for partner teams.",
    skills: ["Services", "Infrastructure", "APIs"],
    organizations: ["OpenAI Research"],
  },
  {
    id: "user_neha",
    name: "Neha Rao",
    username: "neha.rao",
    initials: "NR",
    position: "ML Research Scientist",
    organization: "OpenAI Research",
    location: "Chennai",
    about: "Neha runs data science and experimentation programs that feed model and product intelligence.",
    skills: ["Modeling", "Evaluation", "Statistics"],
    organizations: ["OpenAI Research"],
  },
  {
    id: "user_arjun",
    name: "Arjun Mehta",
    username: "arjun.mehta",
    initials: "AM",
    position: "DevOps Engineer",
    organization: "Engineering",
    location: "Jaipur",
    about: "Arjun keeps deployment, observability, and service reliability aligned with team operating needs.",
    skills: ["DevOps", "CI/CD", "Cloud"],
    organizations: ["Engineering"],
  },
  {
    id: "user_mina",
    name: "Mina Chen",
    username: "mina.chen",
    initials: "MC",
    position: "Research Director",
    organization: "OpenAI Research",
    location: "San Francisco",
    about: "Mina leads research programs that connect model capability with practical workspace transformation.",
    skills: ["Research strategy", "Evaluation", "Leadership"],
    organizations: ["OpenAI Research"],
  },
  {
    id: "user_disha",
    name: "Disha Kapoor",
    username: "disha.kapoor",
    initials: "DK",
    position: "NLP Scientist",
    organization: "OpenAI Research",
    location: "Mumbai",
    about: "Disha researches text intelligence patterns with a practical product and model delivery lens.",
    skills: ["NLP", "Embeddings", "Evaluation"],
    organizations: ["OpenAI Research"],
  },
  {
    id: "user_tara",
    name: "Tara Shah",
    username: "tara.shah",
    initials: "TS",
    position: "Vision Research Lead",
    organization: "OpenAI Research",
    location: "Pune",
    about: "Tara works across multimodal research and practical perception utility features.",
    skills: ["Vision", "Data analysis", "Research"],
    organizations: ["OpenAI Research"],
  },
  {
    id: "user_lina",
    name: "Lina Gomez",
    username: "lina.gomez",
    initials: "LG",
    position: "People Partner",
    organization: "Human Resources",
    location: "Bengaluru",
    about: "Lina's work connects talent programs and employee experience programs to the operating model.",
    skills: ["Employee lifecycle", "Culture", "Programs"],
    organizations: ["Human Resources"],
  },
  {
    id: "user_amina",
    name: "Amina Patel",
    username: "amina.patel",
    initials: "AP",
    position: "Executive Sponsor",
    organization: "Startup Team",
    location: "Mumbai",
    about: "Amina coordinates leadership decisions and cross-functional programs for the growth platform.",
    skills: ["Executive communication", "Roadmaps", "Operations"],
    organizations: ["Startup Team"],
  },
];

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
  {
    id: "notify-007",
    type: "ORG_INVITATION",
    title: "Invitation to join OpenAI Research",
    message: "Priya Sharma invited you as ML Engineer.",
    createdAt: "2026-08-31T10:00:00",
    direction: "incoming",
    status: "UNREAD",
    invitationId: "inv_001",
  },
];

export const organizations: Organization[] = [
  {
    id: "openai-research",
    name: "OpenAI Research",
    description: "AI research and product workspace",
    lastActivity: "12 min ago",
    initials: "OR",
    accent: "bg-fuchsia-500/20 text-fuchsia-200",
  },
  {
    id: "startup-team",
    name: "Startup Team",
    description: "A focused startup group managing product delivery and early growth experiments.",
    lastActivity: "27 min ago",
    initials: "ST",
    accent: "bg-sky-500/20 text-sky-200",
  },
  {
    id: "university-lab",
    name: "University Lab",
    description: "Academic lab exploring cutting-edge foundational perception models.",
    lastActivity: "1 hour ago",
    initials: "UL",
    accent: "bg-amber-500/20 text-amber-200",
  },
  {
    id: "product-design",
    name: "Product Design",
    description: "Design systems, user research, and collaborative workspace experience guild.",
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
    people: users
      .filter((user) => user.name.toLowerCase().includes(normalized))
      .map((user) => user.name)
      .sort((left, right) => left.localeCompare(right)),
  };
}

export function searchUsersByNamePrefix(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return users
    .filter((user) => user.name.toLowerCase().startsWith(normalized))
    .sort((left, right) => left.name.localeCompare(right.name));
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

export const organizationChatRooms: OrganizationChatRoom[] = [
  { id: "chat-general", name: "General", unreadCount: 4, active: true },
  { id: "chat-engineering", name: "Engineering", unreadCount: 2, active: false },
  { id: "chat-research", name: "Research", unreadCount: 0, active: false },
  { id: "chat-hr", name: "HR", unreadCount: 1, active: false },
];

export const directMessages: DirectMessage[] = [
  { id: "dm-priya", name: "Priya Sharma", role: "Product Lead", lastSeen: "2m ago", unreadCount: 1, active: false },
  { id: "dm-rahul", name: "Rahul Verma", role: "Engineering Manager", lastSeen: "9m ago", unreadCount: 0, active: true },
  { id: "dm-arjun", name: "Arjun Singh", role: "Research Partner", lastSeen: "12m ago", unreadCount: 3, active: false },
];

export const organizationGroups: OrganizationGroup[] = [
  { id: "group-applied-ai", name: "Applied AI", unreadCount: 3, active: false },
  { id: "group-backend", name: "Backend Team", unreadCount: 0, active: false },
  { id: "group-nlp", name: "NLP", unreadCount: 2, active: true },
];

export const ongoingOrganizationMeetings: OngoingMeeting[] = [
  { id: "ongoing-1", title: "Engineering Standup", group: "Backend Team", participants: ["Priya", "Rahul", "Neha", "Suresh"] },
  { id: "ongoing-2", title: "Applied AI Sync", group: "Applied AI", participants: ["Disha", "Mina", "Arjun", "Tara"] },
];

export const upcomingOrganizationMeetings: UpcomingMeeting[] = [
  { id: "upcoming-1", title: "Research Planning", date: "Mon, May 12", time: "10:00 AM", organizer: "Mina Chen", group: "Research", status: "Accepted" },
  { id: "upcoming-2", title: "Product Review", date: "Tue, May 13", time: "2:30 PM", organizer: "Priya Sharma", group: "Applied AI", status: "Confirmed" },
];

export const recentlyEndedMeetings: RecentlyEndedMeeting[] = [
  { id: "ended-1", title: "Sprint Review", duration: "45 min", recordingAvailable: true, aiSummaryAvailable: true },
  { id: "ended-2", title: "Onboarding Sync", duration: "30 min", recordingAvailable: false, aiSummaryAvailable: true },
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

export interface EligiblePerson {
  id: string;
  name: string;
  position: string;
}

export interface InvitationOrganization {
  id: string;
  name: string;
  industry: string;
  description: string;
  size: string;
  availablePositions: string[];
  departments: string[];
  eligibleImmediateSeniors: EligiblePerson[];
  eligibleMentors: EligiblePerson[];
  defaultContactEmail: string;
  defaultContactPhone: string;
  inviter: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  defaultDepartment?: string;
  defaultPosition?: string;
  defaultEmploymentType?: string;
  defaultJoiningDate?: string;
  defaultInvitedOn?: string;
  defaultExpiresOn?: string;
}

export const invitationOrganizations: InvitationOrganization[] = [
  {
    id: "openai-research",
    name: "OpenAI Research",
    industry: "Artificial Intelligence",
    description: "AI research and product workspace",
    size: "100-250 employees",
    availablePositions: ["ML Engineer", "Research Scientist", "Backend Platform Lead", "NLP Scientist", "Vision Research Lead"],
    departments: ["Applied AI", "Research Operations", "Core AI", "Platform Engineering"],
    eligibleImmediateSeniors: [
      { id: "emp_301", name: "Rahul Verma", position: "Senior ML Engineer" },
      { id: "user_mina", name: "Mina Chen", position: "Research Director" },
      { id: "user_suryansh", name: "Suryansh Rao", position: "Workspace admin" },
    ],
    eligibleMentors: [
      { id: "emp_302", name: "Ananya Mehta", position: "AI Research Lead" },
      { id: "user_neha", name: "Neha Rao", position: "ML Research Scientist" },
    ],
    defaultContactEmail: "hr@openai-research.com",
    defaultContactPhone: "+91 9876543210",
    inviter: {
      name: "Priya Sharma",
      role: "HR Manager",
      email: "priya@openai-research.com",
      phone: "+91 9876543210",
    },
    defaultDepartment: "Applied AI",
    defaultPosition: "ML Engineer",
    defaultEmploymentType: "Full-time",
    defaultJoiningDate: "2026-09-15",
    defaultInvitedOn: "2026-08-31",
    defaultExpiresOn: "2026-09-07",
  },
  {
    id: "startup-team",
    name: "Startup Team",
    industry: "SaaS & Productivity",
    description: "A focused startup group managing product delivery and early growth experiments.",
    size: "50-100 employees",
    availablePositions: ["Software Engineer", "Product Designer", "Backend Engineer"],
    departments: ["Engineering", "Product Design", "Growth Operations"],
    eligibleImmediateSeniors: [
      { id: "user_amina", name: "Amina Patel", position: "Executive Sponsor" },
      { id: "user_suryansh", name: "Suryansh Rao", position: "Workspace admin" },
    ],
    eligibleMentors: [
      { id: "user_aman", name: "Aman Singh", position: "Backend Engineer" },
    ],
    defaultContactEmail: "careers@startupteam.example.com",
    defaultContactPhone: "+1 (555) 010-0002",
    inviter: {
      name: "Amina Patel",
      role: "Founder & CEO",
      email: "amina@startupteam.example.com",
      phone: "+1 (555) 010-0002",
    },
    defaultDepartment: "Engineering",
    defaultPosition: "Software Engineer",
    defaultEmploymentType: "Full-time",
    defaultJoiningDate: "2026-10-01",
    defaultInvitedOn: "2026-08-31",
    defaultExpiresOn: "2026-09-14",
  }
];

export async function sendInvitation(payload: any): Promise<{ success: boolean; message: string }> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Basic validation mock
  if (!payload.organizationId || !payload.position) {
    throw new Error("Missing required fields");
  }

  const org = invitationOrganizations.find(o => o.id === payload.organizationId);
  const inviteeUser = users.find(u => u.id === payload.inviteeUserId);
  const senior = org?.eligibleImmediateSeniors.find(s => s.id === payload.immediateSeniorId);
  const mentor = org?.eligibleMentors.find(m => m.id === payload.mentorId);

  const newInvitation: ReceiverInvitation = {
    invitationId: `inv_${Date.now()}`,
    code: `${org?.name?.split(" ")[0]?.toUpperCase() || "ORG"}-${payload.position?.split(" ")[0]?.toUpperCase() || "ROLE"}-2026`,
    organization: {
      id: org?.id || payload.organizationId,
      name: org?.name || "OpenAI Research",
      description: org?.description || "AI research and product workspace",
      industry: org?.industry || "Artificial Intelligence",
      size: org?.size || "100-250 employees",
    },
    invitee: {
      id: inviteeUser?.id || payload.inviteeUserId || "user_unknown",
      name: inviteeUser?.name || "Invited User",
      username: inviteeUser?.username || "invited.user",
    },
    inviter: payload.invitedBy || {
      id: "user_201",
      name: "Priya Sharma",
      role: "HR Manager",
      email: "priya@openai-research.com",
      phone: "+91 9876543210",
    },
    position: payload.position,
    department: payload.department || "Applied AI",
    employmentType: payload.employmentType || "Full-time",
    joiningDate: payload.joiningDate || "2026-09-15",
    directSenior: {
      id: senior?.id || "emp_301",
      name: senior?.name || "Rahul Verma",
      position: senior?.position || "Senior ML Engineer",
    },
    mentor: mentor
      ? {
          id: mentor.id,
          name: mentor.name,
          position: mentor.position,
        }
      : undefined,
    contactEmail: payload.contactEmail || "hr@openai-research.com",
    contactPhone: payload.contactPhone || "+91 9876543210",
    status: "PENDING",
    createdAt: payload.invitedOn || "2026-08-31",
    expiresAt: payload.expiresOn || "2026-09-07",
  };

  receiverInvitations.unshift(newInvitation);
  
  return { success: true, message: "Invitation sent successfully." };
}

export interface ReceiverInvitation {
  invitationId: string;
  code: string;
  organization: {
    id: string;
    name: string;
    description: string;
    industry: string;
    size: string;
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

export const receiverInvitations: ReceiverInvitation[] = [
  {
    invitationId: "inv_001",
    code: "OPENAI-ML-2026",
    organization: {
      id: "org_001",
      name: "OpenAI Research",
      description: "AI research and product workspace",
      industry: "Artificial Intelligence",
      size: "100-250"
    },
    invitee: {
      id: "user_1024",
      name: "Suryansh Rao",
      username: "suryansh"
    },
    inviter: {
      id: "user_201",
      name: "Priya Sharma",
      role: "HR Manager",
      email: "priya@openai-research.com",
      phone: "+91 9876543210"
    },
    position: "ML Engineer",
    department: "Applied AI",
    employmentType: "Full-time",
    joiningDate: "2026-09-15",
    directSenior: {
      id: "emp_301",
      name: "Rahul Verma",
      position: "Senior ML Engineer"
    },
    mentor: {
      id: "emp_302",
      name: "Ananya Mehta",
      position: "AI Research Lead"
    },
    contactEmail: "hr@openai-research.com",
    contactPhone: "+91 9876543210",
    status: "PENDING",
    createdAt: "2026-08-31",
    expiresAt: "2026-09-07"
  }
];

export async function validateInvitationCode(code: string): Promise<{ isValid: boolean; invitationId?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
  const invite = receiverInvitations.find(inv => inv.code === code);
  if (invite) {
    return { isValid: true, invitationId: invite.invitationId };
  }
  return { isValid: false };
}

export async function getInvitationById(id: string): Promise<ReceiverInvitation | undefined> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return receiverInvitations.find(inv => inv.invitationId === id);
}

export async function acceptInvitation(id: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  const invite = receiverInvitations.find(inv => inv.invitationId === id);
  if (invite) {
    invite.status = "ACCEPTED";
    return { success: true, message: "Invitation accepted successfully." };
  }
  throw new Error("Invitation not found");
}

export async function declineInvitation(id: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  const invite = receiverInvitations.find(inv => inv.invitationId === id);
  if (invite) {
    invite.status = "DECLINED";
    return { success: true, message: "Invitation declined." };
  }
  throw new Error("Invitation not found");
}

// -------------------------------------------------------------
// Database Dummy Tables: Users, Organizations, Organization Employees
// -------------------------------------------------------------

export interface DbOrganization {
  id: string;
  name: string;
  brief?: string;
  description: string;
  size: string;
  employeeCount: number;
  ownerId: string;
  initials: string;
  accent: string;
}

export interface DbOrganizationEmployee {
  id: string;
  organizationId: string;
  userId: string;
  position: string;
  department?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  employmentType: string;
  salary: number;
  managerEmployeeId?: string;
  mentorEmployeeId?: string;
  joiningDate: string;
  lastAccessedAt: string;
  status: "ACTIVE" | "INVITED" | "RESIGNED";
}

export const dbOrganizations: DbOrganization[] = [
  {
    id: "openai-research",
    name: "OpenAI Research",
    description: "AI research and product workspace",
    size: "100-250 employees",
    employeeCount: 128,
    ownerId: "user_mina",
    initials: "OR",
    accent: "bg-fuchsia-500/20 text-fuchsia-200",
  },
  {
    id: "startup-team",
    name: "Startup Team",
    description: "A focused startup group managing product delivery and early growth experiments.",
    size: "50-100 employees",
    employeeCount: 54,
    ownerId: "user_amina",
    initials: "ST",
    accent: "bg-sky-500/20 text-sky-200",
  },
  {
    id: "university-lab",
    name: "University Lab",
    description: "Academic lab exploring cutting-edge foundational perception models.",
    size: "20-50 employees",
    employeeCount: 81,
    ownerId: "user_suresh",
    initials: "UL",
    accent: "bg-amber-500/20 text-amber-200",
  },
  {
    id: "product-design",
    name: "Product Design",
    description: "Design systems, user research, and collaborative workspace experience guild.",
    size: "10-25 employees",
    employeeCount: 37,
    ownerId: "user_nina",
    initials: "PD",
    accent: "bg-emerald-500/20 text-emerald-200",
  },
];

export const dbOrganizationEmployees: DbOrganizationEmployee[] = [
  {
    id: "emp_sr_01",
    organizationId: "openai-research",
    userId: "user_suryansh",
    position: "Workspace Admin",
    department: "Applied AI",
    role: "ADMIN",
    employmentType: "Full-time",
    salary: 195000,
    managerEmployeeId: "emp_301",
    mentorEmployeeId: "emp_302",
    joiningDate: "2025-06-01",
    lastAccessedAt: "12 min ago",
    status: "ACTIVE",
  },
  {
    id: "emp_sr_02",
    organizationId: "startup-team",
    userId: "user_suryansh",
    position: "Founding Engineer",
    department: "Core Platform",
    role: "MEMBER",
    employmentType: "Part-time",
    salary: 80000,
    joiningDate: "2026-01-15",
    lastAccessedAt: "27 min ago",
    status: "ACTIVE",
  },
  {
    id: "emp_ps_01",
    organizationId: "openai-research",
    userId: "user_priya",
    position: "HR Manager",
    department: "People Operations",
    role: "ADMIN",
    employmentType: "Full-time",
    salary: 145000,
    joiningDate: "2025-03-01",
    lastAccessedAt: "1 hour ago",
    status: "ACTIVE",
  },
];

/**
 * Queries the user's active organizations from PostgreSQL backend:
 * SELECT o.*, e.position, e.department, e.last_accessed_at
 * FROM organization_employees e
 * JOIN organizations o ON o.id = e.organization_id
 * WHERE e.user_id = $userId AND e.status = 'ACTIVE'
 * ORDER BY e.last_accessed_at DESC;
 * Falls back to in-memory store if backend is unreachable.
 */
export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  // 1. Try real PostgreSQL backend
  try {
    const res = await fetch(`http://localhost:5000/api/organizations/user/${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.organizations)) {
        return data.organizations.map((org: any) => {
          const initials = org.name
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
          };
        });
      }
    }
  } catch (err) {
    console.warn("Could not query backend for user organizations, falling back to local state:", err);
  }

  // 2. Fallback to in-memory store
  await new Promise(resolve => setTimeout(resolve, 200));

  const userMemberships = dbOrganizationEmployees.filter(
    (emp) => emp.userId === userId && emp.status === "ACTIVE"
  );

  // If user hasn't joined any organization yet, returns an empty array
  if (!userMemberships.length) {
    return [];
  }

  return userMemberships
    .map((membership) => {
      const org = dbOrganizations.find((o) => o.id === membership.organizationId);
      if (!org) return null;
      return {
        id: org.id,
        name: org.name,
        brief: org.brief,
        description: org.description,
        position: membership.position,
        department: membership.department,
        lastActivity: membership.lastAccessedAt,
        initials: org.initials,
        accent: org.accent,
      };
    })
    .filter(Boolean) as Organization[];
}

/**
 * Updates the user's last_accessed_at timestamp when entering an organization
 */
export async function touchOrganizationAccess(userId: string, orgId: string): Promise<void> {
  const membership = dbOrganizationEmployees.find(
    (emp) => emp.userId === userId && emp.organizationId === orgId
  );
  if (membership) {
    membership.lastAccessedAt = "Just now";
  }
}

