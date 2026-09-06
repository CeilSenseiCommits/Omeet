import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import JoinMeetingModal from "./organization/JoinMeetingModal";
import { Loader2 } from "lucide-react";

function MeetSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleCreatePublicMeeting = async () => {
    if (!user?.id || isCreating) return;
    try {
      setIsCreating(true);
      const res = await fetch("http://localhost:5000/api/meetings/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${user.name || "Personal"} Open Meeting`,
          userId: user.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/meeting/${data.meeting.meetingCode}`);
      }
    } catch (err) {
      console.error("Failed to create public meeting:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Meet</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Launch a space for collaboration</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            ✦
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">Create Meeting</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            Start a personal, non-hierarchical meeting open to all participants.
          </p>
          <button
            type="button"
            disabled={isCreating}
            onClick={handleCreatePublicMeeting}
            className="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-5 py-3 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {isCreating && <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />}
            {isCreating ? "Starting Meeting..." : "Create Open Meeting"}
          </button>
        </article>

        <article className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
            ↗
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">Join Meeting</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            Join a meeting using a code or invite link without leaving the dashboard.
          </p>
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-5 py-3 text-sm font-medium text-white transition"
          >
            Join with Code
          </button>
        </article>
      </div>

      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </section>
  );
}

export default MeetSection;
