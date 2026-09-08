import { API_BASE_URL } from "../lib/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Video,
  X,
  Copy,
  Check,
  Search,
  UserPlus,
  Users,
  Loader2,
  AlertCircle,
  Sparkles,
  Link2
} from "lucide-react";

interface InviteeUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  organization?: string;
}

interface CreatePublicMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreatePublicMeetingModal({ isOpen, onClose }: CreatePublicMeetingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [meetingCode, setMeetingCode] = useState("");
  const [title, setTitle] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Invitees & Search
  const [invitedUsers, setInvitedUsers] = useState<InviteeUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InviteeUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timing: Instant vs Scheduled
  const [timingOption, setTimingOption] = useState<"INSTANT" | "SCHEDULED">("INSTANT");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    return localIso;
  });
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  // Initialize fresh meeting code and title when opening
  useEffect(() => {
    if (!isOpen) return;

    const code = `OM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setMeetingCode(code);
    setTitle(user?.name ? `${user.name}'s Meeting` : "Open Collaboration Meeting");
    setCopiedCode(false);
    setCopiedLink(false);
    setInvitedUsers([]);
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
    setIsSubmitting(false);
    setTimingOption("INSTANT");
    setScheduledSuccess(false);
  }, [isOpen, user?.name]);

  // Live user search effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(
            searchQuery.trim()
          )}&currentUserId=${user?.id || ""}`,
          {
            headers: {
              "x-user-id": user?.id || "",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(meetingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      const inviteUrl = `${window.location.origin}/meeting/${meetingCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleAddInvitee = (candidate: InviteeUser) => {
    if (invitedUsers.some((u) => u.id === candidate.id)) return;
    setInvitedUsers((prev) => [...prev, candidate]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveInvitee = (id: string) => {
    setInvitedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleStartMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a meeting title.");
      return;
    }
    if (!user?.id) {
      setError("You must be logged in to create a meeting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/meetings/public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          title: title.trim(),
          meetingCode,
          participantUserIds: invitedUsers.map((u) => u.id),
          userId: user.id,
          meetingType: timingOption,
          scheduledAt: timingOption === "SCHEDULED" ? new Date(scheduledDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create meeting.");
      }

      if (timingOption === "SCHEDULED") {
        setIsSubmitting(false);
        setScheduledSuccess(true);
      } else {
        onClose();
        navigate(`/meeting/${meetingCode}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start meeting.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[8px] border border-[#383D47] bg-[#1D2026] text-[#F3F3EE] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#383D47] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#252932] border border-[#383D47] text-[#4963C8]">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Create Open Meeting</h3>
              <p className="text-[11px] text-[#A9ACB4]">Instant room or scheduled collaboration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] border border-[#383D47] bg-[#252932] p-1.5 text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        {scheduledSuccess ? (
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[5px] bg-[#ECFDF5] border border-[#10B981]/30 text-[#065F46]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Meeting Scheduled</h4>
              <p className="text-xs text-[#A9ACB4] mt-1 max-w-sm mx-auto">
                Your meeting <span className="text-white font-medium">"{title}"</span> is set for{" "}
                <span className="text-[#CBEA57] font-medium">
                  {new Date(scheduledDate).toLocaleString()}
                </span>.
              </p>
            </div>

            <div className="rounded-[5px] border border-[#383D47] bg-[#252932] p-3.5 space-y-2 max-w-sm mx-auto">
              <span className="text-[10px] uppercase tracking-wider text-[#A9ACB4] font-semibold">Meeting Code</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-bold text-white">{meetingCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-[4px] bg-[#4963C8] hover:bg-[#3E56B5] px-2.5 py-1 text-xs font-semibold text-white transition shadow-xs"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-[5px] bg-[#1D2026] border border-[#383D47] hover:bg-[#2C3039] py-2 text-xs font-semibold text-white transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStartMeeting} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-[5px] border border-[#B44A4A]/30 bg-[#B44A4A]/10 p-3 text-xs font-semibold text-[#B44A4A]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Timing Toggle: Instant vs Scheduled */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1.5">
                Meeting Timing
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-[5px] border border-[#383D47] bg-[#252932] p-1">
                <button
                  type="button"
                  onClick={() => setTimingOption("INSTANT")}
                  className={`rounded-[4px] py-1.5 text-xs font-semibold transition ${
                    timingOption === "INSTANT"
                      ? "bg-[#4963C8] text-white shadow-xs"
                      : "text-[#A9ACB4] hover:text-white"
                  }`}
                >
                  Start Instantly
                </button>
                <button
                  type="button"
                  onClick={() => setTimingOption("SCHEDULED")}
                  className={`rounded-[4px] py-1.5 text-xs font-semibold transition ${
                    timingOption === "SCHEDULED"
                      ? "bg-[#4963C8] text-white shadow-xs"
                      : "text-[#A9ACB4] hover:text-white"
                  }`}
                >
                  Schedule for Later
                </button>
              </div>
            </div>

            {/* Date & Time Picker when Scheduled */}
            {timingOption === "SCHEDULED" && (
              <div className="rounded-[5px] border border-[#383D47] bg-[#252932] p-3 space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
                  Select Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-[4px] border border-[#383D47] bg-[#1D2026] px-3 py-1.5 text-xs text-white outline-none focus:border-[#4963C8] transition"
                  required
                />
                <p className="text-[10px] text-[#717684]">
                  Participants will be notified and this session will be listed in your calendar.
                </p>
              </div>
            )}

            {/* Meeting Code Banner */}
            <div className="rounded-[5px] border border-[#383D47] bg-[#252932] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
                  Generated Meeting Code
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#CBEA57]">
                  <Sparkles className="h-3 w-3" /> Ready
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-[4px] border border-[#383D47] bg-[#1D2026] px-3 py-2">
                <span className="font-mono text-sm font-bold tracking-widest text-white">
                  {meetingCode}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 rounded-[3px] bg-[#4963C8] hover:bg-[#3E56B5] px-2 py-1 text-[11px] font-semibold text-white transition"
                    title="Copy code"
                  >
                    {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 rounded-[3px] border border-[#383D47] bg-[#252932] px-2 py-1 text-[11px] font-semibold text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
                    title="Copy direct invite link"
                  >
                    {copiedLink ? <Check className="h-3 w-3 text-[#CBEA57]" /> : <Link2 className="h-3 w-3" />}
                    <span>{copiedLink ? "Link Copied" : "Link"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Meeting Title */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1">
                Meeting Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design Review, Coffee Chat"
                className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] px-3 py-2 text-xs text-white placeholder-[#717684] outline-none focus:border-[#4963C8] transition"
                required
              />
            </div>

            {/* Invite Colleagues / Friends Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
                  Invite People ({invitedUsers.length})
                </label>
                <span className="text-[10px] text-[#717684]">
                  Direct in-app notification
                </span>
              </div>

              {/* Invited Chips */}
              {invitedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-[5px] border border-[#383D47] bg-[#252932]">
                  {invitedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-1.5 rounded-[4px] border border-[#383D47] bg-[#1D2026] px-2 py-0.5 text-xs text-white"
                    >
                      <img
                        src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                        alt={u.name}
                        className="h-3.5 w-3.5 rounded-[2px] object-cover"
                      />
                      <span className="font-medium text-[11px]">{u.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvitee(u.id)}
                        className="hover:text-[#B44A4A] transition ml-0.5 text-[#717684]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Live Search Input */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#717684]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, username or email..."
                    className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] pl-8 pr-8 py-1.5 text-xs text-white placeholder-[#717684] outline-none focus:border-[#4963C8] transition"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-2.5 h-3.5 w-3.5 animate-spin text-[#717684]" />
                  )}
                </div>

                {/* Search Suggestions Dropdown */}
                {searchQuery.trim() && (
                  <div className="max-h-40 overflow-y-auto rounded-[5px] border border-[#383D47] bg-[#252932] p-1 divide-y divide-[#383D47] shadow-xl">
                    {searchResults.length > 0 ? (
                      searchResults
                        .filter((r) => !invitedUsers.some((iu) => iu.id === r.id))
                        .map((candidate) => (
                          <button
                            type="button"
                            key={candidate.id}
                            onClick={() => handleAddInvitee(candidate)}
                            className="flex w-full items-center justify-between p-2 rounded-[4px] hover:bg-[#2C3039] text-left transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`}
                                alt={candidate.name}
                                className="h-5 w-5 rounded-[2px] object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">{candidate.name}</p>
                                <p className="text-[10px] text-[#A9ACB4] truncate">@{candidate.username} {candidate.organization ? `· ${candidate.organization}` : ""}</p>
                              </div>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#4963C8] shrink-0">
                              <UserPlus className="h-3 w-3" /> Invite
                            </span>
                          </button>
                        ))
                    ) : !isSearching ? (
                      <div className="p-2.5 text-center text-xs text-[#717684]">
                        No matching users found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#383D47]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[5px] border border-[#383D47] bg-[#252932] px-4 py-2 text-xs font-semibold text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-40"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Video className="h-3.5 w-3.5" />
                )}
                {isSubmitting ? "Creating..." : "Start Meeting"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreatePublicMeetingModal;
