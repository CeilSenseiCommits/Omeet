import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../AppLayout";
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
import OrgTabs from "./OrgTabs";

function OrgWorkspaceLayout() {
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const [activeTab, setActiveTab] = useState("Meetings");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");

  const organization = useMemo<OrganizationDetails | undefined>(
    () => organizationDetails.find((item) => item.id === organizationId),
    [organizationId],
  );
  const filteredMessages = directMessages.filter((message) => message.name.toLowerCase().includes(peopleSearch.toLowerCase()));

  if (!organization) {
    return <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white"><div className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-8 text-center"><p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Unknown workspace</p><h1 className="mt-3 text-2xl font-semibold">This organization could not be loaded.</h1><button type="button" onClick={() => navigate("/")} className="mt-5 rounded-2xl border border-zinc-700 px-4 py-2 text-sm text-white">Return to dashboard</button></div></main>;
  }

  return (
    <AppLayout
      contentClassName="min-w-0 flex-1 rounded-[32px] border border-zinc-800 bg-zinc-900/90 p-6"
      leftRail={<OrgSidebar searchValue={peopleSearch} onSearchChange={setPeopleSearch} chatRooms={organizationChatRooms} directMessages={filteredMessages} groups={organizationGroups} />}
      rightRail={<div className="space-y-4"><div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Organization</p><p className="mt-2 font-semibold text-white">{organization.name}</p><p className="mt-1 text-sm text-zinc-400">{organization.memberCount} members</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Workspace status</p><p className="mt-2 text-sm text-emerald-300">{organization.status} · {organization.activeMeetings} meetings live</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Privacy</p><p className="mt-2 text-sm leading-6 text-zinc-400">Meeting recordings and metadata follow this organization’s retention policy.</p></div></div>}
    >
      <div className="space-y-6">
        <OrgHeader organization={organization} onBack={() => navigate("/")} onCreateMeeting={() => setIsCreateModalOpen(true)} onJoinMeeting={() => setIsJoinModalOpen(true)} />
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-3"><OrgTabs activeTab={activeTab} onChange={setActiveTab} /></div>
        {activeTab === "Meetings" && <MeetingsTab ongoingMeetings={ongoingOrganizationMeetings} upcomingMeetings={upcomingOrganizationMeetings} recentlyEndedMeetings={recentlyEndedMeetings} onCreateMeeting={() => setIsCreateModalOpen(true)} onJoinMeeting={() => setIsJoinModalOpen(true)} />}
        {activeTab === "Members" && <WorkspacePlaceholder title="Members" description="The member roster will show organization roles, availability, and group membership here." />}
        {activeTab === "Files" && <WorkspacePlaceholder title="Files" description="Organization files, approved recordings, and shared meeting assets will appear here." />}
        {activeTab === "AI" && <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/60 p-6"><h2 className="text-lg font-semibold text-white">Organization AI</h2><p className="mt-1 text-sm text-zinc-400">AI assistance is scoped to this organization’s approved context.</p><div className="mt-5 space-y-3">{organizationSummary.map((item) => <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-sm font-medium text-white">{item.label}</p><p className="mt-2 text-sm text-zinc-400">{item.value}</p></div>)}</div></section>}
      </div>
      <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <JoinMeetingModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </AppLayout>
  );
}

function WorkspacePlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="flex min-h-[340px] flex-col items-center justify-center rounded-[32px] border border-dashed border-zinc-800 bg-zinc-950/70 p-12 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-fuchsia-500/10 text-2xl text-fuchsia-200">✦</div><h2 className="mt-5 text-2xl font-semibold text-white">{title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">{description}</p></section>;
}

export default OrgWorkspaceLayout;
