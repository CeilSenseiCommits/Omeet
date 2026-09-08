import { API_BASE_URL } from "../lib/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { UserPlus, Users, Check, X, Search, Loader2, Clock } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useAuth } from "../context/AuthContext";

export interface FriendRequestItem {
  id: string;
  status: string;
  createdAt: string;
  senderId?: string;
  senderName?: string;
  senderUsername?: string;
  senderAvatarUrl?: string;
  senderPosition?: string;
  receiverId?: string;
  receiverName?: string;
  receiverUsername?: string;
  receiverAvatarUrl?: string;
}

interface FriendRequestBellProps {
  onRefresh?: () => void;
}

export default function FriendRequestBell({ onRefresh }: FriendRequestBellProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"incoming" | "sent">("incoming");
  const [incoming, setIncoming] = useState<FriendRequestItem[]>([]);
  const [sent, setSent] = useState<FriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Add friend modal inside dropdown
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSentIds, setRequestSentIds] = useState<string[]>([]);
  const [addFriendError, setAddFriendError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchFriendRequests = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/requests`, {
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setIncoming(data.incoming || []);
        setSent(data.sent || []);
      }
    } catch (err) {
      console.warn("Could not fetch friend requests:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFriendRequests();
    const interval = setInterval(fetchFriendRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchFriendRequests]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Live search users to add as friends
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setAddFriendError(null);
        const res = await fetch(
          `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(searchQuery.trim())}&currentUserId=${user?.id || ""}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch {
        // error
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleRespond = async (requestId: string, action: "ACCEPT" | "DECLINE") => {
    if (!user?.id) return;
    try {
      setActionLoadingId(requestId);
      const res = await fetch(`${API_BASE_URL}/api/friends/requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ action, userId: user.id }),
      });
      if (res.ok) {
        setIncoming((prev) => prev.filter((r) => r.id !== requestId));
        window.dispatchEvent(new Event("friends-updated"));
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Failed to respond to friend request:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user?.id) return;
    try {
      setAddFriendError(null);
      const res = await fetch(`${API_BASE_URL}/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send request.");
      }
      setRequestSentIds((prev) => [...prev, targetUserId]);
      fetchFriendRequests();
      window.dispatchEvent(new Event("friends-updated"));
    } catch (err: any) {
      setAddFriendError(err.message || "Failed to send request.");
    }
  };

  const pendingCount = incoming.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] text-[#585754] transition hover:border-[#4963C8] hover:bg-[#E2DDD0] hover:text-[#242427]"
        title="Friend Requests"
      >
        <UserPlus className="h-4 w-4" />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-[3px] border border-white bg-[#4963C8] px-1 text-[9px] font-bold text-white shadow-xs">
            {pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] shadow-2xl overflow-hidden text-[#242427]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D8D4CB] p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#EDE9DF] border border-[#D8D4CB] text-[#4963C8]">
                <Users className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#242427]">Friend Requests</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddFriendOpen((prev) => !prev);
                setSearchQuery("");
                setSearchResults([]);
                setAddFriendError(null);
              }}
              className="flex items-center gap-1.5 rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] px-2.5 py-1 text-xs font-medium text-[#585754] hover:bg-[#E2DDD0] hover:text-[#242427] transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isAddFriendOpen ? "Close" : "Add Friend"}</span>
            </button>
          </div>

          {/* Add Friend Sub-View */}
          {isAddFriendOpen && (
            <div className="border-b border-[#D8D4CB] bg-[#EDE9DF] p-3 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E7C77]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, handle, or email..."
                  className="w-full rounded-[5px] border border-[#D8D4CB] bg-white pl-8 pr-3 py-1.5 text-xs text-[#242427] placeholder:text-[#7E7C77] outline-none focus:border-[#4963C8] transition"
                  autoFocus
                />
              </div>

              {addFriendError && (
                <p className="text-[11px] text-[#B44A4A]">{addFriendError}</p>
              )}

              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[#7E7C77]" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {searchResults.map((searchUser) => {
                    const isSent = requestSentIds.includes(searchUser.id);
                    return (
                      <div
                        key={searchUser.id}
                        className="flex items-center justify-between rounded-[5px] border border-[#D8D4CB] bg-white p-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar name={searchUser.name} avatarUrl={searchUser.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#242427] truncate">{searchUser.name}</p>
                            <p className="text-[10px] text-[#7E7C77] truncate">@{searchUser.username}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSendFriendRequest(searchUser.id)}
                          disabled={isSent}
                          className="flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] disabled:bg-[#EDE9DF] disabled:text-[#7E7C77] px-2.5 py-1 text-[11px] font-semibold text-white transition shrink-0"
                        >
                          {isSent ? "Sent" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery.trim() ? (
                <p className="text-center text-xs text-[#7E7C77] py-2">No users found</p>
              ) : null}
            </div>
          )}

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-[#D8D4CB] bg-[#EDE9DF] p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("incoming")}
              className={`rounded-[4px] py-1.5 text-xs font-semibold transition ${
                activeTab === "incoming"
                  ? "bg-white text-[#242427] shadow-xs"
                  : "text-[#7E7C77] hover:text-[#242427]"
              }`}
            >
              Received ({incoming.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sent")}
              className={`rounded-[4px] py-1.5 text-xs font-semibold transition ${
                activeTab === "sent"
                  ? "bg-white text-[#242427] shadow-xs"
                  : "text-[#7E7C77] hover:text-[#242427]"
              }`}
            >
              Sent ({sent.length})
            </button>
          </div>

          {/* Content List */}
          <div className="max-h-80 overflow-y-auto p-2.5 space-y-2">
            {activeTab === "incoming" ? (
              incoming.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7E7C77]">
                  No incoming friend requests
                </div>
              ) : (
                incoming.map((req) => {
                  const isBusy = actionLoadingId === req.id;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-[5px] border border-[#D8D4CB] bg-white p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={req.senderName} avatarUrl={req.senderAvatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#242427] truncate">{req.senderName}</p>
                          <p className="text-[10px] text-[#7E7C77] truncate">
                            @{req.senderUsername} {req.senderPosition ? `· ${req.senderPosition}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "ACCEPT")}
                          disabled={isBusy}
                          className="flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-2.5 py-1 text-xs font-semibold text-white transition disabled:opacity-40 shadow-xs"
                          title="Accept friend request"
                        >
                          {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "DECLINE")}
                          disabled={isBusy}
                          className="flex items-center justify-center h-6 w-6 rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] text-[#585754] hover:bg-[#B44A4A]/10 hover:border-[#B44A4A] hover:text-[#B44A4A] transition"
                          title="Decline"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : sent.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7E7C77]">
                No outgoing friend requests
              </div>
            ) : (
              sent.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-[5px] border border-[#D8D4CB] bg-white p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar name={req.receiverName} avatarUrl={req.receiverAvatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#242427] truncate">{req.receiverName}</p>
                      <p className="text-[10px] text-[#7E7C77] truncate">@{req.receiverUsername}</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 rounded-[3px] border border-[#D97706]/40 bg-[#D97706]/10 px-2 py-0.5 text-[10px] font-semibold text-[#D97706] shrink-0">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
