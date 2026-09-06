import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Menu } from "lucide-react";
import NotificationBell from "../NotificationBell";
import { useAuth } from "../../context/AuthContext";
import type { OrganizationDetails } from "../../types/organization";
import type { IncomingInvitation, OutgoingInvitation, MeetingInvitation } from "../../types/invitation";

interface OrgHeaderProps {
  organization: OrganizationDetails;
  onBack: () => void;
  onToggleRightPanel: () => void;
  rightPanelCollapsed: boolean;
  onCreateMeeting?: () => void;
  onJoinMeeting?: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function OrgHeader({
  organization,
  onBack,
  onToggleRightPanel,
  rightPanelCollapsed,
}: OrgHeaderProps) {
  const { user } = useAuth();
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<"incoming" | "meetings" | "outgoing">("incoming");
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvitation[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<OutgoingInvitation[]>([]);
  const [meetingInvites, setMeetingInvites] = useState<MeetingInvitation[]>([]);

  // Fetch only notifications belonging to THIS organization
  const fetchOrgNotifications = useCallback(async () => {
    if (!user?.id || !organization.id) return;
    try {
      // 1. Fetch user's incoming org invitations, filtered strictly to this organization
      const incRes = await fetch(`http://localhost:5000/api/invitations/user/${user.id}`);
      if (incRes.ok) {
        const data = await incRes.json();
        const filtered = (data.invitations || []).filter(
          (inv: IncomingInvitation) => inv.organizationId === organization.id
        );
        setIncomingInvites(filtered);
      }

      // 2. Fetch user's outgoing invitations, filtered strictly to this organization
      const outRes = await fetch(`http://localhost:5000/api/invitations/sent/${user.id}`);
      if (outRes.ok) {
        const data = await outRes.json();
        const filtered = (data.invitations || []).filter(
          (inv: OutgoingInvitation) => inv.organizationId === organization.id
        );
        setOutgoingInvites(filtered);
      }

      // 3. Fetch meeting invitations specifically for this organization
      const meetRes = await fetch(
        `http://localhost:5000/api/meetings/invitations/user/${user.id}?organizationId=${organization.id}`
      );
      if (meetRes.ok) {
        const data = await meetRes.json();
        setMeetingInvites(data.invitations || []);
      }
    } catch (err) {
      console.warn("Failed to load organization notifications:", err);
    }
  }, [user?.id, organization.id]);

  useEffect(() => {
    fetchOrgNotifications();
  }, [fetchOrgNotifications]);

  return (
    <header className="flex w-full items-center justify-between">
      {/* Left Block: Back Button aligned with Left Sidebar (280px) */}
      <div className="w-[280px] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center gap-2 rounded-xl border border-zinc-800/60 bg-[#111113] px-4 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Middle Block: Organization Info */}
      <div className="flex flex-1 items-center gap-4 px-4 min-w-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-950 border border-fuchsia-900 text-lg font-bold text-fuchsia-200">
          {getInitials(organization.name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-white truncate">{organization.name}</h1>
          <p className="mt-0.5 text-xs text-zinc-400 truncate">{organization.description || organization.brief || "Workspace"}</p>
        </div>
      </div>

      {/* Right Block: Org Notification Bell & Right Sidebar Toggle */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Organization-Scoped Notification Bell */}
        <NotificationBell
          incoming={incomingInvites}
          outgoing={outgoingInvites}
          meetingInvitations={meetingInvites}
          isOpen={isNotificationsOpen}
          activeTab={activeNotificationTab}
          userId={user?.id}
          onToggle={() => setNotificationsOpen((prev) => !prev)}
          onClose={() => setNotificationsOpen(false)}
          onTabChange={(tab) => setActiveNotificationTab(tab)}
          onRefresh={fetchOrgNotifications}
        />

        {/* Right Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleRightPanel}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800/60 bg-[#111113] text-zinc-400 transition hover:bg-zinc-800/50 hover:text-white"
          aria-label="Toggle right panel"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export default OrgHeader;
