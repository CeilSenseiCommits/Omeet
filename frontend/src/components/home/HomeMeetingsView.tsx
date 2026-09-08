import { API_BASE_URL } from "../../lib/api";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Video, 
  Calendar, 
  Clock, 
  Plus, 
  Copy, 
  Check, 
  Loader2, 
  ArrowRight
} from "lucide-react";
import CreatePublicMeetingModal from "../CreatePublicMeetingModal";
import JoinMeetingModal from "../organization/JoinMeetingModal";

interface MeetingItem {
  id: string;
  meetingCode: string;
  title: string;
  status: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: string;
  participantCount?: number;
  activeCount?: number;
  isHierarchical?: boolean;
  organizationName?: string;
  organizationId?: string;
  host: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export default function HomeMeetingsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "recent">("upcoming");
  const [upcoming, setUpcoming] = useState<MeetingItem[]>([]);
  const [recent, setRecent] = useState<MeetingItem[]>([]);
  const [activeMeetings, setActiveMeetings] = useState<MeetingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchMeetings = useCallback(async (showLoading = false) => {
    if (!user?.id) return;
    try {
      if (showLoading) setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/meetings/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUpcoming(data.upcoming || []);
        setRecent(data.recent || []);
        setActiveMeetings(data.active || []);
      }
    } catch (err) {
      console.warn("Failed to fetch meetings:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMeetings(true);
    const interval = setInterval(() => {
      fetchMeetings(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchMeetings]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8D4CB] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#242427] flex items-center gap-2">
            <Video className="h-4 w-4 text-[#4963C8]" />
            <span>Meetings Hub</span>
          </h2>
          <p className="text-xs text-[#585754] mt-0.5">
            Start instant video meetings, schedule future sessions, and view your upcoming and recent meetings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="rounded-[5px] border border-[#D8D4CB] bg-white hover:bg-[#EFECE4] px-3 py-1.5 text-xs font-medium text-[#242427] transition-colors"
          >
            Join with Code
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Meeting
          </button>
        </div>
      </div>

      {/* Live Active Meetings Banner (If Any) */}
      {activeMeetings.length > 0 && (
        <div className="rounded-[6px] border border-[#CBD5E1] bg-white p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#242427]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Live Ongoing Meetings ({activeMeetings.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeMeetings.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] p-3"
              >
                <div className="min-w-0 pr-3">
                  <h4 className="font-semibold text-[#242427] text-xs truncate">{m.title}</h4>
                  <p className="text-[11px] text-[#7E7C77] mt-0.5">
                    {m.organizationName} · Host: {m.host.name}
                  </p>
                </div>
                <Link
                  to={`/meeting/${m.meetingCode}`}
                  className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors shrink-0 shadow-xs"
                >
                  Join Live
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#D8D4CB] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "upcoming"
              ? "border border-[#D8D4CB] bg-white text-[#242427] shadow-xs"
              : "border border-transparent text-[#7E7C77] hover:text-[#242427]"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Upcoming ({upcoming.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recent")}
          className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "recent"
              ? "border border-[#D8D4CB] bg-white text-[#242427] shadow-xs"
              : "border border-transparent text-[#7E7C77] hover:text-[#242427]"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Recently Ended ({recent.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-[6px] border border-[#D8D4CB] bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-[#7E7C77]" />
        </div>
      ) : activeTab === "upcoming" ? (
        upcoming.length === 0 ? (
          <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-10 text-center space-y-2.5">
            <Calendar className="mx-auto h-8 w-8 text-[#A6A49F]" />
            <h3 className="text-xs font-semibold text-[#242427]">No Upcoming Meetings</h3>
            <p className="text-xs text-[#7E7C77] max-w-sm mx-auto">
              You do not have any scheduled meetings coming up. Start an instant call or schedule one now.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              <Plus className="h-3 w-3" /> Schedule Meeting
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((m) => {
              const schedDate = m.scheduledAt ? new Date(m.scheduledAt) : new Date();
              const isCopied = copiedCode === m.meetingCode;

              return (
                <div
                  key={m.id}
                  className="flex flex-col justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-4 shadow-xs hover:border-[#4963C8] transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-1.5 py-0.5 text-[10px] font-semibold text-[#585754]">
                          {m.organizationName}
                        </span>
                        <h4 className="font-semibold text-[#242427] text-sm mt-1.5 truncate">{m.title}</h4>
                      </div>

                      <div className="flex items-center gap-1 rounded-[3px] border border-[#CBD5E1] bg-[#EEF2FF] px-2 py-0.5">
                        <span className="font-mono text-xs font-semibold text-[#4963C8]">{m.meetingCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(m.meetingCode)}
                          className="text-[#7E7C77] hover:text-[#242427] p-0.5"
                          title="Copy Code"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#585754]">
                      <Clock className="h-3 w-3 text-[#A6A49F]" />
                      <span>
                        {schedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
                        {schedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <img
                        src={m.host.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.host.name)}`}
                        alt={m.host.name}
                        className="h-5 w-5 rounded-[3px] object-cover border border-[#D8D4CB]"
                      />
                      <span className="text-xs text-[#7E7C77]">Host: <strong className="text-[#242427] font-medium">{m.host.name}</strong></span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#E8E5DD] pt-3 flex items-center justify-end">
                    <Link
                      to={`/meeting/${m.meetingCode}`}
                      className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <span>Join Meeting</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : recent.length === 0 ? (
        <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-10 text-center text-xs text-[#7E7C77]">
          No recently ended meetings recorded
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((m) => {
            const ended = m.endedAt ? new Date(m.endedAt) : null;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-3 text-xs shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] text-[#7E7C77] shrink-0">
                    <Video className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[#242427] text-xs truncate">{m.title}</h4>
                    <p className="text-[#7E7C77] text-[11px] mt-0.5">
                      {m.organizationName} · Host: {m.host.name} · {m.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[#7E7C77] text-[11px]">
                    {ended ? ended.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Concluded"}
                  </span>
                  <span className="rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-2 py-0.5 text-[10px] font-medium text-[#585754]">
                    Ended
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreatePublicMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchMeetings();
        }}
      />

      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
