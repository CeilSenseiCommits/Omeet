import { API_BASE_URL } from "../../lib/api";
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
        const res = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}?userId=${user?.id || ""}`, {
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

      const res = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}/meetings`, {
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
        navigate(`/meeting/${data.meeting.meetingCode}`, { state: { fromOrgId: organizationId, fromTab: "Meetings" } });
      }
    } catch (err: any) {
      setError(err.message || "Failed to create meeting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[8px] border border-[#383D47] bg-[#1D2026] text-[#F3F3EE] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#383D47] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#252932] border border-[#383D47] text-[#4963C8]">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {meetingType === "INSTANT" ? "Start Instant Meeting" : "Schedule Organization Meeting"}
              </h3>
              <p className="text-[11px] text-[#A9ACB4]">
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
            className="rounded-[5px] border border-[#383D47] bg-[#252932] p-1.5 text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-[5px] border border-[#B44A4A]/30 bg-[#B44A4A]/10 p-3 text-xs font-semibold text-[#B44A4A]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Meeting Timing Option (Instant vs Scheduled) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-2">
              Meeting Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMeetingType("INSTANT")}
                className={`flex flex-col items-start rounded-[5px] border p-3.5 transition text-left ${
                  meetingType === "INSTANT"
                    ? "border-[#4963C8] bg-[#4963C8]/10 text-white"
                    : "border-[#383D47] bg-[#252932] text-[#A9ACB4] hover:border-[#4B5160] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Zap className="h-3.5 w-3.5 text-[#CBEA57]" />
                  Instant Room
                </div>
                <p className="mt-1 text-[11px] text-[#A9ACB4]">Launch and enter video session immediately</p>
              </button>

              <button
                type="button"
                onClick={() => setMeetingType("SCHEDULED")}
                className={`flex flex-col items-start rounded-[5px] border p-3.5 transition text-left ${
                  meetingType === "SCHEDULED"
                    ? "border-[#4963C8] bg-[#4963C8]/10 text-white"
                    : "border-[#383D47] bg-[#252932] text-[#A9ACB4] hover:border-[#4B5160] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Calendar className="h-3.5 w-3.5 text-[#4963C8]" />
                  Scheduled Session
                </div>
                <p className="mt-1 text-[11px] text-[#A9ACB4]">Set future calendar slot & notify attendees</p>
              </button>
            </div>
          </div>

          {/* 2. Meeting Title */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1.5">
              Meeting Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Architecture Review"
              className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] px-3.5 py-2 text-xs text-white placeholder-[#717684] outline-none focus:border-[#4963C8] transition"
              required
            />
          </div>

          {/* 3. Date & Time picker (if SCHEDULED) */}
          {meetingType === "SCHEDULED" && (
            <div className="grid grid-cols-2 gap-3 rounded-[5px] border border-[#383D47] bg-[#252932] p-3.5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-[4px] border border-[#383D47] bg-[#1D2026] px-3 py-1.5 text-xs text-white outline-none focus:border-[#4963C8] transition"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-[4px] border border-[#383D47] bg-[#1D2026] px-3 py-1.5 text-xs text-white outline-none focus:border-[#4963C8] transition"
                  required
                />
              </div>
            </div>
          )}

          {/* 4. Hierarchy Mode Toggle (Default: OFF) */}
          <div className="rounded-[5px] border border-[#383D47] bg-[#252932] p-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Shield className={`h-3.5 w-3.5 ${isHierarchical ? "text-[#4963C8]" : "text-[#717684]"}`} />
                  <span className="text-xs font-semibold text-white">
                    Governed Hierarchy Mode
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] border ${
                      isHierarchical
                        ? "bg-[#4963C8]/15 text-[#9BB1FA] border-[#4963C8]/30"
                        : "bg-[#1D2026] text-[#717684] border-[#383D47]"
                    }`}
                  >
                    {isHierarchical ? "ACTIVE" : "FLAT COLLAB"}
                  </span>
                </div>
                <p className="text-[11px] text-[#A9ACB4] leading-relaxed">
                  {isHierarchical
                    ? "Structured queues: Director > Lead > Senior moderation order."
                    : "Standard flat room: All participants have equal open speaking permissions."}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isHierarchical}
                onClick={() => setIsHierarchical((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isHierarchical ? "bg-[#4963C8]" : "bg-[#383D47]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    isHierarchical ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. Participants Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
                Participants ({selectedParticipants.length})
              </label>
              <span className="text-[10px] text-[#717684]">
                {initialType === "MANUAL" 
                  ? "Select colleagues below" 
                  : "Pre-selected from context"}
              </span>
            </div>

            {/* Selected Participants Chips */}
            {selectedParticipants.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-[5px] border border-[#383D47] bg-[#252932]">
                {selectedParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 rounded-[4px] border border-[#383D47] bg-[#1D2026] px-2 py-0.5 text-xs text-white"
                  >
                    <img
                      src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`}
                      alt={p.name}
                      className="h-3.5 w-3.5 rounded-[2px] object-cover"
                    />
                    <span className="font-medium text-[11px]">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="hover:text-[#B44A4A] transition ml-0.5 text-[#717684]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[5px] border border-dashed border-[#383D47] p-3 text-center text-[11px] text-[#717684]">
                No specific participants chosen. All organization members with access may join.
              </div>
            )}

            {/* Colleague Search & Add Picker */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#717684]" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Search and invite colleagues..."
                  className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#717684] outline-none focus:border-[#4963C8] transition"
                />
              </div>

              {/* Candidate Dropdown / List */}
              {participantSearch.trim() && (
                <div className="max-h-40 overflow-y-auto rounded-[5px] border border-[#383D47] bg-[#252932] p-1 divide-y divide-[#383D47] shadow-xl">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.slice(0, 8).map((candidate) => (
                      <button
                        type="button"
                        key={candidate.id}
                        onClick={() => handleAddParticipant(candidate)}
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
                            <p className="text-[10px] text-[#A9ACB4] truncate">@{candidate.username} · {candidate.position || "Member"}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#4963C8] shrink-0">
                          <UserPlus className="h-3 w-3" /> Add
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-2.5 text-center text-xs text-[#717684]">
                      No matching colleagues found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
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
              ) : meetingType === "INSTANT" ? (
                <Zap className="h-3.5 w-3.5 text-[#CBEA57]" />
              ) : (
                <Calendar className="h-3.5 w-3.5" />
              )}
              {isSubmitting 
                ? "Creating..." 
                : meetingType === "INSTANT" 
                ? "Start Session Now" 
                : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateMeetingModal;
