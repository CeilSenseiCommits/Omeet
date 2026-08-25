import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Users, Folder, Sparkles } from "lucide-react";
import {
  directMessages,
  ongoingOrganizationMeetings,
  organizationChatRooms,
  organizationDetails,
  organizationGroups,
  organizationSummary,
  recentlyEndedMeetings,
  upcomingOrganizationMeetings,
} from "../../lib/mockData";
import type { OrganizationDetails } from "../../types/organization";
import CreateMeetingModal from "./CreateMeetingModal";
import JoinMeetingModal from "./JoinMeetingModal";
import MeetingsTab from "./MeetingsTab";
import OrgHeader from "./OrgHeader";
import OrgSidebar from "./OrgSidebar";
import OrgRightSidebar from "./OrgRightSidebar";

function OrgWorkspaceLayout() {
  const navigate = useNavigate();
  const { organizationId } = useParams();
  
  // State
  const [activeTab, setActiveTab] = useState("Meetings");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const organization = useMemo<OrganizationDetails | undefined>(
    () => organizationDetails.find((item) => item.id === organizationId),
    [organizationId],
  );

  if (!organization) {
    return <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-white"><div className="rounded-xl border border-zinc-800 bg-[#111113] p-8 text-center"><p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Unknown workspace</p><h1 className="mt-3 text-2xl font-semibold">This organization could not be loaded.</h1><button type="button" onClick={() => navigate("/")} className="mt-5 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-white">Return to dashboard</button></div></main>;
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
            chatRooms={organizationChatRooms} 
            directMessages={directMessages} 
            groups={organizationGroups} 
            onSelectConversation={setSelectedConversationId}
          />
        </div>

        {/* Column B: Center Content */}
        <section className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-800/60 bg-[#111113]">
          {/* Navigation Bar at the top of the center content */}
          <div className="sticky top-0 z-20 border-b border-zinc-800/60 bg-[#111113]/95 backdrop-blur-md px-8 pt-4">
            <div className="flex gap-8">
              {[
                { name: 'Meetings', icon: Calendar }, 
                { name: 'Members', icon: Users }, 
                { name: 'Files', icon: Folder }, 
                { name: 'AI', icon: Sparkles }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.name);
                      setSelectedConversationId(null);
                    }}
                    className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors ${
                      activeTab === tab.name && !selectedConversationId
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
            {selectedConversationId ? (
              <WorkspacePlaceholder 
                title={selectedConversationId} 
                description="Chat layout will be implemented in feature/org-chat-layout. Do not implement chat messages in this branch." 
              />
            ) : (
              <>
                {activeTab === "Meetings" && (
                  <MeetingsTab 
                    ongoingMeetings={ongoingOrganizationMeetings} 
                    upcomingMeetings={upcomingOrganizationMeetings} 
                    recentlyEndedMeetings={recentlyEndedMeetings} 
                    onCreateMeeting={() => setIsCreateModalOpen(true)} 
                    onJoinMeeting={() => setIsJoinModalOpen(true)} 
                  />
                )}
                {activeTab === "Members" && (
                  <WorkspacePlaceholder 
                    title="Members" 
                    description="The member roster will show organization roles, availability, and group membership here." 
                  />
                )}
                {activeTab === "Files" && (
                  <WorkspacePlaceholder 
                    title="Files" 
                    description="Organization files, approved recordings, and shared meeting assets will appear here." 
                  />
                )}
                {activeTab === "AI" && (
                  <section className="py-8"><h2 className="text-xl font-semibold text-white">Organization AI</h2><p className="mt-1 text-sm text-zinc-400">AI assistance is scoped to this organization’s approved context.</p><div className="mt-6 space-y-4">{organizationSummary.map((item) => <div key={item.id} className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5"><p className="text-sm font-medium text-white">{item.label}</p><p className="mt-2 text-sm text-zinc-400">{item.value}</p></div>)}</div></section>
                )}
              </>
            )}
          </div>
        </section>

        {/* Column C: Right Sidebar */}
        <OrgRightSidebar 
          organization={organization}
          isCollapsed={rightPanelCollapsed}
          onToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
        />
      </div>

      <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <JoinMeetingModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
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
