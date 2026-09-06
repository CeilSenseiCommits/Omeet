import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Users, 
  UserPlus, 
  Video, 
  Send, 
  Search, 
  MessageSquare, 
  ExternalLink, 
  Check, 
  Loader2, 
  Sparkles,
  Smile,
  Paperclip
} from "lucide-react";
import CreatePublicMeetingModal from "../CreatePublicMeetingModal";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  email: string;
  bio?: string;
  friendsSince: string;
  primaryAffiliation?: {
    name: string;
    position: string;
  };
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarUrl?: string;
  content: string;
  messageType: string;
  createdAt: string;
}

export default function HomePeopleView() {
  const { user } = useAuth();

  // Friends & Selection
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  // Chat stream
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add Friend Modal
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [addFriendStatus, setAddFriendStatus] = useState<string | null>(null);

  // Meeting modal for "Invite to Meet"
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // Load Friends
  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingFriends(true);
      const res = await fetch("http://localhost:5000/api/friends", {
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        if (data.friends && data.friends.length > 0 && !selectedFriend) {
          handleSelectFriend(data.friends[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to load friends:", err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFriends();
    window.addEventListener("friends-updated", fetchFriends);
    return () => window.removeEventListener("friends-updated", fetchFriends);
  }, [fetchFriends]);

  // Select a friend and open conversation
  const handleSelectFriend = async (friend: Friend) => {
    if (!user?.id) return;
    setSelectedFriend(friend);
    setIsLoadingMessages(true);

    try {
      // 1. Get or create 1-on-1 personal conversation
      const convRes = await fetch(`http://localhost:5000/api/friends/chat/${friend.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
      });
      if (!convRes.ok) throw new Error("Failed to start chat.");
      const convData = await convRes.json();
      const convId = convData.conversationId;
      setActiveConvId(convId);

      // 2. Load messages for this conversation
      const msgRes = await fetch(`http://localhost:5000/api/personal/conversations/${convId}/messages`, {
        headers: { "x-user-id": user.id },
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
      }
    } catch (err) {
      console.error("Failed to select friend:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConvId || !user?.id) return;

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConvId,
      senderId: user.id,
      senderName: user.name || "Me",
      senderUsername: user.username || "me",
      senderAvatarUrl: user.avatarUrl,
      content: messageInput.trim(),
      messageType: "TEXT",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    const textToSend = messageInput.trim();
    setMessageInput("");

    try {
      setIsSending(true);
      const res = await fetch(`http://localhost:5000/api/personal/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ content: textToSend, messageType: "TEXT" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data.message : m)));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Add friend live search
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        setAddFriendStatus(null);
        const res = await fetch(
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(userSearchQuery.trim())}&currentUserId=${user?.id || ""}`
        );
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data.users || []);
        }
      } catch {
        // err
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearchQuery, user?.id]);

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch("http://localhost:5000/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send request.");
      setSentRequestIds((prev) => [...prev, targetUserId]);
      setAddFriendStatus("Request sent successfully!");
    } catch (err: any) {
      setAddFriendStatus(err.message || "Failed to send request.");
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex h-[750px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#121215] shadow-2xl">
      {/* Left Column: Friends Roster */}
      <div className="flex w-72 flex-col border-r border-zinc-800 bg-zinc-950/60 shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" /> Friends ({friends.length})
            </h3>
            <button
              type="button"
              onClick={() => setIsAddFriendOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition shadow-sm"
              title="Add Friend"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search friends..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingFriends ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-12 text-center p-4">
              <Users className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-xs font-medium text-zinc-400">No friends yet</p>
              <p className="text-[11px] text-zinc-500 mt-1">Send friend requests to start personal chatting.</p>
              <button
                type="button"
                onClick={() => setIsAddFriendOpen(true)}
                className="mt-3 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
              >
                Find People
              </button>
            </div>
          ) : (
            filteredFriends.map((f) => {
              const isSelected = selectedFriend?.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelectFriend(f)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${
                    isSelected
                      ? "bg-zinc-800 text-white shadow-sm ring-1 ring-emerald-500/30"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={f.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}`}
                      alt={f.name}
                      className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                    />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-white truncate">{f.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      @{f.username} {f.primaryAffiliation ? `• ${f.primaryAffiliation.name}` : ""}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center/Right: Personal Chat Screen */}
      <div className="flex flex-1 flex-col bg-[#121215]">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3.5 bg-zinc-950/40">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedFriend.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFriend.name)}`}
                  alt={selectedFriend.name}
                  className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{selectedFriend.name}</h3>
                    <Link
                      to={`/profile/${selectedFriend.id}`}
                      className="text-zinc-500 hover:text-blue-400"
                      title="View public profile"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Personal Space • @{selectedFriend.username}
                  </p>
                </div>
              </div>

              {/* Start Video Meeting Action */}
              <button
                type="button"
                onClick={() => setIsMeetingModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-950/50 transition"
              >
                <Video className="h-4 w-4" />
                <span>Invite to Meet</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-2 text-zinc-500">
                  <MessageSquare className="h-10 w-10 text-zinc-600" />
                  <p className="text-xs font-medium text-zinc-400">
                    This is the start of your direct conversation with {selectedFriend.name}.
                  </p>
                  <p className="text-[11px] max-w-xs text-zinc-600">
                    Send a message or invite them to an open video meeting.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  const time = new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <img
                        src={
                          msg.senderAvatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || "U")}`
                        }
                        alt={msg.senderName}
                        className="h-8 w-8 rounded-full object-cover shrink-0 border border-zinc-800"
                      />

                      <div className="space-y-1">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isMe
                              ? "bg-emerald-600 text-white shadow-md rounded-tr-none"
                              : "border border-zinc-800 bg-zinc-900 text-zinc-200 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <p className={`text-[10px] text-zinc-500 ${isMe ? "text-right" : ""}`}>{time}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="border-t border-zinc-800 p-4 bg-zinc-950/60">
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message @${selectedFriend.username}...`}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
            <Users className="h-12 w-12 text-zinc-700" />
            <h3 className="text-base font-semibold text-white">Your Personal People Space</h3>
            <p className="text-xs max-w-sm text-zinc-400">
              Select a friend from the left sidebar to start chatting, or add new friends across OMeet.
            </p>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {isAddFriendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-emerald-400" /> Add Friend
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddFriendOpen(false);
                  setUserSearchQuery("");
                  setUserSearchResults([]);
                  setAddFriendStatus(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search by name, handle (@username), or email..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 transition"
                autoFocus
              />
            </div>

            {addFriendStatus && (
              <p className="text-xs text-emerald-400">{addFriendStatus}</p>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2">
              {isSearchingUsers ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                </div>
              ) : userSearchResults.length > 0 ? (
                userSearchResults.map((u) => {
                  const isSent = sentRequestIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">@{u.username}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendFriendRequest(u.id)}
                        disabled={isSent}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 px-3 py-1.5 text-xs font-semibold text-white transition shrink-0"
                      >
                        {isSent ? "Sent" : "Add Friend"}
                      </button>
                    </div>
                  );
                })
              ) : userSearchQuery.trim() ? (
                <p className="text-center text-xs text-zinc-500 py-4">No users found</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Instant Video Meeting Launcher */}
      <CreatePublicMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
      />
    </div>
  );
}
