import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Clock, Building, ArrowUpRight, Copy, CheckCheck } from "lucide-react";
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
      const res = await fetch(`http://localhost:5000/api/invitations/${inviteId}/respond`, {
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
      <article className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition-all hover:border-zinc-700/80 hover:bg-zinc-900/60 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/80 to-zinc-900 text-sm font-bold text-cyan-300">
              {incoming.organizationName.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="truncate text-sm font-semibold text-white">
                  {incoming.organizationName}
                </h4>
              </div>

              <p className="mt-1 text-xs text-zinc-300">
                Invited as <span className="font-semibold text-cyan-300">{incoming.position}</span>
              </p>

              <p className="mt-1 text-[11px] text-zinc-400 truncate">
                By <span className="text-zinc-300">{incoming.inviterName}</span> · Reports to{" "}
                <span className="text-zinc-300">{incoming.managerName}</span>
              </p>

              <div className="mt-2.5 flex items-center gap-2 text-[10px] font-medium text-zinc-500">
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="text-amber-300/90">{daysLeftText}</span>
                <span className="text-zinc-700">•</span>
                <span className="font-mono text-zinc-400">{incoming.inviteCode}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {currentStatus === "PENDING" && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                Pending
              </span>
            )}
            {currentStatus === "ACCEPTED" && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Accepted
              </span>
            )}
            {currentStatus === "REJECTED" && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                Declined
              </span>
            )}
          </div>
        </div>

        {/* Action buttons if Pending */}
        {isPending ? (
          <div className="mt-3.5 flex items-center justify-between border-t border-zinc-800/80 pt-3">
            <button
              type="button"
              onClick={() => navigate(`/invitation-preview/${incoming.id}`)}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition"
            >
              <span>View Details</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isResponding}
                onClick={() => handleRespond("REJECT", incoming.id)}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                <span>Decline</span>
              </button>

              <button
                type="button"
                disabled={isResponding}
                onClick={() => handleRespond("ACCEPT", incoming.id)}
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/50 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950 transition hover:bg-emerald-500 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isResponding ? "Joining..." : "Accept & Join"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3.5 flex items-center justify-between border-t border-zinc-800/80 pt-2.5">
            <span className="text-[11px] text-zinc-500">
              {currentStatus === "ACCEPTED" ? "Response: Accepted" : "Response: Declined"}
            </span>

            {currentStatus === "ACCEPTED" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                <span>Accepted</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
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
      PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      ACCEPTED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      REJECTED: "border-red-500/30 bg-red-500/10 text-red-400",
      EXPIRED: "border-zinc-700 bg-zinc-800 text-zinc-400",
    };

    return (
      <article className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition-all hover:border-zinc-700/80 hover:bg-zinc-900/60 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {outgoing.inviteeAvatarUrl ? (
              <img
                src={outgoing.inviteeAvatarUrl}
                alt={outgoing.inviteeName}
                className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-zinc-700"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-950/80 to-zinc-900 text-sm font-bold text-blue-300">
                {outgoing.inviteeName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold text-white">
                {outgoing.inviteeName}{" "}
                <span className="font-normal text-xs text-zinc-500">
                  @{outgoing.inviteeUsername}
                </span>
              </h4>

              <p className="mt-1 text-xs text-zinc-300">
                Target Role: <span className="text-white font-medium">{outgoing.position}</span>
              </p>

              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Building className="h-3 w-3 text-zinc-500" />
                <span className="truncate">{outgoing.organizationName}</span>
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-[10px] font-medium text-zinc-500">
                <span>Sent {new Date(outgoing.createdAt).toLocaleDateString()}</span>
                <span className="text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(outgoing.inviteCode)}
                  className="inline-flex items-center gap-1 font-mono text-cyan-300 hover:text-cyan-200 transition"
                  title="Click to copy code"
                >
                  <span>{outgoing.inviteCode}</span>
                  {copiedCode ? (
                    <CheckCheck className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-zinc-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                statusColors[outgoing.status] || "border-zinc-700 text-zinc-400"
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
