import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  Bell, 
  Building2, 
  Video, 
  Check, 
  X, 
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { markNotificationsAsSeen } from "../../lib/notificationStorage";

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

  // Mark all viewed notifications as seen
  useEffect(() => {
    if (user?.id && !isLoading) {
      const pendingIds = [
        ...orgInvites.filter((i) => i.status === "PENDING").map((i) => i.id),
        ...meetingInvites.filter((i) => i.status === "PENDING").map((i) => i.id),
      ].filter(Boolean);

      if (pendingIds.length > 0) {
        markNotificationsAsSeen(user.id, pendingIds);
      }
    }
  }, [user?.id, isLoading, orgInvites, meetingInvites]);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D8D4CB] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#242427] flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#4963C8]" />
            <span>Notifications & Requests</span>
          </h2>
          <p className="text-xs text-[#585754] mt-0.5">
            All pending organization invitations, meeting invites, and incoming friend requests.
          </p>
        </div>

        <span className="rounded-[3px] border border-[#D8D4CB] bg-white px-2.5 py-1 text-xs font-semibold text-[#585754]">
          {totalCount} Total
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#D8D4CB] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
            activeTab === "all"
              ? "border border-[#D8D4CB] bg-white text-[#242427] shadow-xs"
              : "border border-transparent text-[#7E7C77] hover:text-[#242427]"
          }`}
        >
          All ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
            activeTab === "friends"
              ? "border border-[#D8D4CB] bg-white text-[#242427] shadow-xs"
              : "border border-transparent text-[#7E7C77] hover:text-[#242427]"
          }`}
        >
          Friend Requests ({friendRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("orgs")}
          className={`rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
            activeTab === "orgs"
              ? "border border-[#D8D4CB] bg-white text-[#242427] shadow-xs"
              : "border border-transparent text-[#7E7C77] hover:text-[#242427]"
          }`}
        >
          Org Invites ({orgInvites.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("meetings")}
          className={`rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
            activeTab === "meetings"
              ? "border border-[#D8D4CB] bg-white text-[#242427] shadow-xs"
              : "border border-transparent text-[#7E7C77] hover:text-[#242427]"
          }`}
        >
          Meeting Invites ({meetingInvites.length})
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-[6px] border border-[#D8D4CB] bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-[#7E7C77]" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Friend Requests */}
          {(activeTab === "all" || activeTab === "friends") &&
            friendRequests.map((req) => {
              const isBusy = actionLoadingId === req.id;
              return (
                <div
                  key={`friend-${req.id}`}
                  className="flex items-center justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-3.5 text-xs shadow-xs hover:border-[#4963C8] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        req.senderAvatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(req.senderName || "User")}`
                      }
                      alt={req.senderName}
                      className="h-8 w-8 rounded-[5px] object-cover shrink-0 border border-[#D8D4CB]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#242427] text-xs truncate">{req.senderName}</span>
                        <span className="rounded-[3px] border border-[#CBD5E1] bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#4963C8]">
                          Friend Request
                        </span>
                      </div>
                      <p className="text-[#585754] text-[11px] mt-0.5 truncate">
                        @{req.senderUsername} wants to connect on OMeet.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFriendRequestResponse(req.id, "ACCEPT")}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
                    >
                      {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFriendRequestResponse(req.id, "DECLINE")}
                      disabled={isBusy}
                      className="rounded-[5px] border border-[#D8D4CB] bg-white p-1.5 text-[#7E7C77] hover:border-[#B44A4A] hover:bg-[#FDF2F2] hover:text-[#B44A4A] transition-colors"
                      title="Decline"
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
                  className="flex items-center justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-3.5 text-xs shadow-xs hover:border-[#4963C8] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#CBD5E1] bg-[#EEF2FF] text-[#4963C8] shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#242427] text-xs truncate">{inv.organizationName}</span>
                        <span className="rounded-[3px] border border-[#CBD5E1] bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#4963C8]">
                          Org Invite
                        </span>
                      </div>
                      <p className="text-[#585754] text-[11px] mt-0.5 truncate">
                        Invited by {inv.inviterName} as <strong className="text-[#242427] font-medium">{inv.role}</strong> ({inv.position}).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOrgInviteResponse(inv.id, "accept")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
                        >
                          {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOrgInviteResponse(inv.id, "decline")}
                          disabled={isBusy}
                          className="rounded-[5px] border border-[#D8D4CB] bg-white p-1.5 text-[#7E7C77] hover:border-[#B44A4A] hover:bg-[#FDF2F2] hover:text-[#B44A4A] transition-colors"
                          title="Decline"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-2.5 py-1 text-xs font-medium text-[#585754]">
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
                  className="flex items-center justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-3.5 text-xs shadow-xs hover:border-[#4963C8] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] text-[#585754] shrink-0">
                      <Video className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#242427] text-xs truncate">{mInv.title}</span>
                        <span className="rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-1.5 py-0.5 text-[10px] font-semibold text-[#585754]">
                          Meeting Invite
                        </span>
                      </div>
                      <p className="text-[#585754] text-[11px] mt-0.5 truncate">
                        Invited by {mInv.inviterName} · Code: <span className="font-mono text-[#4963C8] font-semibold">{mInv.meetingCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMeetingInviteResponse(mInv.id, "ACCEPT")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
                        >
                          {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMeetingInviteResponse(mInv.id, "DECLINE")}
                          disabled={isBusy}
                          className="rounded-[5px] border border-[#D8D4CB] bg-white p-1.5 text-[#7E7C77] hover:border-[#B44A4A] hover:bg-[#FDF2F2] hover:text-[#B44A4A] transition-colors"
                          title="Decline"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/meeting/${mInv.meetingCode}`}
                        className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors"
                      >
                        Join Meeting
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

          {totalCount === 0 && (
            <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-10 text-center text-xs text-[#7E7C77]">
              No notifications or invitations at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
