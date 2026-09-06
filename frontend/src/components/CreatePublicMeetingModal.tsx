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
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(
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

      const res = await fetch("http://localhost:5000/api/meetings/public", {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#121215] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create Open Meeting</h3>
              <p className="text-xs text-zinc-400">Invite peers or share your meeting code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        {scheduledSuccess ? (
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Meeting Scheduled!</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Your meeting <span className="text-white font-medium">"{title}"</span> has been scheduled for{" "}
                <span className="text-emerald-400 font-medium">
                  {new Date(scheduledDate).toLocaleString()}
                </span>.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2 max-w-sm mx-auto">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Meeting Code</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-bold text-emerald-300">{meetingCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/80 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-900 transition"
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
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-emerald-950/50"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStartMeeting} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Timing Toggle: Instant vs Scheduled */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Meeting Timing
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-1">
                <button
                  type="button"
                  onClick={() => setTimingOption("INSTANT")}
                  className={`rounded-xl py-2 text-xs font-semibold transition ${
                    timingOption === "INSTANT"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Start Instantly
                </button>
                <button
                  type="button"
                  onClick={() => setTimingOption("SCHEDULED")}
                  className={`rounded-xl py-2 text-xs font-semibold transition ${
                    timingOption === "SCHEDULED"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Schedule for Later
                </button>
              </div>
            </div>

            {/* Date & Time Picker when Scheduled */}
            {timingOption === "SCHEDULED" && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Select Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition"
                  required
                />
                <p className="text-[11px] text-zinc-500">
                  Participants will be notified and this meeting will appear under your Upcoming Meetings.
                </p>
              </div>
            )}

            {/* Meeting Code Banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Your Meeting Code
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-300/80">
                  <Sparkles className="h-3 w-3" /> Ready to share
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-zinc-950/80 px-4 py-3">
                <span className="font-mono text-lg font-bold tracking-widest text-emerald-300">
                  {meetingCode}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/80 px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-900 transition"
                    title="Copy meeting code"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
                    title="Copy direct invite link"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Meeting Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Meeting Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design Review, Coffee Chat"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

          {/* Invite Colleagues / Friends Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Invite People ({invitedUsers.length})
              </label>
              <span className="text-[11px] text-zinc-500">
                They will receive an instant meeting invitation
              </span>
            </div>

            {/* Invited Chips */}
            {invitedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50">
                {invitedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-200"
                  >
                    <img
                      src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                      alt={u.name}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    <span className="font-medium">{u.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInvitee(u.id)}
                      className="hover:text-rose-400 transition ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Live Search Input */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by name, username or email..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 transition"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-zinc-500" />
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {searchQuery.trim() && (
                <div className="max-h-44 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1 divide-y divide-zinc-800/50 shadow-xl">
                  {searchResults.length > 0 ? (
                    searchResults
                      .filter((r) => !invitedUsers.some((iu) => iu.id === r.id))
                      .map((candidate) => (
                        <button
                          type="button"
                          key={candidate.id}
                          onClick={() => handleAddInvitee(candidate)}
                          className="flex w-full items-center justify-between p-2 rounded-lg hover:bg-zinc-800 text-left transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`}
                              alt={candidate.name}
                              className="h-6 w-6 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white truncate">{candidate.name}</p>
                              <p className="text-[10px] text-zinc-400 truncate">@{candidate.username} {candidate.organization ? `· ${candidate.organization}` : ""}</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 shrink-0">
                            <UserPlus className="h-3 w-3" /> Invite
                          </span>
                        </button>
                      ))
                  ) : !isSearching ? (
                    <div className="p-3 text-center text-xs text-zinc-500">
                      No matching users found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/50 transition disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              {isSubmitting ? "Starting..." : "Start Meeting"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default CreatePublicMeetingModal;
