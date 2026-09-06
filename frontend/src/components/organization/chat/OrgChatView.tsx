import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { 
  X, 
  Send, 
  Video, 
  User, 
  Users, 
  Hash, 
  Loader2, 
  Sparkles,
  Paperclip,
  Smile,
  ArrowDown,
  Info
} from "lucide-react";
import GroupInfoModal from "./GroupInfoModal";

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarUrl?: string;
  senderPosition?: string;
  content: string;
  messageType: string;
  attachments: any[];
  isEdited: boolean;
  createdAt: string;
}

interface ConversationDetails {
  id: string;
  type: "CHANNEL" | "GROUP" | "DIRECT";
  name?: string;
  topic?: string;
  isPrivate?: boolean;
  participantCount?: number;
}

interface RecipientProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
}

interface OrgChatViewProps {
  organizationId: string;
  conversationId: string;
  onClose: () => void;
  onViewProfile?: (recipient: any) => void;
  onStartMeeting?: (recipientOrGroup?: any) => void;
  onGroupDeleted?: () => void;
}

function formatMessageTime(isoDate: string) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDayDivider(isoDate: string) {
  try {
    const d = new Date(isoDate);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function getInitials(name: string) {
  return (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function OrgChatView({
  organizationId,
  conversationId,
  onClose,
  onViewProfile,
  onStartMeeting,
  onGroupDeleted,
}: OrgChatViewProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [recipient, setRecipient] = useState<RecipientProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  // Fetch conversation messages
  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!conversationId || !organizationId) return;

    try {
      if (isInitial) setIsLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/conversations/${conversationId}/messages?userId=${user?.id || ""}`,
        {
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        setRecipient(data.recipient);
        setMessages(data.messages || []);
        if (isInitial) {
          setTimeout(() => scrollToBottom(false), 100);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [conversationId, organizationId, user?.id, scrollToBottom]);

  // Initial load
  useEffect(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  // Polling every 3.5s for real-time messages while view is active
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Keyboard shortcut Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Track scroll position to show "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !user?.id) return;

    // Optimistic UI insertion
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: user.id,
      senderName: user.name || "You",
      senderUsername: user.username || "you",
      senderAvatarUrl: user.avatarUrl,
      content: trimmed,
      messageType: "TEXT",
      attachments: [],
      isEdited: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    setTimeout(() => scrollToBottom(true), 50);

    try {
      setIsSending(true);
      const res = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            userId: user.id,
            content: trimmed,
            messageType: "TEXT",
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Replace optimistic message with real saved message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isDirect = conversation?.type === "DIRECT";
  const title = isDirect 
    ? (recipient?.name || "Direct Message") 
    : (conversation?.name || "Team Chat");

  const handleStartMeetingClick = async () => {
    if (isDirect && recipient) {
      onStartMeeting?.({
        initialType: "DIRECT",
        initialParticipants: [
          {
            id: recipient.id,
            name: recipient.name,
            username: recipient.username,
            avatarUrl: recipient.avatarUrl,
            position: recipient.position,
            department: recipient.department,
          },
        ],
        initialTitle: `1:1 Sync with ${recipient.name}`,
        conversationId,
      });
    } else {
      try {
        const res = await fetch(
          `http://localhost:5000/api/organizations/${organizationId}/conversations/${conversationId}/details?userId=${user?.id || ""}`,
          { headers: { "x-user-id": user?.id || "" } }
        );
        if (res.ok) {
          const d = await res.json();
          const groupParticipants = (d.members || [])
            .filter((m: any) => m.userId !== user?.id)
            .map((m: any) => ({
              id: m.userId,
              name: m.name,
              username: m.username,
              avatarUrl: m.avatarUrl,
              position: m.position,
              department: m.department,
            }));

          onStartMeeting?.({
            initialType: "GROUP",
            initialParticipants: groupParticipants,
            initialTitle: `${conversation?.name || "Team"} Huddle`,
            conversationId,
          });
        } else {
          onStartMeeting?.({
            initialType: "GROUP",
            initialParticipants: [],
            initialTitle: `${conversation?.name || "Team"} Huddle`,
            conversationId,
          });
        }
      } catch {
        onStartMeeting?.({
          initialType: "GROUP",
          initialParticipants: [],
          initialTitle: `${conversation?.name || "Team"} Huddle`,
          conversationId,
        });
      }
    }
  };

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800/60 bg-[#111113]">
      {/* 1. Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/60 bg-zinc-900/40 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3.5 min-w-0">
          {isDirect ? (
            <div className="relative shrink-0">
              <img
                src={
                  recipient?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient?.name || "User")}&background=2563eb&color=ffffff`
                }
                alt={title}
                className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
              />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111113] bg-emerald-500" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsGroupInfoModalOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-950/80 border border-fuchsia-800/60 text-fuchsia-300 hover:bg-fuchsia-900/80 hover:border-fuchsia-600 hover:text-white transition shadow-sm cursor-pointer group"
              title="View group info & manage members"
            >
              {conversation?.type === "CHANNEL" ? (
                <Hash className="h-5 w-5 transition group-hover:scale-105" />
              ) : (
                <Users className="h-5 w-5 transition group-hover:scale-105" />
              )}
            </button>
          )}

          <div 
            className={`min-w-0 ${!isDirect ? "cursor-pointer group select-none" : ""}`}
            onClick={() => {
              if (!isDirect) setIsGroupInfoModalOpen(true);
            }}
            title={!isDirect ? "Click to view group info & manage members" : undefined}
          >
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-semibold text-white truncate ${!isDirect ? "group-hover:text-fuchsia-300 transition" : ""}`}>
                {!isDirect && conversation?.type === "CHANNEL" ? `# ${title}` : title}
              </h2>
              {isDirect && recipient?.username && (
                <span className="text-xs text-zinc-400 truncate">@{recipient.username}</span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate">
              {isDirect
                ? `${recipient?.position || "Member"} · ${recipient?.department || "General Team"}`
                : conversation?.topic || `${conversation?.participantCount || 0} members · Click for details`}
            </p>
          </div>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Meeting trigger */}
          <button
            type="button"
            onClick={handleStartMeetingClick}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/70 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white transition shadow-sm"
            title={isDirect ? "Start 1-on-1 Meeting" : "Start Team Huddle"}
          >
            <Video className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {isDirect ? "Meet Now" : "Huddle"}
            </span>
          </button>

          {/* Group details & members button */}
          {!isDirect && (
            <button
              type="button"
              onClick={() => setIsGroupInfoModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:text-white px-3 py-1.5 text-xs font-medium text-zinc-300 transition shadow-sm"
              title="Group info & members"
            >
              <Info className="h-3.5 w-3.5 text-fuchsia-400" />
              <span className="hidden sm:inline">Info</span>
            </button>
          )}

          {/* Direct message profile shortcut */}
          {isDirect && recipient && onViewProfile && (
            <button
              type="button"
              onClick={() => onViewProfile(recipient)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
              title="View organization profile"
            >
              <User className="h-3.5 w-3.5 text-fuchsia-400" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            title="Close chat (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. Chat Timeline Body */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-fuchsia-500" />
          </div>
        ) : (
          <>
            {/* Start of conversation hero banner */}
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-6 text-center max-w-lg mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-950/60 border border-fuchsia-800/50 text-fuchsia-400 mb-3">
                {isDirect ? <User className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
              </div>
              <h3 className="text-base font-semibold text-white">
                {isDirect ? `Chat with ${recipient?.name || "Colleague"}` : `Welcome to #${conversation?.name}`}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {isDirect
                  ? `This is the direct conversation history between you and @${recipient?.username || "colleague"}. Messages are encrypted and stored within your organization.`
                  : conversation?.topic || "Collaborate, share updates, and sync with your team members."}
              </p>
            </div>

            {/* Messages Stream */}
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              const showDateDivider =
                !prevMsg || formatDayDivider(prevMsg.createdAt) !== formatDayDivider(msg.createdAt);
              const isMe = msg.senderId === user?.id;

              return (
                <div key={msg.id} className="space-y-4">
                  {showDateDivider && (
                    <div className="relative flex items-center justify-center my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800/80" />
                      </div>
                      <span className="relative bg-[#111113] px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        {formatDayDivider(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-start gap-3 group ${isMe ? "flex-row-reverse" : ""}`}>
                    <img
                      src={
                        msg.senderAvatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=2563eb&color=ffffff`
                      }
                      alt={msg.senderName}
                      className="h-8 w-8 rounded-full border border-zinc-700 object-cover shrink-0 mt-0.5"
                    />

                    <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-zinc-200">
                          {isMe ? "You" : msg.senderName}
                        </span>
                        {msg.senderPosition && !isMe && (
                          <span className="text-[10px] text-zinc-500 font-medium">
                            • {msg.senderPosition}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isMe
                            ? "bg-fuchsia-600 text-white rounded-tr-none shadow-md shadow-fuchsia-950/50"
                            : "bg-zinc-800/80 text-zinc-100 rounded-tl-none border border-zinc-700/60"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 right-8 flex items-center gap-1.5 rounded-full bg-fuchsia-600 text-white px-3 py-1.5 text-xs font-semibold shadow-xl hover:bg-fuchsia-500 transition animate-in fade-in"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            <span>Latest</span>
          </button>
        </div>
      )}

      {/* 3. Message Input Composer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950/60 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/90 focus-within:border-fuchsia-600 transition-colors p-2 flex flex-col gap-2">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDirect ? `Message @${recipient?.username || "colleague"}...` : `Message #${conversation?.name}...`}
              className="w-full resize-none bg-transparent px-2 text-sm text-white placeholder:text-zinc-500 outline-none max-h-32 min-h-[24px]"
            />

            <div className="flex items-center justify-between border-t border-zinc-800/50 pt-2 px-1 text-zinc-500 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleStartMeetingClick}
                  className="flex items-center gap-1 hover:text-emerald-400 transition"
                  title="Share instant meeting link"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span className="text-[11px] hidden sm:inline">Add Meeting</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-zinc-600">
                <span>Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-600 text-white transition hover:bg-fuchsia-500 disabled:opacity-40 disabled:hover:bg-fuchsia-600 shadow-lg shadow-fuchsia-950/40"
            title="Send message (Enter)"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </footer>

      {/* Group Details & Management Modal */}
      {!isDirect && (
        <GroupInfoModal
          isOpen={isGroupInfoModalOpen}
          onClose={() => setIsGroupInfoModalOpen(false)}
          organizationId={organizationId}
          conversationId={conversationId}
          onGroupDeleted={() => {
            setIsGroupInfoModalOpen(false);
            onGroupDeleted?.();
          }}
          onMemberUpdated={() => {
            fetchMessages(false);
          }}
        />
      )}
    </section>
  );
}

export default OrgChatView;
