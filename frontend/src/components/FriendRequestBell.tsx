import { useState, useEffect, useRef, useCallback } from "react";
import { UserPlus, Users, Check, X, Search, Loader2, Clock } from "lucide-react";
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
      const res = await fetch("http://localhost:5000/api/friends/requests", {
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
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(searchQuery.trim())}&currentUserId=${user?.id || ""}`
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
      const res = await fetch(`http://localhost:5000/api/friends/requests/${requestId}/respond`, {
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
      const res = await fetch("http://localhost:5000/api/friends/request", {
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
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
        title="Friend Requests"
      >
        <UserPlus className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white shadow-lg shadow-emerald-950/50">
            {pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-96 rounded-3xl border border-zinc-800 bg-[#121215] shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Friend Requests</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddFriendOpen((prev) => !prev);
                setSearchQuery("");
                setSearchResults([]);
                setAddFriendError(null);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isAddFriendOpen ? "Close Search" : "Add Friend"}</span>
            </button>
          </div>

          {/* Add Friend Sub-View */}
          {isAddFriendOpen && (
            <div className="border-b border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, handle, or email..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 transition"
                  autoFocus
                />
              </div>

              {addFriendError && (
                <p className="text-[11px] text-rose-400">{addFriendError}</p>
              )}

              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {searchResults.map((user) => {
                    const isSent = requestSentIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                            alt={user.name}
                            className="h-7 w-7 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-zinc-400 truncate">@{user.username}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSendFriendRequest(user.id)}
                          disabled={isSent}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 px-2.5 py-1 text-[11px] font-semibold text-white transition shrink-0"
                        >
                          {isSent ? "Sent" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery.trim() ? (
                <p className="text-center text-xs text-zinc-500 py-2">No users found</p>
              ) : null}
            </div>
          )}

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-zinc-800/80 bg-zinc-900/40 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("incoming")}
              className={`rounded-xl py-2 text-xs font-semibold transition ${
                activeTab === "incoming"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Received ({incoming.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sent")}
              className={`rounded-xl py-2 text-xs font-semibold transition ${
                activeTab === "sent"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sent ({sent.length})
            </button>
          </div>

          {/* Content List */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-2">
            {activeTab === "incoming" ? (
              incoming.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No incoming friend requests
                </div>
              ) : (
                incoming.map((req) => {
                  const isBusy = actionLoadingId === req.id;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            req.senderAvatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(req.senderName || "User")}`
                          }
                          alt={req.senderName}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{req.senderName}</p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            @{req.senderUsername} {req.senderPosition ? `· ${req.senderPosition}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "ACCEPT")}
                          disabled={isBusy}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40"
                          title="Accept friend request"
                        >
                          {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "DECLINE")}
                          disabled={isBusy}
                          className="flex items-center justify-center h-7 w-7 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-rose-950/40 hover:border-rose-800 hover:text-rose-400 transition"
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
              <div className="py-8 text-center text-xs text-zinc-500">
                No outgoing friend requests
              </div>
            ) : (
              sent.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        req.receiverAvatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(req.receiverName || "User")}`
                      }
                      alt={req.receiverName}
                      className="h-8 w-8 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{req.receiverName}</p>
                      <p className="text-[10px] text-zinc-400 truncate">@{req.receiverUsername}</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 shrink-0">
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
