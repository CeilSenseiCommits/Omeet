import type { OrganizationDetails } from "../../types/organization";

interface OrgMainEmptyStateProps {
  organization: OrganizationDetails;
  onCreateMeeting: () => void;
  onJoinMeeting: () => void;
}

function OrgMainEmptyState({ organization, onCreateMeeting, onJoinMeeting }: OrgMainEmptyStateProps) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[32px] border border-dashed border-zinc-800 bg-zinc-950/80 p-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-fuchsia-500/10 text-2xl text-fuchsia-300">
        ⧗
      </div>
      <h2 className="text-2xl font-semibold text-white">Organization-scoped meetings</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
        {organization.name} doesn’t have a dedicated meeting workspace yet. Use create or join actions to start organization-scoped meetings for your teams.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onCreateMeeting} className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-800">
          Create Meeting
        </button>
        <button type="button" onClick={onJoinMeeting} className="rounded-2xl border border-zinc-700 bg-zinc-950/70 px-5 py-3 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-800">
          Join Meeting
        </button>
      </div>
    </div>
  );
}

export default OrgMainEmptyState;
