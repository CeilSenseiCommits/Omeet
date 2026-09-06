import { Mail, Send } from "lucide-react";
import NotificationItem from "./NotificationItem";
import NotificationTabs from "./NotificationTabs";
import type { IncomingInvitation, OutgoingInvitation } from "../types/invitation";

interface NotificationDropdownProps {
  incoming: IncomingInvitation[];
  outgoing: OutgoingInvitation[];
  isOpen: boolean;
  activeTab: "incoming" | "outgoing";
  userId?: string;
  onTabChange: (tab: "incoming" | "outgoing") => void;
  onRefresh?: () => void;
}

function NotificationDropdown({
  incoming,
  outgoing,
  isOpen,
  activeTab,
  userId,
  onTabChange,
  onRefresh,
}: NotificationDropdownProps) {
  if (!isOpen) {
    return null;
  }

  const hasIncoming = incoming.length > 0;
  const hasOutgoing = outgoing.length > 0;

  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-[26rem] sm:w-[28rem] rounded-[28px] border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">
            Inbox
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Organization Invitations</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[10px] font-mono text-zinc-400">
            {activeTab === "incoming" ? `${incoming.length} Received` : `${outgoing.length} Sent`}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <NotificationTabs
          active={activeTab}
          incomingCount={incoming.length}
          outgoingCount={outgoing.length}
          onChange={onTabChange}
        />
      </div>

      <div className="mt-3.5 max-h-[26rem] space-y-2.5 overflow-y-auto pr-1">
        {activeTab === "incoming" && (
          <>
            {hasIncoming ? (
              incoming.map((invite) => (
                <NotificationItem
                  key={invite.id}
                  type="incoming"
                  incoming={invite}
                  userId={userId}
                  onActionComplete={onRefresh}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                  <Mail className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-white">No Pending Invitations</p>
                <p className="mt-1 text-xs text-zinc-500 max-w-[220px]">
                  When organizations invite you to join their team, their invites will appear here.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "outgoing" && (
          <>
            {hasOutgoing ? (
              outgoing.map((invite) => (
                <NotificationItem
                  key={invite.id}
                  type="outgoing"
                  outgoing={invite}
                  userId={userId}
                  onActionComplete={onRefresh}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                  <Send className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-white">No Outgoing Invitations</p>
                <p className="mt-1 text-xs text-zinc-500 max-w-[220px]">
                  Invitations you issue to colleagues will appear here with live response tracking.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
