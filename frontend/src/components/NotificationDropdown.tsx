import { Bell } from "lucide-react";
import NotificationItem from "./NotificationItem";
import NotificationTabs from "./NotificationTabs";
import type { Notification } from "../lib/mockData";

interface NotificationDropdownProps {
  incoming: Notification[];
  outgoing: Notification[];
  isOpen: boolean;
  activeTab: "incoming" | "outgoing";
  onTabChange: (tab: "incoming" | "outgoing") => void;
}

function NotificationDropdown({ incoming, outgoing, isOpen, activeTab, onTabChange }: NotificationDropdownProps) {
  if (!isOpen) {
    return null;
  }

  const items = activeTab === "incoming" ? incoming : outgoing;

  return (
    <div className="absolute right-0 top-full z-40 mt-3 w-[28rem] rounded-[30px] border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-500">Notifications</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Workspace updates</h2>
        </div>
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          {items.length}
        </span>
      </div>

      <div className="mt-4">
        <NotificationTabs active={activeTab} onChange={onTabChange} />
      </div>

      <div className="mt-4 max-h-[24rem] space-y-3 overflow-y-auto">
        {items.length > 0 ? (
          items.map((notification) => <NotificationItem key={notification.id} notification={notification} />)
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
            No notifications available.
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
