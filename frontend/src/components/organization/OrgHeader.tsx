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
    <header className="flex w-full items-center justify-between text-[#1E293B]">
      {/* Left Block: Back Button aligned with Left Sidebar (280px) */}
      <div className="w-[280px] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E2E8F0] bg-white/90 px-3 text-xs font-medium text-[#1E293B] transition hover:bg-[#F8FAFC] shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#64748B]" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Middle Block: Organization Info */}
      <div className="flex flex-1 items-center gap-3 px-4 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#E2E8F0] bg-gradient-to-br from-[#F0FDFA] to-[#EFF6FF] text-xs font-bold text-[#0D9488] shadow-2xs">
          {getInitials(organization.name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-[#1E293B] truncate">{organization.name}</h1>
          <p className="text-[11px] text-[#64748B] truncate">{organization.description || organization.brief || "Workspace"}</p>
        </div>
      </div>

      {/* Right Block: Org Notification Bell & Right Sidebar Toggle */}
      <div className="flex shrink-0 items-center gap-2.5">
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
          className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#E2E8F0] bg-white/90 text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#1E293B] shadow-2xs"
          aria-label="Toggle right panel"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export default OrgHeader;
