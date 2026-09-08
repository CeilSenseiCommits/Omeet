import { API_BASE_URL } from "../../lib/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Users, 
  UserPlus, 
  Video, 
  Send, 
  Search, 
  MessageSquare, 
  ExternalLink, 
  Loader2,
  X,
  ArrowUp
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
  seq?: number;
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
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Add Friend Modal
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [addFriendStatus, setAddFriendStatus] = useState<string | null>(null);

  // Meeting modal for "Invite to Meet"
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const targetFriendId = searchParams.get("friendId");

  // Load Friends
  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingFriends(true);
      const res = await fetch(`${API_BASE_URL}/api/friends`, {
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const data = await res.json();
        const friendList = data.friends || [];
        setFriends(friendList);
        if (friendList.length > 0) {
          const matched = targetFriendId ? friendList.find((f: Friend) => f.id === targetFriendId) : null;
          if (matched) {
            handleSelectFriend(matched);
          } else if (!selectedFriend) {
            handleSelectFriend(friendList[0]);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load friends:", err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [user?.id, targetFriendId]);

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
      const convRes = await fetch(`${API_BASE_URL}/api/friends/chat/${friend.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
      });
      if (!convRes.ok) throw new Error("Failed to start chat.");
      const convData = await convRes.json();
      const convId = convData.conversationId;
      setActiveConvId(convId);

      // 2. Load latest 20 messages for this conversation
      const msgRes = await fetch(`${API_BASE_URL}/api/personal/conversations/${convId}/messages?limit=20`, {
        headers: { "x-user-id": user.id },
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
        setHasMore(Boolean(msgData.hasMore));
        setTimeout(() => scrollToBottom(false), 50);
      }
    } catch (err) {
      console.error("Failed to select friend:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load older messages (paginating backwards)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !activeConvId || messages.length === 0 || !user?.id) return;
    const oldestSeq = messages[0]?.seq;
    if (oldestSeq === undefined || oldestSeq === null) return;

    const container = scrollContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    try {
      setIsLoadingMore(true);
      const res = await fetch(
        `${API_BASE_URL}/api/personal/conversations/${activeConvId}/messages?limit=20&before_seq=${oldestSeq}`,
        {
          headers: { "x-user-id": user.id },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const olderMessages: Message[] = data.messages || [];
        setHasMore(Boolean(data.hasMore));

        if (olderMessages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const filteredOlder = olderMessages.filter((m) => !existingIds.has(m.id));
            return [...filteredOlder, ...prev];
          });

          // Preserve scroll position
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = prevScrollTop + (container.scrollHeight - prevScrollHeight);
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Polling for incoming delta messages without wiping older history
  useEffect(() => {
    if (!activeConvId || !user?.id) return;
    const interval = setInterval(async () => {
      const currentList = messagesRef.current;
      const maxSeq = currentList.reduce((max, m) => (m.seq && m.seq > max ? m.seq : max), 0);
      if (maxSeq === 0) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/personal/conversations/${activeConvId}/messages?since_seq=${maxSeq}`,
          { headers: { "x-user-id": user.id } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMsgs = data.messages.filter((m: Message) => !existingIds.has(m.id));
              if (newMsgs.length === 0) return prev;
              return [...prev, ...newMsgs];
            });
            setTimeout(() => scrollToBottom(true), 50);
          }
        }
      } catch {}
    }, 3500);
    return () => clearInterval(interval);
  }, [activeConvId, user?.id]);

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
    setTimeout(() => scrollToBottom(true), 50);

    try {
      setIsSending(true);
      const res = await fetch(`${API_BASE_URL}/api/personal/conversations/${activeConvId}/messages`, {
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
          `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(userSearchQuery.trim())}&currentUserId=${user?.id || ""}`
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
      const res = await fetch(`${API_BASE_URL}/api/friends/request`, {
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
    <div className="flex h-[680px] overflow-hidden rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] shadow-xs">
      {/* Left Column: Friends Roster */}
      <div className="flex w-68 flex-col border-r border-[#D8D4CB] bg-white shrink-0">
        {/* Header */}
        <div className="p-3.5 border-b border-[#D8D4CB] space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#242427] flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#4963C8]" />
              <span>Friends ({friends.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddFriendOpen(true)}
              className="flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-2 py-1 text-[11px] font-medium text-white transition-colors"
              title="Add Friend"
            >
              <UserPlus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E7C77]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search friends..."
              className="w-full rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] pl-8 pr-2.5 py-1 text-xs text-[#242427] placeholder:text-[#A6A49F] outline-none focus:border-[#4963C8] transition-colors"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {isLoadingFriends ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-[#7E7C77]" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-10 text-center p-4">
              <Users className="mx-auto h-6 w-6 text-[#A6A49F] mb-1.5" />
              <p className="text-xs font-medium text-[#242427]">No friends yet</p>
              <p className="text-[11px] text-[#7E7C77] mt-0.5">Connect with team members to chat.</p>
              <button
                type="button"
                onClick={() => setIsAddFriendOpen(true)}
                className="mt-2.5 rounded-[5px] border border-[#D8D4CB] bg-white px-2.5 py-1 text-xs font-medium text-[#242427] hover:bg-[#EFECE4] transition-colors"
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
                  className={`flex w-full items-center gap-2.5 rounded-[5px] p-2 text-left transition-colors ${
                    isSelected
                      ? "border border-[#CBD5E1] bg-[#EEF2FF] text-[#242427]"
                      : "border border-transparent hover:border-[#D8D4CB] hover:bg-[#FAF9F6] text-[#585754]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={f.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}`}
                      alt={f.name}
                      className="h-8 w-8 rounded-[5px] object-cover border border-[#D8D4CB]"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-[#242427] truncate">{f.name}</p>
                    <p className="text-[10px] text-[#7E7C77] truncate">
                      @{f.username} {f.primaryAffiliation ? `· ${f.primaryAffiliation.name}` : ""}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center/Right: Personal Chat Screen */}
      <div className="flex flex-1 flex-col bg-[#FAF9F6]">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-[#D8D4CB] px-5 py-3 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={selectedFriend.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFriend.name)}`}
                  alt={selectedFriend.name}
                  className="h-8 w-8 rounded-[5px] object-cover border border-[#D8D4CB]"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-[#242427] truncate">{selectedFriend.name}</h3>
                    <Link
                      to={`/profile/${selectedFriend.id}`}
                      className="text-[#7E7C77] hover:text-[#4963C8]"
                      title="View public profile"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="text-[10px] text-[#7E7C77] font-medium">
                    Personal Space · @{selectedFriend.username}
                  </p>
                </div>
              </div>

              {/* Start Video Meeting Action */}
              <button
                type="button"
                onClick={() => setIsMeetingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors shadow-xs"
              >
                <Video className="h-3.5 w-3.5" />
                <span>Invite to Meet</span>
              </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto p-5 space-y-3">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#7E7C77]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-1.5 text-[#7E7C77]">
                  <MessageSquare className="h-8 w-8 text-[#A6A49F]" />
                  <p className="text-xs font-medium text-[#242427]">
                    Direct conversation with {selectedFriend.name}.
                  </p>
                  <p className="text-[11px] max-w-xs text-[#7E7C77]">
                    Send a message or invite them to a video meeting.
                  </p>
                </div>
              ) : (
                <>
                  {/* See More Messages Button */}
                  {hasMore && (
                    <div className="flex justify-center py-1">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#D8D4CB] bg-white px-3.5 py-1 text-xs font-semibold text-[#585754] shadow-2xs hover:bg-[#F3EFE6] hover:text-[#242427] hover:border-[#4963C8] transition disabled:opacity-50 cursor-pointer"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4963C8]" />
                            <span>Loading older messages...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp className="h-3.5 w-3.5 text-[#4963C8]" />
                            <span>See more messages</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  const time = new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <img
                        src={
                          msg.senderAvatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || "U")}`
                        }
                        alt={msg.senderName}
                        className="h-7 w-7 rounded-[5px] object-cover shrink-0 border border-[#D8D4CB]"
                      />

                      <div className="space-y-0.5">
                        <div
                          className={`rounded-[5px] px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? "bg-[#4963C8] text-white"
                              : "border border-[#D8D4CB] bg-white text-[#242427]"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <p className={`text-[10px] text-[#7E7C77] ${isMe ? "text-right" : ""}`}>{time}</p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="border-t border-[#D8D4CB] p-3 bg-white">
              <div className="flex items-center gap-2 rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] px-3 py-1.5 focus-within:border-[#4963C8]">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message @${selectedFriend.username}...`}
                  className="flex-1 bg-transparent text-xs text-[#242427] placeholder:text-[#A6A49F] outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#4963C8] text-white transition hover:bg-[#3E56B5] disabled:opacity-40"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#7E7C77] space-y-2">
            <Users className="h-10 w-10 text-[#A6A49F]" />
            <h3 className="text-sm font-semibold text-[#242427]">Personal People Space</h3>
            <p className="text-xs max-w-sm text-[#7E7C77]">
              Select a friend from the left sidebar to start chatting, or add new friends across OMeet.
            </p>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {isAddFriendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-[8px] border border-[#383D47] bg-[#1D2026] p-5 shadow-2xl space-y-3.5 text-[#F3F3EE]">
            <div className="flex items-center justify-between border-b border-[#383D47] pb-3">
              <h3 className="text-xs font-bold text-[#F3F3EE] flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-[#8FA0EB]" />
                <span>Add Friend</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddFriendOpen(false);
                  setUserSearchQuery("");
                  setUserSearchResults([]);
                  setAddFriendStatus(null);
                }}
                className="text-[#A9ACB4] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#717684]" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search by name, handle (@username), or email..."
                className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] pl-8 pr-3 py-1.5 text-xs text-[#F3F3EE] placeholder:text-[#717684] outline-none focus:border-[#4963C8] transition-colors"
                autoFocus
              />
            </div>

            {addFriendStatus && (
              <p className="text-xs text-[#8FA0EB]">{addFriendStatus}</p>
            )}

            <div className="max-h-56 overflow-y-auto space-y-1.5">
              {isSearchingUsers ? (
                <div className="flex items-center justify-center py-5">
                  <Loader2 className="h-4 w-4 animate-spin text-[#717684]" />
                </div>
              ) : userSearchResults.length > 0 ? (
                userSearchResults.map((u) => {
                  const isSent = sentRequestIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-[5px] border border-[#383D47] bg-[#252932] p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="h-7 w-7 rounded-[4px] object-cover shrink-0 border border-[#383D47]"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#F3F3EE] truncate">{u.name}</p>
                          <p className="text-[10px] text-[#A9ACB4] truncate">@{u.username}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendFriendRequest(u.id)}
                        disabled={isSent}
                        className="flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] disabled:bg-[#383D47] disabled:text-[#717684] px-2.5 py-1 text-[11px] font-medium text-white transition-colors shrink-0"
                      >
                        {isSent ? "Sent" : "Add Friend"}
                      </button>
                    </div>
                  );
                })
              ) : userSearchQuery.trim() ? (
                <p className="text-center text-xs text-[#717684] py-3">No users found</p>
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
