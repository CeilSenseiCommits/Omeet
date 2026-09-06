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
  ArrowDown, 
  Info,
  MessageCircle
} from "lucide-react";
import GroupInfoModal from "./GroupInfoModal";
import UserAvatar from "../../UserAvatar";

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
  onMessagesRead?: () => void;
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

function OrgChatView({
  organizationId,
  conversationId,
  onClose,
  onViewProfile,
  onStartMeeting,
  onGroupDeleted,
  onMessagesRead,
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
        onMessagesRead?.();
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
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] shadow-xs">
      {/* 1. Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md px-5">
        <div className="flex items-center gap-3 min-w-0">
          {isDirect ? (
            <div className="relative shrink-0">
              <UserAvatar
                name={recipient?.name || "User"}
                avatarUrl={recipient?.avatarUrl}
                size="sm"
                className="shadow-2xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsGroupInfoModalOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-white hover:text-[#1E293B] transition-colors shadow-2xs"
              title="View group info & manage members"
            >
              {conversation?.type === "CHANNEL" ? (
                <Hash className="h-4 w-4 text-[#0D9488]" />
              ) : (
                <Users className="h-4 w-4 text-[#3B82F6]" />
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
              <h2 className={`text-xs font-bold text-[#1E293B] truncate ${!isDirect ? "group-hover:text-[#0D9488] transition-colors" : ""}`}>
                {!isDirect && conversation?.type === "CHANNEL" ? `# ${title}` : title}
              </h2>
              {isDirect && recipient?.username && (
                <span className="text-[11px] text-[#64748B] truncate">@{recipient.username}</span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] truncate">
              {isDirect
                ? `${recipient?.position || "Member"} · ${recipient?.department || "General Team"}`
                : conversation?.topic || `${conversation?.participantCount || 0} members · Click for details`}
            </p>
          </div>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Quick Meeting trigger */}
          <button
            type="button"
            onClick={handleStartMeetingClick}
            className="flex items-center gap-1 rounded-[6px] bg-gradient-to-r from-[#0D9488] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] px-2.5 py-1 text-xs font-medium text-white transition-all shadow-xs"
            title={isDirect ? "Start 1-on-1 Meeting" : "Start Team Huddle"}
          >
            <Video className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isDirect ? "Meet Now" : "Huddle"}
            </span>
          </button>

          {/* Group details & members button */}
          {!isDirect && (
            <button
              type="button"
              onClick={() => setIsGroupInfoModalOpen(true)}
              className="flex items-center gap-1 rounded-[6px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#64748B] hover:text-[#1E293B] transition shadow-2xs"
              title="Group info & members"
            >
              <Info className="h-3.5 w-3.5 text-[#64748B]" />
              <span className="hidden sm:inline">Info</span>
            </button>
          )}

          {/* Direct message profile shortcut */}
          {isDirect && recipient && onViewProfile && (
            <button
              type="button"
              onClick={() => onViewProfile(recipient)}
              className="flex items-center gap-1 rounded-[6px] border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] transition shadow-2xs"
              title="View organization profile"
            >
              <User className="h-3.5 w-3.5 text-[#64748B]" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] border border-[#E2E8F0] bg-white p-1 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] transition shadow-2xs"
            title="Close chat (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Chat Timeline Body */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-[#0D9488]" />
          </div>
        ) : isDirect && messages.length === 0 ? (
          /* Dedicated First-Timer Direct Conversation Welcome Space */
          <div className="my-auto flex flex-col items-center justify-center py-10 px-4 text-center max-w-lg mx-auto">
            <div className="relative mb-3.5">
              <UserAvatar
                name={recipient?.name || "Colleague"}
                avatarUrl={recipient?.avatarUrl}
                size="lg"
                className="h-16 w-16 text-lg border-2 border-white shadow-md"
              />
              <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#0D9488] ring-2 ring-white shadow-xs">
                <Sparkles className="h-3 w-3 text-white" />
              </span>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 px-2.5 py-0.5 text-[10px] font-semibold text-[#0F766E] mb-2">
              <MessageCircle className="h-3 w-3" />
              First-Time Conversation
            </span>

            <h3 className="text-base font-bold text-[#1E293B]">
              Start your conversation with {recipient?.name || "your colleague"}
            </h3>
            {recipient?.position && (
              <p className="text-xs font-medium text-[#0D9488] mt-0.5">
                {recipient.position} {recipient.department ? `· ${recipient.department}` : ""}
              </p>
            )}
            <p className="mt-2 text-xs text-[#64748B] max-w-sm leading-relaxed">
              Say hello to start your conversation! There are no messages in this space yet. Break the ice with a quick greeting or work topic below.
            </p>

            {/* Suggested Icebreaker Starters */}
            <div className="mt-6 w-full space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Suggested conversation starters
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "👋 Hi! How's your day going?",
                  "🤝 Excited to collaborate with you!",
                  "☕ Got a quick minute to sync?",
                  "📋 Following up on our workspace updates."
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => {
                      setInputText(promptText);
                    }}
                    className="rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#475569] hover:border-[#0D9488] hover:text-[#0D9488] hover:bg-[#F0FDFA] transition-all shadow-2xs cursor-pointer active:scale-98"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white/90 px-3.5 py-1 text-[11px] text-[#64748B] shadow-2xs">
              <span className="inline-block h-2 w-2 rounded-full bg-[#0D9488] animate-pulse" />
              Pick a starter above or type your message below to begin chatting
            </div>
          </div>
        ) : (
          <>
            {/* Start of conversation hero banner */}
            <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-5 text-center max-w-md mx-auto shadow-xs">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#F0FDFA] border border-[#99F6E4] text-[#0D9488] mb-2.5 shadow-2xs">
                {isDirect ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>
              <h3 className="text-sm font-semibold text-[#1E293B]">
                {isDirect ? `Chat with ${recipient?.name || "Colleague"}` : `Welcome to #${conversation?.name}`}
              </h3>
              <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                {isDirect
                  ? `This is the direct conversation between you and @${recipient?.username || "colleague"}.`
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
                <div key={msg.id} className="space-y-3">
                  {showDateDivider && (
                    <div className="relative flex items-center justify-center my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E2E8F0]" />
                      </div>
                      <span className="relative bg-[#F8FAFC] px-2.5 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                        {formatDayDivider(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-start gap-2.5 group ${isMe ? "flex-row-reverse" : ""}`}>
                    <UserAvatar
                      name={msg.senderName}
                      avatarUrl={msg.senderAvatarUrl}
                      size="sm"
                      className="shrink-0 mt-0.5 shadow-2xs"
                    />

                    <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-[#1E293B]">
                          {isMe ? "You" : msg.senderName}
                        </span>
                        {msg.senderPosition && !isMe && (
                          <span className="text-[10px] text-[#64748B]">
                            · {msg.senderPosition}
                          </span>
                        )}
                        <span className="text-[10px] text-[#94A3B8]">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`rounded-[8px] px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words shadow-xs ${
                          isMe
                            ? "bg-[#0D9488] text-white"
                            : "bg-white text-[#1E293B] border border-[#E2E8F0]"
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
            className="absolute bottom-3 right-6 flex items-center gap-1 rounded-[6px] bg-[#1E293B] text-white px-2.5 py-1 text-xs font-medium shadow-md transition-colors hover:bg-black"
          >
            <ArrowDown className="h-3 w-3" />
            <span>Latest</span>
          </button>
        </div>
      )}

      {/* 3. Message Input Composer */}
      <footer className="border-t border-[#E2E8F0] bg-white p-3">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#0D9488] focus-within:bg-white transition-all p-2 flex flex-col gap-1.5 shadow-2xs">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isDirect 
                  ? (messages.length === 0 
                      ? `Start your conversation with ${recipient?.name || "colleague"}...` 
                      : `Message @${recipient?.username || "colleague"}...`)
                  : `Message #${conversation?.name}...`
              }
              className="w-full resize-none bg-transparent px-1 text-xs text-[#1E293B] placeholder:text-[#94A3B8] outline-none max-h-28 min-h-[20px]"
            />

            <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-1.5 px-0.5 text-[#64748B] text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartMeetingClick}
                  className="flex items-center gap-1 hover:text-[#0D9488] transition-colors"
                  title="Share instant meeting link"
                >
                  <Video className="h-3 w-3" />
                  <span className="text-[11px] hidden sm:inline">Add Meeting</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                <span>Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-gradient-to-r from-[#0D9488] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] text-white transition-all disabled:opacity-40 shadow-xs cursor-pointer"
            title="Send message (Enter)"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
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
