import { useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import type { IncomingInvitation, OutgoingInvitation } from "../types/invitation";

interface NotificationBellProps {
  incoming: IncomingInvitation[];
  outgoing: OutgoingInvitation[];
  isOpen: boolean;
  activeTab: "incoming" | "outgoing";
  userId?: string;
  onToggle: () => void;
  onClose?: () => void;
  onTabChange: (tab: "incoming" | "outgoing") => void;
  onRefresh?: () => void;
}

function NotificationBell({
  incoming,
  outgoing,
  isOpen,
  activeTab,
  userId,
  onToggle,
  onClose,
  onTabChange,
  onRefresh,
}: NotificationBellProps) {
  const bellRef = useRef<HTMLDivElement>(null);

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

  const unreadCount = incoming.filter((inv) => inv.status === "PENDING").length;

  return (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
          isOpen
            ? "border-cyan-500/50 bg-zinc-800 text-white ring-2 ring-cyan-500/20"
            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        }`}
        aria-label="Open invitations notification center"
      >
        <Bell className="h-5 w-5" />

        {/* Dynamic Badge for Incoming Invitations */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-zinc-950 bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        incoming={incoming}
        outgoing={outgoing}
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
