import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../AppLayout";
import { organizationDetails, organizationMeetings, organizationSummary } from "../../lib/mockData";
import type { OrganizationDetails } from "../../types/organization";
import CreateMeetingModal from "./CreateMeetingModal";
import HierarchyTab from "./HierarchyTab";
import OrgHeader from "./OrgHeader";
import OrgTabs from "./OrgTabs";

function OrgWorkspaceLayout() {
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const [activeTab, setActiveTab] = useState("Hierarchy");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const organization = useMemo<OrganizationDetails | undefined>(() => {
    return organizationDetails.find((item) => item.id === organizationId);
  }, [organizationId]);

  if (!organization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Unknown workspace</p>
          <h1 className="mt-3 text-2xl font-semibold">This organization could not be loaded.</h1>
        </div>
      </main>
    );
  }

  return (
    <AppLayout
      contentClassName="min-w-0 flex-1 rounded-[32px] border border-zinc-800 bg-zinc-900/90 p-6"
      leftRail={
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Workspace</p>
            <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm font-medium text-white">{organization.name}</p>
              <p className="mt-1 text-sm text-zinc-400">{organization.memberCount} members • {organization.activeMeetings} active meetings</p>
            </div>
          </div>
        </div>
      }
      rightRail={
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Quick actions</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-700"
            >
              Create Meeting
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <OrgHeader organization={organization} onBack={() => navigate("/")} />

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
          <OrgTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "Hierarchy" ? <HierarchyTab organization={organization} /> : null}

        {activeTab === "Meetings" ? (
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Meetings</p>
            <div className="mt-4 space-y-3">
              {organizationMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{meeting.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{meeting.participants} participants • {meeting.scope}</p>
                  </div>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
                    {meeting.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "Members" ? (
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Members</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Member roster and department assignments will be wired to the backend next.</p>
          </div>
        ) : null}

        {activeTab === "Files" ? (
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Files</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Shared assets, recordings, and docs will appear here later.</p>
          </div>
        ) : null}

        {activeTab === "AI" ? (
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">AI</p>
            <div className="mt-4 space-y-3">
              {organizationSummary.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-2 text-sm text-zinc-400">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <CreateMeetingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </AppLayout>
  );
}

export default OrgWorkspaceLayout;
