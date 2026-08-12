import type { OngoingMeeting, RecentlyEndedMeeting, UpcomingMeeting } from "../../types/organization";

interface MeetingsTabProps {
  ongoingMeetings: OngoingMeeting[];
  upcomingMeetings: UpcomingMeeting[];
  recentlyEndedMeetings: RecentlyEndedMeeting[];
  onCreateMeeting: () => void;
  onJoinMeeting: () => void;
}

function MeetingsTab({
  ongoingMeetings,
  upcomingMeetings,
  recentlyEndedMeetings,
  onCreateMeeting,
  onJoinMeeting,
}: MeetingsTabProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2" aria-label="Organization meeting actions">
        <button type="button" onClick={onCreateMeeting} className="rounded-[28px] border border-fuchsia-500/30 bg-fuchsia-500/10 p-6 text-left transition hover:border-fuchsia-400/60 hover:bg-fuchsia-500/15">
          <p className="text-sm font-semibold text-fuchsia-200">Create Organization Meeting</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">Start a meeting for the organization or a group you manage.</p>
          <span className="mt-5 inline-block rounded-xl bg-fuchsia-500 px-3 py-2 text-sm font-medium text-white">Create meeting</span>
        </button>
        <button type="button" onClick={onJoinMeeting} className="rounded-[28px] border border-zinc-700 bg-zinc-950/60 p-6 text-left transition hover:border-zinc-600 hover:bg-zinc-800/70">
          <p className="text-sm font-semibold text-white">Join Organization Meeting</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Enter a meeting code or join one of the active group meetings below.</p>
          <span className="mt-5 inline-block rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200">Join with code</span>
        </button>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-white">Ongoing meetings</h2><p className="mt-1 text-sm text-zinc-400">Active meetings from groups you belong to.</p></div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">Live now</span>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {ongoingMeetings.map((meeting) => (
            <article key={meeting.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="font-semibold text-white">{meeting.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{meeting.group}</p>
              <div className="mt-5 flex items-center justify-between gap-3"><span className="text-sm text-zinc-300">{meeting.participants.length} participants</span><button type="button" onClick={onJoinMeeting} className="rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">Join</button></div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Upcoming meetings</h2><p className="mt-1 text-sm text-zinc-400">Accepted invitations and meetings from your groups.</p>
        <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-800">
          {upcomingMeetings.map((meeting) => (
            <article key={meeting.id} className="grid gap-2 border-b border-zinc-800 bg-zinc-950/40 p-4 last:border-b-0 md:grid-cols-[1.2fr_repeat(3,1fr)_auto] md:items-center">
              <div><p className="font-medium text-white">{meeting.title}</p><p className="text-sm text-zinc-500">{meeting.group}</p></div>
              <p className="text-sm text-zinc-300">{meeting.date}</p><p className="text-sm text-zinc-300">{meeting.time}</p><p className="text-sm text-zinc-400">{meeting.organizer}</p><span className="w-fit rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-200">{meeting.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Recently ended</h2>
        <p className="mt-1 text-sm text-zinc-400">Organizations can choose to store meeting recordings and metadata.</p>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {recentlyEndedMeetings.map((meeting) => (
            <article key={meeting.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-white">{meeting.title}</p><p className="mt-1 text-sm text-zinc-400">Duration: {meeting.duration}</p></div><button type="button" className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">Open details</button></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">Recording {meeting.recordingAvailable ? "available" : "not stored"}</span><span className="rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-xs text-fuchsia-200">AI summary {meeting.aiSummaryAvailable ? "available" : "pending"}</span></div></article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MeetingsTab;
