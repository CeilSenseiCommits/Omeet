import { useNavigate } from "react-router-dom";
import type { OngoingMeeting, RecentlyEndedMeeting, UpcomingMeeting } from "../../types/organization";
import Carousel from "./Carousel";
import { Video, LogIn, ChevronRight, MoreVertical, Shield, Clock } from "lucide-react";

interface MeetingsTabProps {
  organizationId?: string;
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
  organizationId,
  ongoingMeetings,
  upcomingMeetings,
  recentlyEndedMeetings,
  onCreateMeeting,
  onJoinMeeting,
}: MeetingsTabProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col space-y-8 py-5">
      <section className="grid gap-4 md:grid-cols-2" aria-label="Organization meeting actions">
        <button
          type="button"
          onClick={onCreateMeeting}
          className="flex flex-col justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-4.5 text-left shadow-xs transition-colors hover:border-[#4963C8]"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-[#EEF2FF] text-[#4963C8] border border-[#CBD5E1]">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#242427]">Create Organization Meeting</p>
              <p className="mt-1 text-xs text-[#585754] leading-relaxed">
                Start a meeting for the organization or a group you manage.
              </p>
            </div>
          </div>
          <div className="mt-4 flex">
            <span className="inline-flex rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-colors">
              Create Meeting
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onJoinMeeting}
          className="flex flex-col justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-4.5 text-left shadow-xs transition-colors hover:border-[#4963C8]"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-[#FAF9F6] text-[#585754] border border-[#D8D4CB]">
              <LogIn className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#242427]">Join Organization Meeting</p>
              <p className="mt-1 text-xs text-[#585754] leading-relaxed">
                Enter a meeting code or join one of the active group sessions.
              </p>
            </div>
          </div>
          <div className="mt-4 flex">
            <span className="inline-flex rounded-[5px] border border-[#D8D4CB] bg-white hover:bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#242427] transition-colors">
              Join with Code
            </span>
          </div>
        </button>
      </section>

      {/* Ongoing Meetings */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-[#242427]">Ongoing Meetings</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
        </div>
        {ongoingMeetings.length > 0 ? (
          <Carousel cardWidth={320}>
            {ongoingMeetings.map((meeting) => (
              <article
                key={meeting.id}
                className="flex h-full flex-col justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-4 shadow-xs hover:border-[#4963C8] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-[3px] bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      Live
                    </span>
                    <p className="font-semibold text-[#242427] text-xs truncate">{meeting.title}</p>
                  </div>
                  <p className="text-[11px] text-[#7E7C77]">{meeting.group}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#E8E5DD] pt-2.5">
                  <div className="flex -space-x-1">
                    {meeting.participants.slice(0, 4).map((p, i) => (
                      <div
                        key={i}
                        className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-white bg-[#252932] text-[8px] font-bold text-[#F3F3EE]"
                      >
                        {getInitials(p)}
                      </div>
                    ))}
                    {meeting.participants.length > 4 && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-white bg-[#FAF9F6] text-[8px] font-bold text-[#7E7C77]">
                        +{meeting.participants.length - 4}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => meeting.meetingCode ? navigate(`/meeting/${meeting.meetingCode}`, { state: { fromOrgId: organizationId, fromTab: "Meetings" } }) : onJoinMeeting()} 
                    className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1 text-xs font-medium text-white transition-colors shadow-xs"
                  >
                    Join
                  </button>
                </div>
              </article>
            ))}
          </Carousel>
        ) : (
          <div className="rounded-[6px] border border-dashed border-[#D8D4CB] bg-white p-6 text-center text-xs text-[#7E7C77]">
            No live meetings currently in session.
          </div>
        )}
      </section>

      {/* Upcoming Meetings */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-[#242427]">Upcoming Meetings</h2>
            <span className="text-xs text-[#7E7C77]">Scheduled sessions in this workspace</span>
          </div>
        </div>
        <div className="flex rounded-[6px] border border-[#D8D4CB] bg-white overflow-hidden shadow-xs">
          <div className="flex flex-col flex-1 divide-y divide-[#E8E5DD]">
            {upcomingMeetings.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#7E7C77]">
                No upcoming scheduled meetings.
              </div>
            ) : (
              upcomingMeetings.map((meeting) => {
                const [month, day] = meeting.date.split(" ");
                return (
                  <article key={meeting.id} className="flex items-center px-4 py-3 hover:bg-[#FAF9F6] transition-colors group">
                    <div className="flex flex-col items-center justify-center w-10 shrink-0 border-r border-[#E8E5DD] pr-4 mr-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">{month}</span>
                      <span className="text-sm font-bold text-[#242427]">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-semibold text-[#242427] text-xs truncate">{meeting.title}</p>
                      <p className="text-[11px] text-[#7E7C77] mt-0.5 truncate">{meeting.group}</p>
                    </div>
                    <div className="w-32 shrink-0 hidden md:block">
                      <p className="text-xs text-[#585754]">{meeting.time}</p>
                      <p className="text-[10px] text-[#7E7C77] mt-0.5">30 min</p>
                    </div>
                    <div className="w-28 shrink-0 hidden lg:block">
                      <p className="text-xs text-[#585754] truncate">{meeting.organizer}</p>
                      <p className="text-[10px] text-[#7E7C77] mt-0.5">Organizer</p>
                    </div>
                    <div className="w-24 shrink-0 flex items-center justify-end gap-1.5 pr-2">
                      {meeting.meetingCode ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/meeting/${meeting.meetingCode}`, { state: { fromOrgId: organizationId, fromTab: "Meetings" } })}
                          className="rounded-[4px] bg-[#4963C8] hover:bg-[#3E56B5] px-2.5 py-1 text-xs font-medium text-white transition-colors shadow-2xs"
                        >
                          Join
                        </button>
                      ) : (
                        <span className="rounded-[3px] border border-[#CBD5E1] bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-semibold text-[#4963C8]">
                          {meeting.status}
                        </span>
                      )}
                    </div>
                    <button type="button" className="text-[#7E7C77] hover:text-[#242427] p-1 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </article>
                );
              })
            )}
          </div>
          <button type="button" className="w-8 bg-[#FAF9F6] border-l border-[#D8D4CB] flex items-center justify-center text-[#7E7C77] hover:text-[#242427] hover:bg-[#EFECE4] transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Recently Ended */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-[#242427]">Recently Ended</h2>
            <span className="text-xs text-[#7E7C77]">Completed or archived meetings</span>
          </div>
        </div>
        {recentlyEndedMeetings.length > 0 ? (
          <Carousel cardWidth={320}>
            {recentlyEndedMeetings.map((meeting) => (
              <article
                key={meeting.id}
                className="flex h-full flex-col justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-4 shadow-xs hover:border-[#4963C8] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[#242427] text-xs truncate">{meeting.title}</p>
                    {meeting.isHierarchical && (
                      <span className="flex items-center gap-1 rounded-[3px] bg-[#FAF9F6] px-1.5 py-0.5 text-[9px] font-semibold text-[#585754] border border-[#D8D4CB] shrink-0">
                        <Shield className="h-2.5 w-2.5 text-[#4963C8]" /> Hierarchy
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#7E7C77] mt-1">
                    Ended {meeting.timeAgo || meeting.duration + " ago"} · Duration: {meeting.duration}
                  </p>
                  {meeting.hostName && (
                    <p className="text-[10px] text-[#7E7C77] mt-0.5">Host: {meeting.hostName}</p>
                  )}
                </div>

                <div className="mt-3 flex gap-1.5">
                  <span className="flex items-center gap-1 rounded-[3px] bg-[#FAF9F6] px-1.5 py-0.5 text-[10px] font-medium text-[#585754] border border-[#D8D4CB]">
                    <Video className="h-2.5 w-2.5" /> Recording
                  </span>
                  <span className="flex items-center gap-1 rounded-[3px] bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] font-medium text-[#4963C8] border border-[#CBD5E1]">
                    <Shield className="h-2.5 w-2.5" /> Summary
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#E8E5DD] pt-2.5">
                  <div className="flex -space-x-1">
                    {(meeting.participants || ["Participant"]).slice(0, 4).map((p, i) => (
                      <div
                        key={i}
                        className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-white bg-[#252932] text-[8px] font-bold text-[#F3F3EE]"
                        title={p}
                      >
                        {getInitials(p)}
                      </div>
                    ))}
                    {(meeting.participantsCount || meeting.participants?.length || 1) > 4 && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-white bg-[#FAF9F6] text-[8px] font-bold text-[#7E7C77]">
                        +{(meeting.participantsCount || meeting.participants?.length || 1) - 4}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => meeting.meetingCode && navigate(`/meeting/${meeting.meetingCode}`, { state: { fromOrgId: organizationId, fromTab: "Meetings" } })} 
                    className="rounded-[5px] border border-[#D8D4CB] bg-white px-2.5 py-1 text-[11px] font-medium text-[#585754] transition hover:bg-[#FAF9F6] hover:text-[#242427]"
                  >
                    Details
                  </button>
                </div>
              </article>
            ))}
          </Carousel>
        ) : (
          <div className="rounded-[6px] border border-dashed border-[#D8D4CB] p-6 text-center bg-white text-xs text-[#7E7C77]">
            <Clock className="mx-auto h-6 w-6 text-[#A6A49F] mb-1.5" />
            <p className="font-medium text-[#242427]">No recently ended meetings</p>
            <p className="text-[11px] text-[#7E7C77] mt-0.5">Completed meetings and archived summaries will automatically appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default MeetingsTab;
