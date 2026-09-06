import { useRef, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import type { IncomingInvitation, OutgoingInvitation, MeetingInvitation } from "../types/invitation";
import { getSeenNotificationIds, markNotificationsAsSeen } from "../lib/notificationStorage";

interface NotificationBellProps {
  incoming: IncomingInvitation[];
  outgoing: OutgoingInvitation[];
  meetingInvitations?: MeetingInvitation[];
  isOpen: boolean;
  activeTab: "incoming" | "meetings" | "outgoing";
  userId?: string;
  onToggle: () => void;
  onClose?: () => void;
  onTabChange: (tab: "incoming" | "meetings" | "outgoing") => void;
  onRefresh?: () => void;
}

function NotificationBell({
  incoming,
  outgoing,
  meetingInvitations = [],
  isOpen,
  activeTab,
  userId,
  onToggle,
  onClose,
  onTabChange,
  onRefresh,
}: NotificationBellProps) {
  const bellRef = useRef<HTMLDivElement>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => getSeenNotificationIds(userId));

  // Sync seen IDs from storage and window events
  useEffect(() => {
    setSeenIds(getSeenNotificationIds(userId));

    const handleSeenUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail?.userId || customEvent.detail.userId === userId) {
        setSeenIds(new Set(customEvent.detail?.seenIds || []));
      }
    };

    window.addEventListener("omeet-notifications-seen", handleSeenUpdate);
    return () => window.removeEventListener("omeet-notifications-seen", handleSeenUpdate);
  }, [userId]);

  // When notification center is opened, mark all currently visible pending notifications as seen
  useEffect(() => {
    if (isOpen && userId) {
      const pendingIdsToMark = [
        ...incoming.filter((inv) => inv.status === "PENDING").map((inv) => inv.id),
        ...meetingInvitations.filter((inv) => inv.status === "PENDING").map((inv) => inv.id),
      ].filter((id) => Boolean(id) && !seenIds.has(id));

      if (pendingIdsToMark.length > 0) {
        markNotificationsAsSeen(userId, pendingIdsToMark);
      }
    }
  }, [isOpen, userId, incoming, meetingInvitations, seenIds]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        if (isOpen && onClose) {
          onClose();
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const unreadOrgCount = incoming.filter((inv) => inv.status === "PENDING" && !seenIds.has(inv.id)).length;
  const unreadMeetingsCount = meetingInvitations.filter((inv) => inv.status === "PENDING" && !seenIds.has(inv.id)).length;
  const unreadCount = unreadOrgCount + unreadMeetingsCount;

  return (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`relative flex h-9 w-9 items-center justify-center rounded-[5px] border transition-all ${
          isOpen
            ? "border-[#4963C8] bg-[#EDE9DF] text-[#242427] ring-1 ring-[#4963C8]/30"
            : "border-[#D8D4CB] bg-[#EDE9DF] text-[#585754] hover:bg-[#E2DDD0] hover:text-[#242427]"
        }`}
        aria-label="Open invitations notification center"
      >
        <Bell className="h-4 w-4" />

        {/* Dynamic Badge for Incoming Invitations */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-[3px] border border-white bg-[#4963C8] px-1 text-[9px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        incoming={incoming}
        outgoing={outgoing}
        meetingInvitations={meetingInvitations}
        isOpen={isOpen}
        activeTab={activeTab}
        userId={userId}
        onTabChange={onTabChange}
        onRefresh={onRefresh}
      />
    </div>
  );
}

export default NotificationBell;
