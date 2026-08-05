import { useNavigate } from "react-router-dom";
import type { Organization } from "../lib/mockData";

interface OrganizationCardProps {
  organization: Organization;
  onSelect?: (organization: Organization) => void;
}

function OrganizationCard({ organization, onSelect }: OrganizationCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        onSelect?.(organization);
        navigate(`/organization/${organization.id}`);
      }}
      className="group w-[320px] shrink-0 rounded-[28px] border border-zinc-800 bg-zinc-900/90 p-5 text-left shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] transition duration-200 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-800/90 hover:shadow-[0_26px_60px_-24px_rgba(0,0,0,0.8)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${organization.accent} text-sm font-semibold text-white`}
          >
            {organization.initials}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">{organization.name}</h3>
            <p className="mt-1 text-sm text-zinc-400">{organization.memberCount} members</p>
          </div>
        </div>

        <span className="rounded-full border border-zinc-700/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          Live
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">
            Active meetings
          </p>
          <p className="mt-1 text-lg font-semibold text-white">{organization.activeMeetings}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">
            Last activity
          </p>
          <p className="mt-1 text-sm text-zinc-300">{organization.lastActivity}</p>
        </div>
      </div>
    </button>
  );
}

export default OrganizationCard;
