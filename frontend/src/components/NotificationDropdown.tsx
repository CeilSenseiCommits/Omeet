import { Mail, Send, Video, Calendar, ArrowRight, X, Building, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationItem from "./NotificationItem";
import NotificationTabs from "./NotificationTabs";
import type { IncomingInvitation, OutgoingInvitation, MeetingInvitation } from "../types/invitation";

interface NotificationDropdownProps {
  incoming: IncomingInvitation[];
  outgoing: OutgoingInvitation[];
  meetingInvitations?: MeetingInvitation[];
  isOpen: boolean;
  activeTab: "incoming" | "meetings" | "outgoing";
  userId?: string;
  onTabChange: (tab: "incoming" | "meetings" | "outgoing") => void;
  onRefresh?: () => void;
}

function NotificationDropdown({
  incoming,
  outgoing,
  meetingInvitations = [],
  isOpen,
  activeTab,
  userId,
  onTabChange,
  onRefresh,
}: NotificationDropdownProps) {
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const hasIncoming = incoming.length > 0;
  const hasMeetings = meetingInvitations.length > 0;
  const hasOutgoing = outgoing.length > 0;

  const handleDeclineMeeting = async (inviteId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/invitations/${inviteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DECLINE", userId }),
      });
      if (res.ok) {
        onRefresh?.();
      }
    } catch (err) {
      console.error("Failed to decline meeting invitation:", err);
    }
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-3 w-[26rem] sm:w-[28rem] rounded-[28px] border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">
            Inbox
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Notifications</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[10px] font-mono text-zinc-400">
            {activeTab === "incoming" 
              ? `${incoming.length} Org Invites` 
              : activeTab === "meetings"
              ? `${meetingInvitations.length} Meetings`
              : `${outgoing.length} Sent`}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <NotificationTabs
          active={activeTab}
          incomingCount={incoming.length}
          meetingsCount={meetingInvitations.length}
          outgoingCount={outgoing.length}
          onChange={onTabChange}
        />
      </div>

      <div className="mt-3.5 max-h-[26rem] space-y-2.5 overflow-y-auto pr-1">
        {/* Tab 1: Organization Invitations */}
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
                <p className="mt-3 text-sm font-medium text-white">No Pending Org Invitations</p>
                <p className="mt-1 text-xs text-zinc-500 max-w-[220px]">
                  When organizations invite you to join their team, invitations will appear here.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Meeting Invitations */}
        {activeTab === "meetings" && (
          <>
            {hasMeetings ? (
              meetingInvitations.map((meetingInv) => (
                <div
                  key={meetingInv.id}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 space-y-3 hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-950/80 border border-fuchsia-800/60 text-fuchsia-300">
                        <Video className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {meetingInv.title}
                        </h4>
                        <p className="text-xs text-zinc-400 truncate">
                          Invited by <span className="text-zinc-200 font-medium">{meetingInv.inviterName}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[11px] text-fuchsia-300">
                            <Building className="h-3 w-3" /> {meetingInv.organizationName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {meetingInv.meetingStatus === "LIVE" ? (
                      <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400 animate-pulse shrink-0">
                        ● LIVE NOW
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300 shrink-0">
                        {new Date(meetingInv.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5">
                    <span className="text-[11px] font-mono text-zinc-500">
                      Code: {meetingInv.meetingCode}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeclineMeeting(meetingInv.id)}
                        className="rounded-lg border border-zinc-800 hover:bg-zinc-800 p-1 text-zinc-400 hover:text-rose-400 transition"
                        title="Decline invite"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/meeting/${meetingInv.meetingCode}`)}
                        className="flex items-center gap-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-fuchsia-950/50 transition"
                      >
                        <span>Join Meeting</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                  <Video className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-white">No Meeting Invitations</p>
                <p className="mt-1 text-xs text-zinc-500 max-w-[220px]">
                  When colleagues schedule or invite you to an organization meeting, invites will appear here.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab 3: Outgoing Invitations */}
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
