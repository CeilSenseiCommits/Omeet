import { useState } from "react";
import JoinMeetingModal from "./organization/JoinMeetingModal";
import CreatePublicMeetingModal from "./CreatePublicMeetingModal";
import { Video, ArrowUpRight, Plus } from "lucide-react";

function MeetSection() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <section className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Meetings</p>
        <h2 className="text-base font-bold text-[#1E293B]">Launch a Space for Collaboration</h2>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <article className="flex flex-col justify-between rounded-[8px] border border-[#E2E8F0] bg-gradient-to-br from-white via-white to-[#EFF6FF]/60 p-5 shadow-xs transition-all hover:shadow-sm hover:border-[#BFDBFE]">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] shadow-2xs">
              <Plus className="h-4 w-4" />
            </div>
            <h3 className="mt-3.5 text-sm font-semibold text-[#1E293B]">Create Meeting</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
              Start an instant or scheduled meeting with high-definition audio and video.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] px-3.5 py-2 text-xs font-medium text-white transition-all shadow-xs"
          >
            <Video className="h-3.5 w-3.5" />
            Create Open Meeting
          </button>
        </article>

        <article className="flex flex-col justify-between rounded-[8px] border border-[#E2E8F0] bg-gradient-to-br from-white via-white to-[#F0FDFA]/60 p-5 shadow-xs transition-all hover:shadow-sm hover:border-[#99F6E4]">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#99F6E4] bg-[#F0FDFA] text-[#0D9488] shadow-2xs">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <h3 className="mt-3.5 text-sm font-semibold text-[#1E293B]">Join Meeting</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
              Connect to an active session instantly using a meeting code or invitation URL.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-[6px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#1E293B] transition-all shadow-2xs"
          >
            Join with Code
          </button>
        </article>
      </div>

      <CreatePublicMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </section>
  );
}

export default MeetSection;
