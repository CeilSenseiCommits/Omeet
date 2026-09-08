import { API_BASE_URL } from "../lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Clock, Building, ArrowUpRight, Copy, CheckCheck } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { IncomingInvitation, OutgoingInvitation } from "../types/invitation";

interface NotificationItemProps {
  type: "incoming" | "outgoing";
  incoming?: IncomingInvitation;
  outgoing?: OutgoingInvitation;
  userId?: string;
  onActionComplete?: () => void;
}

function NotificationItem({
  type,
  incoming,
  outgoing,
  userId,
  onActionComplete,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const [isResponding, setIsResponding] = useState(false);
  const [responseStatus, setResponseStatus] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleRespond = async (action: "ACCEPT" | "REJECT", inviteId: string) => {
    if (!userId || isResponding) return;
    setIsResponding(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/invitations/${inviteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });

      const data = await res.json();
      if (res.ok) {
        setResponseStatus(action === "ACCEPT" ? "ACCEPTED" : "REJECTED");
        
        // Rerender organization carousel on dashboard
        if (action === "ACCEPT") {
          window.dispatchEvent(new CustomEvent("organization-updated"));
        }

        // Refresh live notifications list
        if (onActionComplete) {
          onActionComplete();
        }
      } else {
        alert(data.error || "Failed to respond to invitation");
      }
    } catch (err) {
      console.error("Error responding to invitation:", err);
      alert("Network error processing invitation response.");
    } finally {
      setIsResponding(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 1. INCOMING INVITATION ITEM
  if (type === "incoming" && incoming) {
    const isPending = incoming.status === "PENDING" && !responseStatus;
    const currentStatus = responseStatus || incoming.status;

    // Calculate days remaining
    let daysLeftText = "Valid";
    if (incoming.expiresAt) {
      const diffMs = new Date(incoming.expiresAt).getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        daysLeftText = "Expiring today";
      } else if (diffDays === 1) {
        daysLeftText = "1 day left";
      } else {
        daysLeftText = `${diffDays} days left`;
      }
    }

    return (
      <article className="rounded-[5px] border border-[#D8D4CB] bg-white p-3.5 transition-all hover:border-[#4963C8]/50 shadow-xs text-[#242427]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#D8D4CB] bg-[#EDE9DF] text-xs font-bold text-[#242427]">
              {incoming.organizationName.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                <h4 className="truncate text-xs font-semibold text-[#242427]">
                  {incoming.organizationName}
                </h4>
              </div>

              <p className="mt-0.5 text-xs text-[#585754]">
                Role: <span className="font-semibold text-[#242427]">{incoming.position}</span>
              </p>

              <p className="mt-0.5 text-[11px] text-[#7E7C77] truncate">
                By {incoming.inviterName} · Reports to {incoming.managerName}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-[#7E7C77]">
                <Clock className="h-3 w-3 text-[#D97706]" />
                <span className="text-[#D97706]">{daysLeftText}</span>
                <span>•</span>
                <span className="font-mono text-[#585754]">{incoming.inviteCode}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {currentStatus === "PENDING" && (
              <span className="rounded-[3px] border border-[#D97706]/40 bg-[#D97706]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#D97706]">
                Pending
              </span>
            )}
            {currentStatus === "ACCEPTED" && (
              <span className="rounded-[3px] border border-[#10B981]/40 bg-[#10B981]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#10B981]">
                Accepted
              </span>
            )}
            {currentStatus === "REJECTED" && (
              <span className="rounded-[3px] border border-[#B44A4A]/40 bg-[#B44A4A]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#B44A4A]">
                Declined
              </span>
            )}
          </div>
        </div>

        {/* Action buttons if Pending */}
        {isPending ? (
          <div className="mt-3 flex items-center justify-between border-t border-[#D8D4CB] pt-2.5">
            <button
              type="button"
              onClick={() => navigate(`/invitation-preview/${incoming.id}`)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#585754] hover:text-[#242427] transition"
            >
              <span>View Details</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isResponding}
                onClick={() => handleRespond("REJECT", incoming.id)}
                className="inline-flex items-center gap-1 rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] px-2.5 py-1 text-xs font-medium text-[#585754] transition hover:bg-[#B44A4A]/10 hover:border-[#B44A4A] hover:text-[#B44A4A] disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                <span>Decline</span>
              </button>

              <button
                type="button"
                disabled={isResponding}
                onClick={() => handleRespond("ACCEPT", incoming.id)}
                className="inline-flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isResponding ? "Joining..." : "Accept"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2.5 flex items-center justify-between border-t border-[#D8D4CB] pt-2">
            <span className="text-[11px] text-[#7E7C77]">
              {currentStatus === "ACCEPTED" ? "Response: Accepted" : "Response: Declined"}
            </span>

            {currentStatus === "ACCEPTED" ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#10B981]">
                <Check className="h-3.5 w-3.5" />
                <span>Accepted</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7E7C77]">
                <X className="h-3.5 w-3.5" />
                <span>Declined</span>
              </span>
            )}
          </div>
        )}
      </article>
    );
  }

  // 2. OUTGOING INVITATION ITEM
  if (type === "outgoing" && outgoing) {
    const statusColors: Record<string, string> = {
      PENDING: "border-[#D97706]/40 bg-[#D97706]/10 text-[#D97706]",
      ACCEPTED: "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]",
      REJECTED: "border-[#B44A4A]/40 bg-[#B44A4A]/10 text-[#B44A4A]",
      EXPIRED: "border-[#D8D4CB] bg-[#EDE9DF] text-[#7E7C77]",
    };

    return (
      <article className="rounded-[5px] border border-[#D8D4CB] bg-white p-3.5 transition-all hover:border-[#4963C8]/50 shadow-xs text-[#242427]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <UserAvatar name={outgoing.inviteeName} avatarUrl={outgoing.inviteeAvatarUrl} size="sm" />

            <div className="min-w-0">
              <h4 className="truncate text-xs font-semibold text-[#242427]">
                {outgoing.inviteeName}{" "}
                <span className="font-normal text-[11px] text-[#7E7C77]">
                  @{outgoing.inviteeUsername}
                </span>
              </h4>

              <p className="mt-0.5 text-xs text-[#585754]">
                Role: <span className="text-[#242427] font-medium">{outgoing.position}</span>
              </p>

              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#7E7C77]">
                <Building className="h-3 w-3 text-[#7E7C77]" />
                <span className="truncate">{outgoing.organizationName}</span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-[#7E7C77]">
                <span>Sent {new Date(outgoing.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(outgoing.inviteCode)}
                  className="inline-flex items-center gap-1 font-mono text-[#4963C8] hover:text-[#3E56B5] transition"
                  title="Click to copy code"
                >
                  <span>{outgoing.inviteCode}</span>
                  {copiedCode ? (
                    <CheckCheck className="h-3 w-3 text-[#10B981]" />
                  ) : (
                    <Copy className="h-3 w-3 text-[#7E7C77]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <span
              className={`rounded-[3px] border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                statusColors[outgoing.status] || "border-[#D8D4CB] text-[#7E7C77]"
              }`}
            >
              {outgoing.status}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return null;
}

export default NotificationItem;
