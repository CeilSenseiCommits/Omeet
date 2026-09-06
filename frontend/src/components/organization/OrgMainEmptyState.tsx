import type { OrganizationDetails } from "../../types/organization";

interface OrgMainEmptyStateProps {
  organization: OrganizationDetails;
  onCreateMeeting: () => void;
  onJoinMeeting: () => void;
}

function OrgMainEmptyState({ organization, onCreateMeeting, onJoinMeeting }: OrgMainEmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[6px] border border-dashed border-[#D8D4CB] bg-[#FAF9F6] p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] text-xl text-[#4963C8]">
        ⧗
      </div>
      <h2 className="text-lg font-semibold text-[#242427]">Organization-scoped meetings</h2>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-[#585754]">
        {organization.name} doesn’t have a dedicated meeting workspace yet. Use create or join actions to start organization-scoped meetings for your teams.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={onCreateMeeting} className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-4 py-2 text-xs font-semibold text-white shadow-sm transition">
          Create Meeting
        </button>
        <button type="button" onClick={onJoinMeeting} className="rounded-[5px] border border-[#D8D4CB] bg-white px-4 py-2 text-xs font-medium text-[#242427] transition hover:bg-[#FAF9F6]">
          Join Meeting
        </button>
      </div>
    </div>
  );
}

export default OrgMainEmptyState;
