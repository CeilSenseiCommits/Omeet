import { useNavigate } from "react-router-dom";
import type { OngoingMeeting, RecentlyEndedMeeting, UpcomingMeeting } from "../../types/organization";
import Carousel from "./Carousel";
import { Video, LogIn, ChevronRight, MoreVertical, Shield, Clock } from "lucide-react";

interface MeetingsTabProps {
  ongoingMeetings: OngoingMeeting[];
  upcomingMeetings: UpcomingMeeting[];
  recentlyEndedMeetings: RecentlyEndedMeeting[];
  onCreateMeeting: () => void;
  onJoinMeeting: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function MeetingsTab({
  ongoingMeetings,
  upcomingMeetings,
  recentlyEndedMeetings,
  onCreateMeeting,
  onJoinMeeting,
}: MeetingsTabProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col space-y-10 py-6">
      <section className="grid gap-6 md:grid-cols-2" aria-label="Organization meeting actions">
        <button type="button" onClick={onCreateMeeting} className="flex flex-col justify-between rounded-xl border border-fuchsia-900/50 bg-[#1f0f29] p-6 text-left transition hover:border-fuchsia-800">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-900/50 text-fuchsia-400 border border-fuchsia-800/50">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Create Organization Meeting</p>
              <p className="mt-1 text-sm text-zinc-400 leading-snug">Start a meeting for the organization or<br/>a group you manage.</p>
            </div>
          </div>
          <div className="mt-6 flex">
            <span className="inline-flex rounded-lg bg-fuchsia-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-fuchsia-800">Create meeting</span>
          </div>
        </button>
        <button type="button" onClick={onJoinMeeting} className="flex flex-col justify-between rounded-xl border border-zinc-800/60 bg-[#1a1a1c] p-6 text-left transition hover:border-zinc-700">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 text-zinc-400 border border-zinc-800">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Join Organization Meeting</p>
              <p className="mt-1 text-sm text-zinc-400 leading-snug">Enter a meeting code or join one of the<br/>active group meetings below.</p>
            </div>
          </div>
          <div className="mt-6 flex">
            <span className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800">Join with code</span>
          </div>
        </button>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Ongoing Meetings</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <button type="button" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 transition">View all</button>
        </div>
        <Carousel cardWidth={340}>
          {ongoingMeetings.map((meeting) => (
            <article key={meeting.id} className="flex h-full flex-col justify-between rounded-xl border border-zinc-800/60 bg-[#151517] p-5 hover:border-zinc-700 transition">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-900">Live</span>
                  <p className="font-semibold text-white text-base truncate">{meeting.title}</p>
                </div>
                <p className="text-xs font-medium text-zinc-400">{meeting.group}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {meeting.participants.slice(0, 4).map((p, i) => (
                    <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border border-[#151517] bg-zinc-700 text-[8px] font-bold text-white shadow-sm">
                      {getInitials(p)}
                    </div>
                  ))}
                  {meeting.participants.length > 4 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#151517] bg-zinc-800 text-[8px] font-bold text-zinc-400 shadow-sm">
                      +{meeting.participants.length - 4}
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => meeting.meetingCode ? navigate(`/meeting/${meeting.meetingCode}`) : onJoinMeeting()} 
                  className="rounded-lg bg-fuchsia-900 px-5 py-1.5 text-xs font-semibold text-white transition hover:bg-fuchsia-800 shadow-sm"
                >
                  Join
                </button>
              </div>
            </article>
          ))}
        </Carousel>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Upcoming Meetings</h2>
            <span className="text-xs text-zinc-500">Next meetings you're part of or invited to</span>
          </div>
          <button type="button" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 transition">View all</button>
        </div>
        <div className="flex rounded-xl border border-zinc-800/60 bg-[#151517] overflow-hidden">
          <div className="flex flex-col flex-1 divide-y divide-zinc-800/60">
            {upcomingMeetings.map((meeting) => {
              const [month, day] = meeting.date.split(" ");
              return (
                <article key={meeting.id} className="flex items-center px-6 py-4 hover:bg-zinc-900/30 transition group">
                  <div className="flex flex-col items-center justify-center w-12 shrink-0 border-r border-zinc-800/60 pr-6 mr-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{month}</span>
                    <span className="text-lg font-bold text-white">{day}</span>
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-semibold text-white text-sm truncate">{meeting.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{meeting.group}</p>
                  </div>
                  <div className="w-36 shrink-0 hidden md:block">
                    <p className="text-xs text-zinc-300">{meeting.time}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">30 min</p>
                  </div>
                  <div className="w-32 shrink-0 hidden lg:block">
                    <p className="text-xs text-zinc-300 truncate">{meeting.organizer}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Organizer</p>
                  </div>
                  <div className="w-24 shrink-0 flex justify-end pr-4">
                    <span className="rounded-md bg-fuchsia-950/40 px-2 py-1 text-[10px] font-medium text-fuchsia-400 border border-fuchsia-900/40">
                      {meeting.status}
                    </span>
                  </div>
                  <button type="button" className="text-zinc-500 hover:text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </div>
          <button type="button" className="w-10 bg-zinc-900/50 border-l border-zinc-800/60 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Recently Ended</h2>
            <span className="text-xs text-zinc-500">Your recently completed or archived meetings</span>
          </div>
          <button type="button" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 transition">View all</button>
        </div>
        {recentlyEndedMeetings.length > 0 ? (
          <Carousel cardWidth={340}>
            {recentlyEndedMeetings.map((meeting) => (
              <article key={meeting.id} className="flex h-full flex-col justify-between rounded-xl border border-zinc-800/60 bg-[#151517] p-5 hover:border-zinc-700 transition">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white text-base truncate">{meeting.title}</p>
                    {meeting.isHierarchical && (
                      <span className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-300 border border-zinc-700 shrink-0">
                        <Shield className="h-2.5 w-2.5 text-fuchsia-400" /> Hierarchy
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5">
                    Ended {meeting.timeAgo || meeting.duration + " ago"} • Duration: {meeting.duration}
                  </p>
                  {meeting.hostName && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">Host: {meeting.hostName}</p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <span className="flex items-center gap-1 rounded bg-fuchsia-950/40 px-1.5 py-0.5 text-[10px] font-medium text-fuchsia-400 border border-fuchsia-900/40">
                    <Video className="h-3 w-3" /> Recording
                  </span>
                  <span className="flex items-center gap-1 rounded bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-900/40">
                    <Shield className="h-3 w-3" /> AI Summary
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {(meeting.participants || ["Participant"]).slice(0, 4).map((p, i) => (
                      <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border border-[#151517] bg-zinc-700 text-[8px] font-bold text-white shadow-sm" title={p}>
                        {getInitials(p)}
                      </div>
                    ))}
                    {(meeting.participantsCount || meeting.participants?.length || 1) > 4 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#151517] bg-zinc-800 text-[8px] font-bold text-zinc-400 shadow-sm">
                        +{(meeting.participantsCount || meeting.participants?.length || 1) - 4}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => meeting.meetingCode && navigate(`/meeting/${meeting.meetingCode}`)}
                    className="rounded-lg border border-zinc-700 bg-transparent px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                    Details
                  </button>
                </div>
              </article>
            ))}
          </Carousel>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-950/30">
            <Clock className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-400">No recently ended meetings</p>
            <p className="text-xs text-zinc-600 mt-1">Completed meetings and archived summaries will automatically appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default MeetingsTab;
