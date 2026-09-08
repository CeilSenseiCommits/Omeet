import { API_BASE_URL } from "../lib/api";
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
      const res = await fetch(`${API_BASE_URL}/api/meetings/invitations/${inviteId}/respond`, {
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
    <div className="absolute right-0 top-full z-50 mt-2 w-[26rem] sm:w-[28rem] rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-4 shadow-2xl text-[#242427]">
      <div className="flex items-center justify-between pb-2 border-b border-[#D8D4CB]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#4963C8]">
            Inbox
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-[#242427]">Notifications</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-[3px] border border-[#D8D4CB] bg-[#EDE9DF] px-2 py-0.5 text-[10px] font-mono text-[#585754]">
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
              <div className="flex flex-col items-center justify-center rounded-[6px] border border-dashed border-[#D8D4CB] bg-[#EDE9DF]/40 p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-white text-[#7E7C77]">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="mt-2.5 text-xs font-semibold text-[#242427]">No Pending Org Invitations</p>
                <p className="mt-1 text-xs text-[#7E7C77] max-w-[220px]">
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
                  className={`rounded-[6px] border p-3.5 space-y-2.5 transition shadow-xs ${
                    meetingInv.meetingStatus === "LIVE"
                      ? "border-[#10B981]/50 bg-[#F0FDF4]"
                      : "border-[#D8D4CB] bg-white hover:border-[#4963C8]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border ${
                        meetingInv.meetingStatus === "LIVE"
                          ? "border-[#10B981]/40 bg-[#10B981]/15 text-[#059669]"
                          : "border-[#D8D4CB] bg-[#EDE9DF] text-[#4963C8]"
                      }`}>
                        <Video className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#242427] truncate">
                          {meetingInv.title}
                        </h4>
                        <p className="text-[11px] text-[#7E7C77] truncate">
                          Invited by <span className="text-[#242427] font-medium">{meetingInv.inviterName}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-[#4963C8] font-medium">
                            <Building className="h-3 w-3" /> {meetingInv.organizationName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {meetingInv.meetingStatus === "LIVE" ? (
                      <span className="relative flex items-center gap-1.5 rounded-[4px] border border-[#10B981]/50 bg-[#10B981]/20 px-2 py-0.5 text-[10px] font-bold text-[#059669] shrink-0">
                        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                        LIVE NOW
                      </span>
                    ) : (
                      <span className="rounded-[4px] border border-[#D8D4CB] bg-[#EDE9DF] px-2 py-0.5 text-[10px] font-mono text-[#585754] shrink-0">
                        {meetingInv.scheduledAt ? new Date(meetingInv.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}
                      </span>
                    )}
                  </div>

                  {/* Explicit status message per user requirement */}
                  <div className={`rounded-[4px] px-2.5 py-1.5 text-[11px] ${
                    meetingInv.meetingStatus === "LIVE"
                      ? "bg-[#DCFCE7] text-[#166534] font-medium"
                      : "bg-[#EDE9DF]/60 text-[#585754]"
                  }`}>
                    {meetingInv.meetingStatus === "LIVE"
                      ? "Meeting started! You are invited to join."
                      : `You are invited to this meeting scheduled for ${meetingInv.scheduledAt ? new Date(meetingInv.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "future"}.`}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#D8D4CB]/80 pt-2">
                    <span className="text-[11px] font-mono text-[#7E7C77]">
                      Code: {meetingInv.meetingCode}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeclineMeeting(meetingInv.id)}
                        className="rounded-[4px] border border-[#D8D4CB] bg-[#EDE9DF] hover:bg-[#B44A4A]/10 hover:border-[#B44A4A] p-1.5 text-[#7E7C77] hover:text-[#B44A4A] transition"
                        title="Decline invite"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/meeting/${meetingInv.meetingCode}`)}
                        className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-xs font-semibold text-white shadow-xs transition ${
                          meetingInv.meetingStatus === "LIVE"
                            ? "bg-[#10B981] hover:bg-[#059669]"
                            : "bg-[#4963C8] hover:bg-[#3E56B5]"
                        }`}
                      >
                        <span>{meetingInv.meetingStatus === "LIVE" ? "Join Live" : "Join"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[6px] border border-dashed border-[#D8D4CB] bg-[#EDE9DF]/40 p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-white text-[#7E7C77]">
                  <Video className="h-5 w-5" />
                </div>
                <p className="mt-2.5 text-xs font-semibold text-[#242427]">No Meeting Invitations</p>
                <p className="mt-1 text-xs text-[#7E7C77] max-w-[220px]">
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
              <div className="flex flex-col items-center justify-center rounded-[6px] border border-dashed border-[#D8D4CB] bg-[#EDE9DF]/40 p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-white text-[#7E7C77]">
                  <Send className="h-5 w-5" />
                </div>
                <p className="mt-2.5 text-xs font-semibold text-[#242427]">No Outgoing Invitations</p>
                <p className="mt-1 text-xs text-[#7E7C77] max-w-[220px]">
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
