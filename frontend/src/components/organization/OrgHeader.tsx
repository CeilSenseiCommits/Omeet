import type { OrganizationDetails } from "../../types/organization";

interface OrgHeaderProps {
  organization: OrganizationDetails;
  onBack: () => void;
}

function OrgHeader({ organization, onBack }: OrgHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-[28px] border border-zinc-800 bg-zinc-900/90 p-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          ← Dashboard
        </button>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${organization.accent} text-sm font-semibold text-white`}>
          {organization.initials}
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-white">{organization.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">{organization.description}</p>
          <p className="mt-2 text-sm text-zinc-500">
            {organization.memberCount} members • {organization.activeMeetings} active meetings • {organization.status}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-700">
          Create Meeting
        </button>
        <button className="rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-2.5 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-800">
          Join Meeting
        </button>
      </div>
    </div>
  );
}

export default OrgHeader;
