import { API_BASE_URL } from "../../lib/api";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Calendar, Users, Sparkles, Loader2, ShieldCheck, UserCheck, Mail, Search } from "lucide-react";
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
import UserAvatar from "../UserAvatar";

function OrgWorkspaceLayout() {
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Tab state synced with URL search params (?tab=...)
  const rawTab = searchParams.get("tab");
  const activeTab = useMemo(() => {
    if (rawTab && ["Meetings", "Members", "Invitations", "AI"].includes(rawTab)) {
      return rawTab;
    }
    return "Meetings";
  }, [rawTab]);

  const handleTabChange = (tabName: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tabName);
        return next;
      },
      { replace: true }
    );
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<any | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [meetingModalConfig, setMeetingModalConfig] = useState<{
    initialType: "DIRECT" | "GROUP" | "MANUAL";
    initialParticipants: any[];
    initialTitle?: string;
    conversationId?: string;
  }>({
    initialType: "MANUAL",
    initialParticipants: [],
  });

  const handleOpenCreateMeeting = (config?: {
    initialType?: "DIRECT" | "GROUP" | "MANUAL";
    initialParticipants?: any[];
    initialTitle?: string;
    conversationId?: string;
  }) => {
    setMeetingModalConfig({
      initialType: config?.initialType || "MANUAL",
      initialParticipants: config?.initialParticipants || [],
      initialTitle: config?.initialTitle,
      conversationId: config?.conversationId,
    });
    setIsCreateModalOpen(true);
  };

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
  const isInitialLoadRef = useRef(true);

  const fetchWorkspaceData = useCallback(async () => {
    if (!organizationId) return;

    try {
      if (isInitialLoadRef.current) {
        setIsLoading(true);
      }
      setLoadError(null);

      let res = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}/workspace`, {
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}`, {
          headers: {
            "x-user-id": user?.id || "",
          },
        });
      }

      if (!res.ok) {
        throw new Error(`Failed to load workspace data (${res.status})`);
      }

      const data = await res.json();

      setOrganization(data.organization);
      setUserMembership(data.userMembership);
      setChatRooms(data.chatRooms || []);
      setDirectMessagesList(data.directMessages || []);
      setGroupsList(data.groups || []);
      setOngoingMeetingsList(data.ongoingMeetings || []);
      setUpcomingMeetingsList(data.upcomingMeetings || []);
      setRecentlyEndedMeetingsList(data.recentlyEndedMeetings || []);
      setMembersList(data.members || []);
      isInitialLoadRef.current = false;
    } catch (err: any) {
      console.error("Failed to load workspace data:", err);
      if (isInitialLoadRef.current) {
        setLoadError(err.message || "Failed to connect to workspace database");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, user?.id]);

  useEffect(() => {
    fetchWorkspaceData();

    const handleOrgUpdate = () => {
      fetchWorkspaceData();
    };

    window.addEventListener("organization-updated", handleOrgUpdate);
    const interval = setInterval(fetchWorkspaceData, 8000);
    return () => {
      window.removeEventListener("organization-updated", handleOrgUpdate);
      clearInterval(interval);
    };
  }, [fetchWorkspaceData]);

  // Mark conversation as read both locally and in the database
  const markConversationAsRead = useCallback(
    (convId: string) => {
      if (!convId || !organizationId || !user?.id) return;

      // 1. Optimistically clear unread badge in sidebar state only if it was > 0
      setDirectMessagesList((prev) => {
        const item = prev.find((dm) => dm.id === convId);
        if (!item || item.unreadCount === 0) return prev;
        return prev.map((dm) => (dm.id === convId ? { ...dm, unreadCount: 0 } : dm));
      });
      setGroupsList((prev) => {
        const item = prev.find((g) => g.id === convId);
        if (!item || item.unreadCount === 0) return prev;
        return prev.map((g) => (g.id === convId ? { ...g, unreadCount: 0 } : g));
      });
      setChatRooms((prev) => {
        const item = prev.find((r) => r.id === convId);
        if (!item || item.unreadCount === 0) return prev;
        return prev.map((r) => (r.id === convId ? { ...r, unreadCount: 0 } : r));
      });

      // 2. Call backend endpoint to update caller's last_read_at in DB
      fetch(`${API_BASE_URL}/api/organizations/${organizationId}/conversations/${convId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ userId: user.id }),
      }).catch((err) => {
        console.warn("Failed to mark conversation as read:", err);
      });
    },
    [organizationId, user?.id]
  );

  useEffect(() => {
    if (selectedConversationId) {
      markConversationAsRead(selectedConversationId);
    }
  }, [selectedConversationId, markConversationAsRead]);

  const handleMessagesRead = useCallback(() => {
    if (selectedConversationId) {
      markConversationAsRead(selectedConversationId);
    }
  }, [selectedConversationId, markConversationAsRead]);

  // Direct message initiation
  const handleStartDirectMessage = async (colleague: any) => {
    if (!organizationId || !user?.id) return;
    try {
      const recipientUserId = colleague.userId || colleague.id;
      const res = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}/conversations/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ 
          userId: user.id,
          targetUserId: recipientUserId 
        }),
      });

      if (!res.ok) throw new Error("Could not start direct conversation.");
      const data = await res.json();
      setSelectedConversationId(data.conversationId);
      markConversationAsRead(data.conversationId);
      setSelectedEmployeeForModal(null);
      // Auto-refresh workspace to register DM in list
      fetchWorkspaceData();
    } catch (err) {
      console.error("Error creating direct message:", err);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return membersList;
    const query = memberSearchQuery.toLowerCase().trim();
    return membersList.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.position?.toLowerCase().includes(query) ||
        m.username?.toLowerCase().includes(query) ||
        m.department?.toLowerCase().includes(query)
    );
  }, [membersList, memberSearchQuery]);

  const canViewInvitations = userMembership?.role === "OWNER" || userMembership?.role === "ADMIN";

  const centerTabs = [
    { name: "Meetings", icon: Calendar },
    { name: "Members", icon: Users },
    ...(canViewInvitations ? [{ name: "Invitations", icon: Mail }] : []),
    { name: "AI", icon: Sparkles },
  ];

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EFECE4] text-[#242427]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#4963C8]" />
          <p className="text-xs text-[#7E7C77]">Connecting to workspace…</p>
        </div>
      </main>
    );
  }

  if (loadError || !organization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent p-6 text-[#1E293B]">
        <div className="max-w-md rounded-[8px] border border-[#E2E8F0] bg-white/95 backdrop-blur-md p-6 text-center space-y-3 shadow-lg">
          <p className="text-sm font-semibold text-[#EF4444]">Workspace Unavailable</p>
          <p className="text-xs text-[#64748B]">{loadError || "Organization not found."}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-[6px] bg-[#3B82F6] hover:bg-[#2563EB] px-3.5 py-1.5 text-xs font-medium text-white transition-all shadow-xs"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen max-h-screen flex-col bg-transparent p-4 lg:p-5 text-[#1E293B] space-y-3.5 overflow-hidden">
      {/* Top Header Row */}
      <OrgHeader
        organization={organization}
        onBack={() => navigate("/")}
        onToggleRightPanel={() => setRightPanelCollapsed((prev) => !prev)}
        rightPanelCollapsed={rightPanelCollapsed}
        onCreateMeeting={() => handleOpenCreateMeeting({ initialType: "MANUAL" })}
        onJoinMeeting={() => setIsJoinModalOpen(true)}
      />

      {/* Main 3-Column Responsive Workspace Area */}
      <div className="flex min-h-0 flex-1 gap-3.5 overflow-hidden">
        {/* Column A: Left Navigation Sidebar */}
        <div className="w-[280px] shrink-0 rounded-[8px] border border-[#E2E8F0] bg-white/90 backdrop-blur-sm overflow-hidden shadow-xs">
          <OrgSidebar
            chatRooms={chatRooms}
            directMessages={directMessagesList}
            groups={groupsList}
            allMembers={membersList}
            selectedConversationId={selectedConversationId}
            onSelectConversation={(id) => {
              setSelectedConversationId((prev) => {
                if (prev === id || !id) return null;
                markConversationAsRead(id);
                return id;
              });
            }}
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
            onStartMeeting={(config) => handleOpenCreateMeeting(config)}
            onMessagesRead={handleMessagesRead}
            onGroupDeleted={() => {
              setSelectedConversationId(null);
              fetchWorkspaceData();
            }}
          />
        ) : (
          <>
            {/* Column B: Center Content */}
            <section className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-[8px] border border-[#E2E8F0] bg-white/95 backdrop-blur-sm text-[#1E293B] shadow-xs">
              {/* Navigation Bar at the top of the center content */}
              <div className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md px-6 pt-3">
                <div className="flex gap-6">
                  {centerTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.name}
                        type="button"
                        onClick={() => {
                          handleTabChange(tab.name);
                        }}
                        className={`flex items-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                          activeTab === tab.name
                            ? "border-[#0D9488] text-[#0D9488]"
                            : "border-transparent text-[#64748B] hover:text-[#1E293B]"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 px-6">
                {activeTab === "Meetings" && (
                  <MeetingsTab 
                    organizationId={organization.id}
                    ongoingMeetings={ongoingMeetingsList} 
                    upcomingMeetings={upcomingMeetingsList} 
                    recentlyEndedMeetings={recentlyEndedMeetingsList} 
                    onCreateMeeting={() => handleOpenCreateMeeting({ initialType: "MANUAL" })} 
                    onJoinMeeting={() => setIsJoinModalOpen(true)} 
                  />
                )}
                {activeTab === "Members" && (
                  <section className="py-5">
                    <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-[#242427]">Organization Members</h2>
                        <p className="text-xs text-[#585754]">Total active team members: {membersList.length}</p>
                      </div>
                    </div>

                    {/* Member Search Bar */}
                    <div className="relative mb-3.5">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E7C77]" />
                      <input
                        type="text"
                        placeholder="Search organization employees by name, title, username, or department..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full rounded-[5px] border border-[#D8D4CB] bg-white pl-9 pr-3 py-1.5 text-xs text-[#242427] placeholder:text-[#A6A49F] outline-none focus:border-[#4963C8] transition-colors shadow-xs"
                      />
                    </div>

                    <div className="overflow-hidden rounded-[6px] border border-[#D8D4CB] bg-white shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-[#D8D4CB] bg-[#FAF9F6] text-[10px] text-[#7E7C77] uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="px-4 py-2.5">Member</th>
                            <th className="px-4 py-2.5">Position</th>
                            <th className="px-4 py-2.5">Reporting Senior</th>
                            <th className="px-4 py-2.5">Role</th>
                            <th className="px-4 py-2.5 text-right">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E5DD]">
                          {filteredMembers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#7E7C77]">
                                No members found matching "{memberSearchQuery}".
                              </td>
                            </tr>
                          ) : (
                            filteredMembers.map((m) => (
                              <tr 
                                key={m.id} 
                                onClick={() => setSelectedEmployeeForModal(m)}
                                className="hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
                              >
                                <td className="px-4 py-2.5 flex items-center gap-2.5">
                                  <UserAvatar name={m.name} avatarUrl={m.avatarUrl} size="sm" />
                                  <div>
                                    <p className="font-semibold text-[#242427] group-hover:text-[#4963C8] transition-colors">{m.name}</p>
                                    <p className="text-[10px] text-[#7E7C77]">@{m.username}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-[#242427]">
                                  <p className="font-medium">{m.position || "Member"}</p>
                                  {m.department && <p className="text-[10px] text-[#7E7C77]">{m.department}</p>}
                                </td>
                                <td className="px-4 py-2.5 text-[#585754] text-[11px]">
                                  {m.managerName ? `Reports to ${m.managerName}` : "— (Top Level)"}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10px] font-semibold ${
                                    m.role === "OWNER"
                                      ? "bg-[#EEF2FF] text-[#4963C8] border border-[#CBD5E1]"
                                      : m.role === "ADMIN"
                                      ? "bg-[#FAF9F6] text-[#585754] border border-[#D8D4CB]"
                                      : "bg-[#EFECE4] text-[#7E7C77]"
                                  }`}>
                                    {m.role === "OWNER" ? <ShieldCheck className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                    {m.role}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right text-[11px] text-[#7E7C77]">
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
                {activeTab === "AI" && (
                  <section className="py-6">
                    <h2 className="text-base font-bold text-[#242427]">Organization AI</h2>
                    <p className="mt-0.5 text-xs text-[#585754]">AI assistance is scoped to this organization’s approved context.</p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-4 shadow-xs">
                        <p className="text-xs font-semibold text-[#242427]">Workspace Overview</p>
                        <p className="mt-1 text-xs text-[#585754] leading-relaxed">{organization.aiSummary}</p>
                      </div>
                      <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-4 shadow-xs">
                        <p className="text-xs font-semibold text-[#242427]">Executive Structure</p>
                        <p className="mt-1 text-xs text-[#585754] leading-relaxed">
                          {organization.hierarchy?.manager} oversees {organization.hierarchy?.members} active members in this workspace.
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
        initialType={meetingModalConfig.initialType}
        initialParticipants={meetingModalConfig.initialParticipants}
        initialTitle={meetingModalConfig.initialTitle}
        conversationId={meetingModalConfig.conversationId}
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
          const emp = selectedEmployeeForModal;
          setSelectedEmployeeForModal(null);
          if (emp) {
            handleOpenCreateMeeting({
              initialType: "DIRECT",
              initialParticipants: [{
                id: emp.userId || emp.id,
                name: emp.name,
                username: emp.username,
                avatarUrl: emp.avatarUrl,
                position: emp.position,
                department: emp.department,
              }],
              initialTitle: `1:1 Meeting with ${emp.name}`,
            });
          } else {
            handleOpenCreateMeeting({ initialType: "MANUAL" });
          }
        }}
      />
    </main>
  );
}

export default OrgWorkspaceLayout;
