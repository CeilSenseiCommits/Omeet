import { API_BASE_URL } from "../../lib/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  Users, 
  Plus, 
  Video, 
  Send, 
  Info, 
  Loader2, 
  Trash2,
  LogOut,
  X,
  ArrowUp
} from "lucide-react";
import CreatePublicMeetingModal from "../CreatePublicMeetingModal";

interface PersonalGroup {
  id: string;
  name: string;
  topic?: string;
  memberCount: number;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
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

export default function HomeGroupsView() {
  const { user } = useAuth();

  // Groups list
  const [groups, setGroups] = useState<PersonalGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PersonalGroup | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  // Group messages
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

  // Group info & member management modal
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [groupDetails, setGroupDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Create Group Modal
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTopic, setNewGroupTopic] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Meeting modal for "Start Group Meeting"
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // Fetch user's personal groups
  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingGroups(true);
      const res = await fetch(`${API_BASE_URL}/api/personal/conversations`, {
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        if (data.groups && data.groups.length > 0 && !selectedGroup) {
          handleSelectGroup(data.groups[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to load personal groups:", err);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Select group & fetch messages
  const handleSelectGroup = async (group: PersonalGroup) => {
    if (!user?.id) return;
    setSelectedGroup(group);
    setIsLoadingMessages(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/personal/conversations/${group.id}/messages?limit=20`, {
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setHasMore(Boolean(data.hasMore));
        setTimeout(() => scrollToBottom(false), 50);
      }
    } catch (err) {
      console.error("Failed to load group messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load older messages (paginating backwards)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !selectedGroup || messages.length === 0 || !user?.id) return;
    const oldestSeq = messages[0]?.seq;
    if (oldestSeq === undefined || oldestSeq === null) return;

    const container = scrollContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    try {
      setIsLoadingMore(true);
      const res = await fetch(
        `${API_BASE_URL}/api/personal/conversations/${selectedGroup.id}/messages?limit=20&before_seq=${oldestSeq}`,
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

          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = prevScrollTop + (container.scrollHeight - prevScrollHeight);
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to load older group messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Delta polling for incoming group messages
  useEffect(() => {
    if (!selectedGroup || !user?.id) return;
    const interval = setInterval(async () => {
      const currentList = messagesRef.current;
      const maxSeq = currentList.reduce((max, m) => (m.seq && m.seq > max ? m.seq : max), 0);
      if (maxSeq === 0) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/personal/conversations/${selectedGroup.id}/messages?since_seq=${maxSeq}`,
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
  }, [selectedGroup, user?.id]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedGroup || !user?.id) return;

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: selectedGroup.id,
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
      const res = await fetch(`${API_BASE_URL}/api/personal/conversations/${selectedGroup.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ content: textToSend, messageType: "TEXT" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data.message : m)));
      }
    } catch (err) {
      console.error("Failed to post group message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Open Create Group Modal (load user's friends)
  const handleOpenCreateModal = async () => {
    if (!user?.id) return;
    setIsCreateGroupOpen(true);
    setNewGroupName("");
    setNewGroupTopic("");
    setSelectedFriendIds([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends`, {
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch {}
  };

  // Submit Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user?.id) return;

    try {
      setIsCreatingGroup(true);
      const res = await fetch(`${API_BASE_URL}/api/personal/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({
          name: newGroupName.trim(),
          topic: newGroupTopic.trim(),
          memberUserIds: selectedFriendIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsCreateGroupOpen(false);
        fetchGroups();
        if (data.group) {
          handleSelectGroup({
            id: data.group.id,
            name: data.group.name,
            topic: data.group.topic,
            memberCount: selectedFriendIds.length + 1,
            unreadCount: 0,
          });
        }
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Fetch Group Details (for Group Info modal)
  const handleOpenGroupInfo = async () => {
    if (!selectedGroup || !user?.id) return;
    setIsGroupInfoOpen(true);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/personal/groups/${selectedGroup.id}/details`, {
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setGroupDetails(data);
      }
    } catch (err) {
      console.error("Failed to load group details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Add Member to Group
  const handleAddMember = async (targetUserId: string) => {
    if (!selectedGroup || !user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/personal/groups/${selectedGroup.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        handleOpenGroupInfo();
        handleSelectGroup(selectedGroup);
      }
    } catch {}
  };

  // Remove Member or Leave
  const handleRemoveMember = async (targetUserId: string) => {
    if (!selectedGroup || !user?.id) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/personal/groups/${selectedGroup.id}/participants/${targetUserId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": user.id },
        }
      );
      if (res.ok) {
        if (targetUserId === user.id) {
          setIsGroupInfoOpen(false);
          setSelectedGroup(null);
          fetchGroups();
        } else {
          handleOpenGroupInfo();
        }
      }
    } catch {}
  };

  // Delete Group
  const handleDeleteGroup = async () => {
    if (!selectedGroup || !user?.id) return;
    if (!confirm(`Are you sure you want to delete "${selectedGroup.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/personal/groups/${selectedGroup.id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        setIsGroupInfoOpen(false);
        setSelectedGroup(null);
        fetchGroups();
      }
    } catch {}
  };

  return (
    <div className="flex h-[680px] overflow-hidden rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] shadow-xs">
      {/* Left Column: Personal Groups */}
      <div className="flex w-68 flex-col border-r border-[#D8D4CB] bg-white shrink-0">
        {/* Header */}
        <div className="p-3.5 border-b border-[#D8D4CB] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#242427] flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#4963C8]" />
            <span>Groups ({groups.length})</span>
          </h3>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-2 py-1 text-[11px] font-medium text-white transition-colors"
            title="Create Group"
          >
            <Plus className="h-3 w-3" />
            <span>New</span>
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {isLoadingGroups ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-[#7E7C77]" />
            </div>
          ) : groups.length === 0 ? (
            <div className="py-10 text-center p-4">
              <Users className="mx-auto h-6 w-6 text-[#A6A49F] mb-1.5" />
              <p className="text-xs font-medium text-[#242427]">No personal groups</p>
              <p className="text-[11px] text-[#7E7C77] mt-0.5">Create a group to collaborate and start video calls with friends.</p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-2.5 rounded-[5px] border border-[#D8D4CB] bg-white px-2.5 py-1 text-xs font-medium text-[#242427] hover:bg-[#EFECE4] transition-colors"
              >
                Create Group
              </button>
            </div>
          ) : (
            groups.map((g) => {
              const isSelected = selectedGroup?.id === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleSelectGroup(g)}
                  className={`flex w-full items-center gap-2.5 rounded-[5px] p-2 text-left transition-colors ${
                    isSelected
                      ? "border border-[#CBD5E1] bg-[#EEF2FF] text-[#242427]"
                      : "border border-transparent hover:border-[#D8D4CB] hover:bg-[#FAF9F6] text-[#585754]"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] text-xs font-bold text-[#242427] shrink-0">
                    {g.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-[#242427] truncate">{g.name}</p>
                    <p className="text-[10px] text-[#7E7C77] truncate">
                      {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center/Right: Group Chat Area */}
      <div className="flex flex-1 flex-col bg-[#FAF9F6]">
        {selectedGroup ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#D8D4CB] px-5 py-3 bg-white">
              <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={handleOpenGroupInfo}>
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] text-xs font-bold text-[#242427] shrink-0">
                  {selectedGroup.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#242427] truncate flex items-center gap-1.5">
                    {selectedGroup.name}
                    <Info className="h-3 w-3 text-[#7E7C77] hover:text-[#4963C8]" />
                  </h3>
                  <p className="text-[10px] text-[#7E7C77]">
                    {selectedGroup.memberCount} member{selectedGroup.memberCount === 1 ? "" : "s"} · Click for details
                  </p>
                </div>
              </div>

              {/* Start Group Meeting */}
              <button
                type="button"
                onClick={() => setIsMeetingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors shadow-xs"
              >
                <Video className="h-3.5 w-3.5" />
                <span>Start Group Meeting</span>
              </button>
            </div>

            {/* Messages Stream */}
            <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto p-5 space-y-3">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#7E7C77]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-1.5 text-[#7E7C77]">
                  <Users className="h-8 w-8 text-[#A6A49F]" />
                  <p className="text-xs font-medium text-[#242427]">Welcome to {selectedGroup.name}!</p>
                  <p className="text-[11px] text-[#7E7C77] max-w-xs">
                    Start a conversation or invite group members to a group video conference.
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
                  const isSystem = msg.messageType === "SYSTEM";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <span className="rounded-[3px] border border-[#D8D4CB] bg-white px-2.5 py-0.5 text-[10px] text-[#585754]">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

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
                        {!isMe && (
                          <p className="text-[10px] text-[#7E7C77] font-medium">{msg.senderName}</p>
                        )}
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

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="border-t border-[#D8D4CB] p-3 bg-white">
              <div className="flex items-center gap-2 rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] px-3 py-1.5 focus-within:border-[#4963C8]">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message #${selectedGroup.name}...`}
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
            <h3 className="text-sm font-semibold text-[#242427]">Personal Groups</h3>
            <p className="text-xs max-w-sm text-[#7E7C77]">
              Select a group to chat and start video calls, or create a new group with friends.
            </p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-[8px] border border-[#383D47] bg-[#1D2026] p-5 shadow-2xl space-y-3.5 text-[#F3F3EE]">
            <div className="flex items-center justify-between border-b border-[#383D47] pb-3">
              <h3 className="text-xs font-bold text-[#F3F3EE] flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#8FA0EB]" />
                <span>Create Personal Group</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="text-[#A9ACB4] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Platform Engineers, Project Alpha"
                  className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] px-3 py-1.5 text-xs text-[#F3F3EE] outline-none focus:border-[#4963C8] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1">
                  Topic / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={newGroupTopic}
                  onChange={(e) => setNewGroupTopic(e.target.value)}
                  placeholder="What is this group about?"
                  className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] px-3 py-1.5 text-xs text-[#F3F3EE] outline-none focus:border-[#4963C8] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1">
                  Add Friends ({selectedFriendIds.length} selected)
                </label>
                {friends.length === 0 ? (
                  <p className="text-xs text-[#717684] py-1.5">No friends found. You can add members later.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1 border border-[#383D47] rounded-[5px] bg-[#252932] p-2">
                    {friends.map((f) => {
                      const isChecked = selectedFriendIds.includes(f.id);
                      return (
                        <label
                          key={f.id}
                          className="flex items-center justify-between rounded-[4px] p-1.5 text-xs hover:bg-[#2C3039] cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={f.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}`}
                              alt={f.name}
                              className="h-5 w-5 rounded-[3px] object-cover"
                            />
                            <span className="text-[#F3F3EE] font-medium truncate">{f.name}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFriendIds((prev) => [...prev, f.id]);
                              } else {
                                setSelectedFriendIds((prev) => prev.filter((id) => id !== f.id));
                              }
                            }}
                            className="h-3.5 w-3.5 rounded accent-[#4963C8]"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#383D47]">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="rounded-[5px] border border-[#383D47] bg-transparent px-3 py-1.5 text-xs font-medium text-[#A9ACB4] hover:bg-[#252932]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGroup || !newGroupName.trim()}
                  className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
                >
                  {isCreatingGroup ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Info & Roster Modal */}
      {isGroupInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-[8px] border border-[#383D47] bg-[#1D2026] p-5 shadow-2xl space-y-4 text-[#F3F3EE]">
            <div className="flex items-center justify-between border-b border-[#383D47] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#383D47] bg-[#252932] text-[#F3F3EE] font-bold text-xs">
                  {selectedGroup?.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#F3F3EE]">{selectedGroup?.name}</h3>
                  <p className="text-[10px] text-[#A9ACB4]">Group Information & Members</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupInfoOpen(false)}
                className="text-[#A9ACB4] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-[#717684]" />
              </div>
            ) : groupDetails ? (
              <div className="space-y-3.5">
                {groupDetails.conversation.topic && (
                  <div className="rounded-[5px] border border-[#383D47] bg-[#252932] p-2.5 text-xs text-[#CBD5E1]">
                    <p className="text-[10px] font-semibold text-[#A9ACB4] uppercase tracking-wider mb-0.5">Topic</p>
                    <p>{groupDetails.conversation.topic}</p>
                  </div>
                )}

                {/* Member Roster */}
                <div>
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1.5">
                    Members ({groupDetails.members.length})
                  </h4>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {groupDetails.members.map((m: any) => {
                      const isMe = m.userId === user?.id;
                      return (
                        <div
                          key={m.userId}
                          className="flex items-center justify-between rounded-[5px] border border-[#383D47] bg-[#252932] p-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                              alt={m.name}
                              className="h-6 w-6 rounded-[3px] object-cover"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-[#F3F3EE] truncate">
                                {m.name} {isMe ? "(You)" : ""}
                              </p>
                              <p className="text-[10px] text-[#A9ACB4] truncate">@{m.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-[3px] border border-[#383D47] bg-[#2C3039] px-1.5 py-0.5 text-[10px] font-medium text-[#CBD5E1]">
                              {m.groupRole}
                            </span>
                            {groupDetails.isCallerAdmin && !m.isCreator && !isMe && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.userId)}
                                className="text-[#A9ACB4] hover:text-[#B44A4A] text-xs transition-colors"
                                title="Remove member"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Friends to Group */}
                {groupDetails.isCallerAdmin && groupDetails.availableCandidates.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1.5">
                      Add Friends
                    </h4>
                    <div className="max-h-28 overflow-y-auto space-y-1 border border-[#383D47] rounded-[5px] bg-[#252932] p-2">
                      {groupDetails.availableCandidates.map((c: any) => (
                        <div key={c.user_id} className="flex items-center justify-between p-1 text-xs">
                          <span className="text-[#F3F3EE] font-medium">{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleAddMember(c.user_id)}
                            className="rounded-[4px] bg-[#4963C8] hover:bg-[#3E56B5] px-2 py-0.5 text-[11px] font-medium text-white transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Controls: Leave or Delete */}
                <div className="flex items-center justify-between pt-3 border-t border-[#383D47]">
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(user?.id || "")}
                    className="flex items-center gap-1.5 text-xs text-[#A9ACB4] hover:text-[#B44A4A] transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Leave Group
                  </button>

                  {groupDetails.canDeleteGroup && (
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      className="flex items-center gap-1.5 rounded-[5px] bg-[#B44A4A] hover:bg-[#9E3D3D] px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Group
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      <CreatePublicMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
      />
    </div>
  );
}
