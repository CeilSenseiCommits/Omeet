import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Zap, 
  Calendar, 
  Users, 
  UserPlus, 
  X, 
  Search, 
  Loader2, 
  Clock, 
  AlertCircle,
  Video,
  Shield
} from "lucide-react";

export interface ParticipantCandidate {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  position?: string;
  department?: string;
}

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
  initialType?: "DIRECT" | "GROUP" | "MANUAL";
  initialParticipants?: ParticipantCandidate[];
  initialTitle?: string;
  conversationId?: string;
  onMeetingCreated?: (meeting?: any) => void;
}

function CreateMeetingModal({
  isOpen,
  onClose,
  organizationId,
  initialType = "MANUAL",
  initialParticipants = [],
  initialTitle,
  conversationId,
  onMeetingCreated,
}: CreateMeetingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [meetingType, setMeetingType] = useState<"INSTANT" | "SCHEDULED">("INSTANT");
  const [isHierarchical, setIsHierarchical] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantCandidate[]>([]);
  const [availableOrgEmployees, setAvailableOrgEmployees] = useState<ParticipantCandidate[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [isSearchingColleagues, setIsSearchingColleagues] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize data on open
  useEffect(() => {
    if (!isOpen) return;

    // Reset error, hierarchy mode & submission state
    setError(null);
    setIsSubmitting(false);
    setIsHierarchical(false);

    // Populate initial participants
    setSelectedParticipants(initialParticipants || []);

    // Intelligent default title
    if (initialTitle) {
      setTitle(initialTitle);
    } else if (initialType === "DIRECT" && initialParticipants.length > 0) {
      setTitle(`1:1 Sync with ${initialParticipants[0].name}`);
    } else if (initialType === "GROUP") {
      setTitle("Team Group Huddle");
    } else {
      setTitle("Organization Team Sync");
    }

    // Load organization colleagues for participant picker
    async function loadOrgEmployees() {
      if (!organizationId) return;
      try {
        setIsSearchingColleagues(true);
        const res = await fetch(`http://localhost:5000/api/organizations/${organizationId}?userId=${user?.id || ""}`, {
          headers: { "x-user-id": user?.id || "" }
        });
        if (res.ok) {
          const data = await res.json();
          const members: ParticipantCandidate[] = (data.members || [])
            .filter((m: any) => m.userId !== user?.id)
            .map((m: any) => ({
              id: m.userId,
              name: m.name,
              username: m.username,
              avatarUrl: m.avatarUrl,
              position: m.position,
              department: m.department,
            }));
          setAvailableOrgEmployees(members);
        }
      } catch (err) {
        console.error("Failed to load organization employees:", err);
      } finally {
        setIsSearchingColleagues(false);
      }
    }

    loadOrgEmployees();
  }, [isOpen, initialType, initialParticipants, initialTitle, organizationId, user?.id]);

  if (!isOpen) return null;

  const handleAddParticipant = (candidate: ParticipantCandidate) => {
    if (selectedParticipants.some((p) => p.id === candidate.id)) return;
    setSelectedParticipants((prev) => [...prev, candidate]);
    setParticipantSearch("");
  };

  const handleRemoveParticipant = (candidateId: string) => {
    setSelectedParticipants((prev) => prev.filter((p) => p.id !== candidateId));
  };

  const filteredCandidates = availableOrgEmployees.filter((emp) => {
    const isAlreadySelected = selectedParticipants.some((p) => p.id === emp.id);
    if (isAlreadySelected) return false;
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.username.toLowerCase().includes(q) ||
      (emp.position && emp.position.toLowerCase().includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a meeting title.");
      return;
    }
    if (!organizationId) {
      setError("Organization context missing.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let scheduledAt: string | null = null;
      if (meetingType === "SCHEDULED") {
        const combined = new Date(`${scheduledDate}T${scheduledTime}:00`);
        if (isNaN(combined.getTime())) {
          setError("Please select a valid scheduled date and time.");
          setIsSubmitting(false);
          return;
        }
        scheduledAt = combined.toISOString();
      }

      const res = await fetch(`http://localhost:5000/api/organizations/${organizationId}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          title: title.trim(),
          meetingType,
          scheduledAt,
          scope: selectedParticipants.length > 0 ? "CUSTOM" : "ORG_WIDE",
          participantUserIds: selectedParticipants.map((p) => p.id),
          conversationId: conversationId || null,
          userId: user?.id,
          isHierarchical,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create meeting.");
      }

      const data = await res.json();
      onMeetingCreated?.(data.meeting);
      onClose();

      // If instant meeting, jump directly into the meeting room!
      if (meetingType === "INSTANT" && data.meeting?.meetingCode) {
        navigate(`/meeting/${data.meeting.meetingCode}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create meeting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#121215] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-950 border border-fuchsia-800 text-fuchsia-400">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {meetingType === "INSTANT" ? "Start Instant Meeting" : "Schedule Organization Meeting"}
              </h3>
              <p className="text-xs text-zinc-400">
                {initialType === "DIRECT" 
                  ? "1-on-1 meeting with colleague" 
                  : initialType === "GROUP" 
                  ? "Team group meeting" 
                  : "Custom organization meeting"}
              </p>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Meeting Timing Option (Instant vs Scheduled) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              When should this meeting happen?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMeetingType("INSTANT")}
                className={`flex flex-col items-start rounded-2xl border p-3.5 transition text-left ${
                  meetingType === "INSTANT"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-200 ring-1 ring-emerald-500/30"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  Instant Meeting
                </div>
                <p className="mt-1 text-xs text-zinc-400">Start now and enter video conference immediately</p>
              </button>

              <button
                type="button"
                onClick={() => setMeetingType("SCHEDULED")}
                className={`flex flex-col items-start rounded-2xl border p-3.5 transition text-left ${
                  meetingType === "SCHEDULED"
                    ? "border-fuchsia-500/60 bg-fuchsia-950/30 text-fuchsia-200 ring-1 ring-fuchsia-500/30"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Calendar className="h-4 w-4 text-fuchsia-400" />
                  Schedule Later
                </div>
                <p className="mt-1 text-xs text-zinc-400">Set a future time & notify participants in advance</p>
              </button>
            </div>
          </div>

          {/* 2. Meeting Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Meeting Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Architecture Review, Sprint Standup"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-fuchsia-600 transition"
              required
            />
          </div>

          {/* 3. Date & Time picker (if SCHEDULED) */}
          {meetingType === "SCHEDULED" && (
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-600 transition"
                  required
                />
              </div>
            </div>
          )}

          {/* 4. Hierarchy Mode Toggle (Default: OFF) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700/70">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className={`h-4 w-4 ${isHierarchical ? "text-fuchsia-400" : "text-zinc-400"}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Organization Hierarchy
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isHierarchical
                        ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {isHierarchical ? "ON (STRUCTURED)" : "OFF (DEFAULT)"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isHierarchical
                    ? "Role hierarchy active: Director > Lead > Senior > Member speaking queues and moderation controls."
                    : "Hierarchy disabled: All participants join as equals with flat speaking and collaboration permissions."}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isHierarchical}
                onClick={() => setIsHierarchical((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isHierarchical ? "bg-fuchsia-600" : "bg-zinc-800"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isHierarchical ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. Participants Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Participants ({selectedParticipants.length})
              </label>
              <span className="text-[11px] text-zinc-500">
                {initialType === "MANUAL" 
                  ? "Select colleagues below" 
                  : "Pre-selected from chat (add more if needed)"}
              </span>
            </div>

            {/* Selected Participants Chips */}
            {selectedParticipants.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl border border-zinc-800 bg-zinc-900/40">
                {selectedParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 rounded-full border border-fuchsia-900/60 bg-fuchsia-950/40 px-3 py-1 text-xs text-fuchsia-200"
                  >
                    <img
                      src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`}
                      alt={p.name}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    <span className="font-medium">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="hover:text-rose-400 transition ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
                No extra participants selected. If left empty, all organization members can join.
              </div>
            )}

            {/* Colleague Search & Add Picker */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Search and invite more organization colleagues..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-fuchsia-600 transition"
                />
              </div>

              {/* Candidate Dropdown / List */}
              {participantSearch.trim() && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1 divide-y divide-zinc-800/50 shadow-xl">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.slice(0, 8).map((candidate) => (
                      <button
                        type="button"
                        key={candidate.id}
                        onClick={() => handleAddParticipant(candidate)}
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
                            <p className="text-[10px] text-zinc-400 truncate">@{candidate.username} · {candidate.position || "Member"}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-fuchsia-400 shrink-0">
                          <UserPlus className="h-3 w-3" /> Add
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-zinc-500">
                      No matching colleagues found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
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
              className="flex items-center gap-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-fuchsia-950/50 transition disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : meetingType === "INSTANT" ? (
                <Zap className="h-4 w-4" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              {isSubmitting 
                ? "Creating..." 
                : meetingType === "INSTANT" 
                ? "Start Meeting Now" 
                : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateMeetingModal;
