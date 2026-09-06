import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  Users, 
  Plus, 
  Video, 
  Send, 
  Search, 
  Info, 
  Check, 
  Loader2, 
  Sparkles,
  UserPlus,
  Trash2,
  LogOut,
  ShieldCheck,
  Crown,
  X
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch("http://localhost:5000/api/personal/conversations", {
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
      const res = await fetch(`http://localhost:5000/api/personal/conversations/${group.id}/messages`, {
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load group messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    try {
      setIsSending(true);
      const res = await fetch(`http://localhost:5000/api/personal/conversations/${selectedGroup.id}/messages`, {
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
      const res = await fetch("http://localhost:5000/api/friends", {
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
      const res = await fetch("http://localhost:5000/api/personal/groups", {
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
      const res = await fetch(`http://localhost:5000/api/personal/groups/${selectedGroup.id}/details`, {
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
      const res = await fetch(`http://localhost:5000/api/personal/groups/${selectedGroup.id}/participants`, {
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
        `http://localhost:5000/api/personal/groups/${selectedGroup.id}/participants/${targetUserId}`,
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
      const res = await fetch(`http://localhost:5000/api/personal/groups/${selectedGroup.id}`, {
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
    <div className="flex h-[750px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#121215] shadow-2xl">
      {/* Left Column: Personal Groups */}
      <div className="flex w-72 flex-col border-r border-zinc-800 bg-zinc-950/60 shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-400" /> Groups ({groups.length})
          </h3>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-500 px-2.5 py-1 text-xs font-semibold text-white transition shadow-sm"
            title="Create Group"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingGroups ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : groups.length === 0 ? (
            <div className="py-12 text-center p-4">
              <Users className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-xs font-medium text-zinc-400">No personal groups</p>
              <p className="text-[11px] text-zinc-500 mt-1">Create a group to collaborate and start video calls with friends.</p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-3 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
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
                  className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${
                    isSelected
                      ? "bg-zinc-800 text-white shadow-sm ring-1 ring-purple-500/30"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/60 to-indigo-950/60 border border-purple-800/40 text-sm font-bold text-purple-300 shrink-0">
                    {g.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-white truncate">{g.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">
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
      <div className="flex flex-1 flex-col bg-[#121215]">
        {selectedGroup ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3.5 bg-zinc-950/40">
              <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={handleOpenGroupInfo}>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/60 to-indigo-950/60 border border-purple-800/40 text-sm font-bold text-purple-300 shrink-0">
                  {selectedGroup.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                    {selectedGroup.name}
                    <Info className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300" />
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {selectedGroup.memberCount} member{selectedGroup.memberCount === 1 ? "" : "s"} • Click for details
                  </p>
                </div>
              </div>

              {/* Start Group Meeting */}
              <button
                type="button"
                onClick={() => setIsMeetingModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-950/50 transition"
              >
                <Video className="h-4 w-4" />
                <span>Start Group Meeting</span>
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-2 text-zinc-500">
                  <Users className="h-10 w-10 text-zinc-600" />
                  <p className="text-xs font-medium text-zinc-400">Welcome to {selectedGroup.name}!</p>
                  <p className="text-[11px] text-zinc-600 max-w-xs">
                    Start a conversation or invite group members to a group video conference.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  const isSystem = msg.messageType === "SYSTEM";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] text-zinc-400">
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
                        {!isMe && (
                          <p className="text-[10px] text-zinc-400 font-semibold">{msg.senderName}</p>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isMe
                              ? "bg-purple-600 text-white shadow-md rounded-tr-none"
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

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="border-t border-zinc-800 p-4 bg-zinc-950/60">
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message #${selectedGroup.name}...`}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white transition hover:bg-purple-500 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
            <Users className="h-12 w-12 text-zinc-700" />
            <h3 className="text-base font-semibold text-white">Your Personal Groups</h3>
            <p className="text-xs max-w-sm text-zinc-400">
              Select a group to chat and start video calls, or create a new group with friends.
            </p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" /> Create Personal Group
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Weekend Hackers, Study Circle"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Topic / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={newGroupTopic}
                  onChange={(e) => setNewGroupTopic(e.target.value)}
                  placeholder="What is this group about?"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-white outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Add Friends ({selectedFriendIds.length} selected)
                </label>
                {friends.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">No friends found. You can add members later.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-zinc-800/80 rounded-2xl bg-zinc-900/40 p-2">
                    {friends.map((f) => {
                      const isChecked = selectedFriendIds.includes(f.id);
                      return (
                        <label
                          key={f.id}
                          className="flex items-center justify-between rounded-xl p-2 text-xs hover:bg-zinc-800/60 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={f.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}`}
                              alt={f.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="text-white font-medium truncate">{f.name}</span>
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
                            className="h-4 w-4 rounded accent-purple-600"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGroup || !newGroupName.trim()}
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-950 border border-purple-800 text-purple-300 font-bold text-xs">
                  {selectedGroup?.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedGroup?.name}</h3>
                  <p className="text-[11px] text-zinc-400">Group Information & Members</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupInfoOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : groupDetails ? (
              <div className="space-y-4">
                {groupDetails.conversation.topic && (
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-xs text-zinc-300">
                    <p className="font-semibold text-zinc-400 mb-0.5">Topic</p>
                    <p>{groupDetails.conversation.topic}</p>
                  </div>
                )}

                {/* Member Roster */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Members ({groupDetails.members.length})
                  </h4>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {groupDetails.members.map((m: any) => {
                      const isMe = m.userId === user?.id;
                      return (
                        <div
                          key={m.userId}
                          className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                              alt={m.name}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">
                                {m.name} {isMe ? "(You)" : ""}
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate">@{m.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                              {m.groupRole}
                            </span>
                            {groupDetails.isCallerAdmin && !m.isCreator && !isMe && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.userId)}
                                className="text-zinc-500 hover:text-rose-400 text-xs"
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
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Add Friends
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 border border-zinc-800/80 rounded-2xl bg-zinc-900/40 p-2">
                      {groupDetails.availableCandidates.map((c: any) => (
                        <div key={c.user_id} className="flex items-center justify-between p-1 text-xs">
                          <span className="text-zinc-200 font-medium">{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleAddMember(c.user_id)}
                            className="rounded-lg bg-purple-600 hover:bg-purple-500 px-2.5 py-1 text-[11px] font-semibold text-white transition"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Controls: Leave or Delete */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(user?.id || "")}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-400 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Leave Group
                  </button>

                  {groupDetails.canDeleteGroup && (
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white transition"
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
