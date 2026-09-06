import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Video, 
  Calendar, 
  Clock, 
  Plus, 
  Users, 
  Copy, 
  Check, 
  ExternalLink, 
  Loader2, 
  Sparkles,
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

  const fetchMeetings = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:5000/api/meetings/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUpcoming(data.upcoming || []);
        setRecent(data.recent || []);
        setActiveMeetings(data.active || []);
      }
    } catch (err) {
      console.warn("Failed to fetch meetings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Video className="h-6 w-6 text-emerald-400" /> Meetings Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Start instant video meetings, schedule future sessions, and view your upcoming and recent meetings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-white transition"
          >
            Join with Code
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/50 transition"
          >
            <Plus className="h-4 w-4" /> Create Meeting
          </button>
        </div>
      </div>

      {/* Live Active Meetings Banner (If Any) */}
      {activeMeetings.length > 0 && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              Live Ongoing Meetings ({activeMeetings.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeMeetings.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-zinc-950/80 p-4"
              >
                <div className="min-w-0 pr-3">
                  <h4 className="font-bold text-white text-sm truncate">{m.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {m.organizationName} • Host: {m.host.name}
                  </p>
                </div>
                <Link
                  to={`/meeting/${m.meetingCode}`}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition shrink-0 shadow-md"
                >
                  Join Live
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "upcoming"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Upcoming Meetings ({upcoming.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recent")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "recent"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Recently Ended ({recent.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex h-56 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/30">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : activeTab === "upcoming" ? (
        upcoming.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
            <Calendar className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="text-sm font-semibold text-white">No Upcoming Meetings</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              You do not have any scheduled meetings coming up. Start an instant call or schedule one now.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Meeting
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
                  className="flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg hover:border-zinc-700 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="rounded-md bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          {m.organizationName}
                        </span>
                        <h4 className="font-bold text-white text-base mt-2 truncate">{m.title}</h4>
                      </div>

                      <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-1">
                        <span className="font-mono text-xs font-bold text-emerald-400">{m.meetingCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(m.meetingCode)}
                          className="text-zinc-400 hover:text-white p-0.5"
                          title="Copy Code"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      <span>
                        {schedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at{" "}
                        {schedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <img
                        src={m.host.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.host.name)}`}
                        alt={m.host.name}
                        className="h-6 w-6 rounded-full object-cover border border-zinc-700"
                      />
                      <span className="text-xs text-zinc-400">Host: <strong className="text-zinc-200">{m.host.name}</strong></span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-zinc-800/80 pt-4 flex items-center justify-end gap-2">
                    <Link
                      to={`/meeting/${m.meetingCode}`}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition"
                    >
                      Join Meeting <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : recent.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-12 text-center text-xs text-zinc-500">
          No recently ended meetings recorded
        </div>
      ) : (
        <div className="space-y-3">
          {recent.map((m) => {
            const ended = m.endedAt ? new Date(m.endedAt) : null;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 shrink-0">
                    <Video className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{m.title}</h4>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      {m.organizationName} • Host: {m.host.name} • {m.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-zinc-500 text-[11px]">
                    {ended ? ended.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Concluded"}
                  </span>
                  <span className="rounded-lg bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
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
