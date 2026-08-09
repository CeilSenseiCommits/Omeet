import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import type { Notification } from "../lib/mockData";

interface NotificationBellProps {
  incoming: Notification[];
  outgoing: Notification[];
  isOpen: boolean;
  activeTab: "incoming" | "outgoing";
  onToggle: () => void;
  onTabChange: (tab: "incoming" | "outgoing") => void;
}

function NotificationBell({ incoming, outgoing, isOpen, activeTab, onToggle, onTabChange }: NotificationBellProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        aria-label="Open notification center"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-zinc-950 bg-emerald-300" />
      </button>

      <NotificationDropdown
        incoming={incoming}
        outgoing={outgoing}
        isOpen={isOpen}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}

export default NotificationBell;
