import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  Bell, 
  Building2, 
  Video, 
  UserPlus, 
  Check, 
  X, 
  Loader2, 
  ExternalLink,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";

export default function HomeNotificationsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "orgs" | "meetings" | "friends">("all");

  const [orgInvites, setOrgInvites] = useState<any[]>([]);
  const [meetingInvites, setMeetingInvites] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAllNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);

      // 1. Org Invites
      const orgRes = await fetch(`http://localhost:5000/api/invitations/user/${user.id}`);
      if (orgRes.ok) {
        const data = await orgRes.json();
        setOrgInvites(data.invitations || []);
      }

      // 2. Meeting Invites
      const meetingRes = await fetch(`http://localhost:5000/api/meetings/invitations/user/${user.id}`);
      if (meetingRes.ok) {
        const data = await meetingRes.json();
        setMeetingInvites(data.invitations || []);
      }

      // 3. Friend Requests
      const friendRes = await fetch("http://localhost:5000/api/friends/requests", {
        headers: { "x-user-id": user.id },
      });
      if (friendRes.ok) {
        const data = await friendRes.json();
        setFriendRequests(data.incoming || []);
      }
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAllNotifications();
  }, [fetchAllNotifications]);

  // Handle Org Invitation Response
  const handleOrgInviteResponse = async (invitationId: string, action: "accept" | "decline") => {
    try {
      setActionLoadingId(invitationId);
      const res = await fetch(`http://localhost:5000/api/invitations/${invitationId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) {
        setOrgInvites((prev) =>
          prev.map((i) => (i.id === invitationId ? { ...i, status: action === "accept" ? "ACCEPTED" : "DECLINED" } : i))
        );
        window.dispatchEvent(new Event("organization-updated"));
      }
    } catch {}
    setActionLoadingId(null);
  };

  // Handle Meeting Invitation Response
  const handleMeetingInviteResponse = async (invitationId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      setActionLoadingId(invitationId);
      const res = await fetch(`http://localhost:5000/api/meetings/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user?.id }),
      });
      if (res.ok) {
        setMeetingInvites((prev) =>
          prev.map((i) => (i.id === invitationId ? { ...i, status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED" } : i))
        );
      }
    } catch {}
    setActionLoadingId(null);
  };

  // Handle Friend Request Response
  const handleFriendRequestResponse = async (requestId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      setActionLoadingId(requestId);
      const res = await fetch(`http://localhost:5000/api/friends/requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify({ action, userId: user?.id }),
      });
      if (res.ok) {
        setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
        window.dispatchEvent(new Event("friends-updated"));
      }
    } catch {}
    setActionLoadingId(null);
  };

  const totalCount = orgInvites.length + meetingInvites.length + friendRequests.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-amber-400" /> Notifications & Requests
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            All your pending organization invitations, meeting invites, and incoming friend requests.
          </p>
        </div>

        <span className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300">
          {totalCount} Total Items
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition shrink-0 ${
            activeTab === "all" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          All Notifications ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition shrink-0 ${
            activeTab === "friends" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          Friend Requests ({friendRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("orgs")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition shrink-0 ${
            activeTab === "orgs" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          Organization Invites ({orgInvites.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("meetings")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition shrink-0 ${
            activeTab === "meetings" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          Meeting Invites ({meetingInvites.length})
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/30">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Friend Requests */}
          {(activeTab === "all" || activeTab === "friends") &&
            friendRequests.map((req) => {
              const isBusy = actionLoadingId === req.id;
              return (
                <div
                  key={`friend-${req.id}`}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={
                        req.senderAvatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(req.senderName || "User")}`
                      }
                      alt={req.senderName}
                      className="h-10 w-10 rounded-full object-cover shrink-0 border border-zinc-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{req.senderName}</span>
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          Friend Request
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5 truncate">
                        @{req.senderUsername} wants to become friends on OMeet.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFriendRequestResponse(req.id, "ACCEPT")}
                      disabled={isBusy}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-40"
                    >
                      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFriendRequestResponse(req.id, "DECLINE")}
                      disabled={isBusy}
                      className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Organization Invitations */}
          {(activeTab === "all" || activeTab === "orgs") &&
            orgInvites.map((inv) => {
              const isPending = inv.status === "PENDING";
              const isBusy = actionLoadingId === inv.id;
              return (
                <div
                  key={`org-${inv.id}`}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950 border border-blue-800 text-blue-400 shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{inv.organizationName}</span>
                        <span className="rounded-md bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                          Org Invitation
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5 truncate">
                        Invited by {inv.inviterName} as <strong className="text-zinc-200">{inv.role}</strong> ({inv.position}).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOrgInviteResponse(inv.id, "accept")}
                          disabled={isBusy}
                          className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-40"
                        >
                          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOrgInviteResponse(inv.id, "decline")}
                          disabled={isBusy}
                          className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-400">
                        {inv.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

          {/* Meeting Invitations */}
          {(activeTab === "all" || activeTab === "meetings") &&
            meetingInvites.map((mInv) => {
              const isPending = mInv.status === "PENDING";
              const isBusy = actionLoadingId === mInv.id;
              return (
                <div
                  key={`meeting-${mInv.id}`}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0">
                      <Video className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{mInv.title}</span>
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          Meeting Invite
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5 truncate">
                        Invited by {mInv.inviterName} • Code: <span className="font-mono text-emerald-400 font-bold">{mInv.meetingCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMeetingInviteResponse(mInv.id, "ACCEPT")}
                          disabled={isBusy}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-40"
                        >
                          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMeetingInviteResponse(mInv.id, "DECLINE")}
                          disabled={isBusy}
                          className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/meeting/${mInv.meetingCode}`}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition"
                      >
                        Join Meeting
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

          {totalCount === 0 && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-12 text-center text-xs text-zinc-500">
              No notifications or invitations at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
