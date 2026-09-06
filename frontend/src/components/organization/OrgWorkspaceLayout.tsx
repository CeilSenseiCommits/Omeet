import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Users, Folder, Sparkles, Loader2, ShieldCheck, UserCheck, Mail, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type {
  DirectMessage,
  OngoingMeeting,
  OrganizationChatRoom,
  OrganizationDetails,
  OrganizationGroup,
  RecentlyEndedMeeting,
  UpcomingMeeting,
} from "../../types/organization";
import CreateMeetingModal from "./CreateMeetingModal";
import JoinMeetingModal from "./JoinMeetingModal";
import CreateGroupModal from "./CreateGroupModal";
import OrgEmployeeProfileModal from "./OrgEmployeeProfileModal";
import OrgInvitationsTab from "./OrgInvitationsTab";
import OrgChatView from "./chat/OrgChatView";
import MeetingsTab from "./MeetingsTab";
import OrgHeader from "./OrgHeader";
import OrgSidebar from "./OrgSidebar";
import OrgRightSidebar from "./OrgRightSidebar";

function OrgWorkspaceLayout() {
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState("Meetings");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<any | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Live Data State
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [userMembership, setUserMembership] = useState<any | null>(null);
  const [chatRooms, setChatRooms] = useState<OrganizationChatRoom[]>([]);
  const [directMessagesList, setDirectMessagesList] = useState<DirectMessage[]>([]);
  const [groupsList, setGroupsList] = useState<OrganizationGroup[]>([]);
  const [ongoingMeetingsList, setOngoingMeetingsList] = useState<OngoingMeeting[]>([]);
  const [upcomingMeetingsList, setUpcomingMeetingsList] = useState<UpcomingMeeting[]>([]);
  const [recentlyEndedMeetingsList, setRecentlyEndedMeetingsList] = useState<RecentlyEndedMeeting[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchWorkspaceData = useCallback(async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      setLoadError(null);

      // 1. Fetch organization details
      const orgRes = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}?userId=${user?.id || ""}`,
        {
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );

      if (!orgRes.ok) {
        throw new Error("Organization not found or you do not have permission to view it.");
      }

      const orgData = await orgRes.json();
      setOrganization(orgData.organization);
      setUserMembership(orgData.userMembership || null);

      // 2. Fetch conversations (channels, groups, DMs)
      const convRes = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/conversations?userId=${user?.id || ""}`,
        {
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );
      if (convRes.ok) {
        const convData = await convRes.json();
        setChatRooms(convData.chatRooms || []);
        setGroupsList(convData.groups || []);
        setDirectMessagesList(convData.directMessages || []);
      }

      // 3. Fetch meetings
      const meetRes = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/meetings`,
        {
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );
      if (meetRes.ok) {
        const meetData = await meetRes.json();
        setOngoingMeetingsList(meetData.ongoingMeetings || []);
        setUpcomingMeetingsList(meetData.upcomingMeetings || []);
        setRecentlyEndedMeetingsList(meetData.recentlyEndedMeetings || []);
      }

      // 4. Fetch members
      const membersRes = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/members`
      );
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembersList(membersData.members || []);
      }
    } catch (err: any) {
      console.error("Failed to load organization workspace:", err);
      setLoadError(err.message || "Unable to load organization workspace.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, user?.id]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const handleStartDirectMessage = async (colleague: any) => {
    if (!user?.id || !organization?.id) return;
    try {
      const targetId = colleague.userId || colleague.id;
      const res = await fetch(`http://localhost:5000/api/organizations/${organization.id}/conversations/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          userId: user.id,
          targetUserId: targetId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConversationId(data.conversation?.id || data.conversationId);
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error("Failed to start direct conversation:", err);
    }
  };

  const canViewInvitations = userMembership?.hasPermission || userMembership?.isOwner;

  const centerTabs = useMemo(() => [
    { name: 'Meetings', icon: Calendar }, 
    { name: 'Members', icon: Users }, 
    ...(canViewInvitations ? [{ name: 'Invitations', icon: Mail }] : []),
    { name: 'Files', icon: Folder }, 
    { name: 'AI', icon: Sparkles }
  ], [canViewInvitations]);

  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return membersList;
    const q = memberSearchQuery.toLowerCase();
    return membersList.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.managerName?.toLowerCase().includes(q)
    );
  }, [membersList, memberSearchQuery]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
          <p className="text-sm font-medium tracking-wider text-zinc-400">Loading workspace...</p>
        </div>
      </main>
    );
  }

  if (loadError || !organization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-white">
        <div className="rounded-2xl border border-zinc-800 bg-[#111113] p-8 text-center max-w-md shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-rose-400">Workspace Unavailable</p>
          <h1 className="mt-3 text-xl font-semibold">{loadError || "This organization could not be loaded."}</h1>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 text-sm font-medium text-white transition"
          >
            Return to dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col bg-[#09090b] text-zinc-100 overflow-hidden p-4 gap-4">
      {/* 1. Global Workspace Header (Floating Blocks) */}
      <OrgHeader 
        organization={organization}
        onBack={() => navigate("/")}
        onCreateMeeting={() => setIsCreateModalOpen(true)}
        onJoinMeeting={() => setIsJoinModalOpen(true)}
        onToggleRightPanel={() => setRightPanelCollapsed(!rightPanelCollapsed)}
        rightPanelCollapsed={rightPanelCollapsed}
      />

      {/* 2. Main 3-Column Area */}
      <div className="flex min-h-0 flex-1 gap-4">
        
        {/* Column A: Left Sidebar */}
        <div className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-800/60 bg-[#111113]">
          <OrgSidebar 
            chatRooms={chatRooms} 
            directMessages={directMessagesList} 
            groups={groupsList} 
            allMembers={membersList}
            selectedConversationId={selectedConversationId}
            onSelectConversation={(id) => setSelectedConversationId((prev) => (prev === id ? null : id))}
            onOpenCreateGroup={() => setIsCreateGroupModalOpen(true)}
            onSelectColleague={handleStartDirectMessage}
          />
        </div>

        {/* When a conversation is selected, OrgChatView overlays Center Content + Right Sidebar */}
        {selectedConversationId ? (
          <OrgChatView 
            organizationId={organization.id}
            conversationId={selectedConversationId}
            onClose={() => setSelectedConversationId(null)}
            onViewProfile={(employee) => setSelectedEmployeeForModal(employee)}
            onStartMeeting={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <>
            {/* Column B: Center Content */}
            <section className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-800/60 bg-[#111113]">
              {/* Navigation Bar at the top of the center content */}
              <div className="sticky top-0 z-20 border-b border-zinc-800/60 bg-[#111113]/95 backdrop-blur-md px-8 pt-4">
                <div className="flex gap-8">
                  {centerTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.name}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.name);
                        }}
                        className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors ${
                          activeTab === tab.name
                            ? "border-fuchsia-500 text-white"
                            : "border-transparent text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 px-8">
                {activeTab === "Meetings" && (
                  <MeetingsTab 
                    ongoingMeetings={ongoingMeetingsList} 
                    upcomingMeetings={upcomingMeetingsList} 
                    recentlyEndedMeetings={recentlyEndedMeetingsList} 
                    onCreateMeeting={() => setIsCreateModalOpen(true)} 
                    onJoinMeeting={() => setIsJoinModalOpen(true)} 
                  />
                )}
                {activeTab === "Members" && (
                  <section className="py-6">
                    <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white">Organization Members</h2>
                        <p className="text-xs text-zinc-400">Total active team members: {membersList.length}</p>
                      </div>
                    </div>

                    {/* Member Search Bar */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search organization employees by name, title, username, or department..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-fuchsia-600 transition"
                      />
                    </div>

                    <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/40">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-zinc-800/60 bg-zinc-900/50 text-xs text-zinc-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3">Member</th>
                            <th className="px-5 py-3">Position</th>
                            <th className="px-5 py-3">Reporting Senior</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3 text-right">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {filteredMembers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-5 py-8 text-center text-xs text-zinc-500">
                                No members found matching "{memberSearchQuery}".
                              </td>
                            </tr>
                          ) : (
                            filteredMembers.map((m) => (
                              <tr 
                                key={m.id} 
                                onClick={() => setSelectedEmployeeForModal(m)}
                                className="hover:bg-zinc-900/60 transition cursor-pointer group"
                              >
                                <td className="px-5 py-3.5 flex items-center gap-3">
                                  <img
                                    src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2563eb&color=ffffff`}
                                    alt={m.name}
                                    className="h-8 w-8 rounded-full border border-zinc-800 object-cover group-hover:border-fuchsia-500 transition"
                                  />
                                  <div>
                                    <p className="font-medium text-white group-hover:text-fuchsia-300 transition">{m.name}</p>
                                    <p className="text-xs text-zinc-500">@{m.username}</p>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-zinc-300">
                                  <p className="font-medium text-white">{m.position || "Member"}</p>
                                  {m.department && <p className="text-xs text-zinc-500">{m.department}</p>}
                                </td>
                                <td className="px-5 py-3.5 text-zinc-400 text-xs">
                                  {m.managerName ? `Reports to ${m.managerName}` : "— (Top Level)"}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                    m.role === "OWNER"
                                      ? "bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-800/60"
                                      : m.role === "ADMIN"
                                      ? "bg-indigo-950/80 text-indigo-300 border border-indigo-800/60"
                                      : "bg-zinc-800 text-zinc-300"
                                  }`}>
                                    {m.role === "OWNER" ? <ShieldCheck className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                    {m.role}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right text-xs text-zinc-500">
                                  {m.joiningDate ? new Date(m.joiningDate).toLocaleDateString() : "Recent"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
                {activeTab === "Invitations" && canViewInvitations && (
                  <OrgInvitationsTab organizationId={organization.id} />
                )}
                {activeTab === "Files" && (
                  <WorkspacePlaceholder 
                    title="Organization Files" 
                    description="Organization files, approved recordings, and shared meeting assets will appear here." 
                  />
                )}
                {activeTab === "AI" && (
                  <section className="py-8">
                    <h2 className="text-xl font-semibold text-white">Organization AI</h2>
                    <p className="mt-1 text-sm text-zinc-400">AI assistance is scoped to this organization’s approved context.</p>
                    <div className="mt-6 space-y-4">
                      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5">
                        <p className="text-sm font-medium text-white">Workspace Overview</p>
                        <p className="mt-2 text-sm text-zinc-400">{organization.aiSummary}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5">
                        <p className="text-sm font-medium text-white">Executive Tree</p>
                        <p className="mt-2 text-sm text-zinc-400">
                          {organization.hierarchy?.manager} manages {organization.hierarchy?.members} active members in this workspace.
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </section>

            {/* Column C: Right Sidebar */}
            <OrgRightSidebar 
              organization={organization}
              isCollapsed={rightPanelCollapsed}
              onToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            />
          </>
        )}
      </div>

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        organizationId={organization.id}
        onMeetingCreated={fetchWorkspaceData}
      />
      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        organizationId={organization.id}
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        organizationId={organization.id}
        onGroupCreated={fetchWorkspaceData}
      />
      <OrgEmployeeProfileModal
        isOpen={!!selectedEmployeeForModal}
        onClose={() => setSelectedEmployeeForModal(null)}
        employee={selectedEmployeeForModal}
        onMessage={handleStartDirectMessage}
        onInviteMeeting={() => {
          setSelectedEmployeeForModal(null);
          setIsCreateModalOpen(true);
        }}
      />
    </main>
  );
}


function WorkspacePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full items-center justify-center py-20">
      <section className="flex flex-col items-center justify-center text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-2xl text-fuchsia-300">✦</div>
        <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
      </section>
    </div>
  );
}

export default OrgWorkspaceLayout;
