import { useNavigate } from "react-router-dom";
import type { Organization } from "../lib/mockData";
import { Clock } from "lucide-react";

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
      className="group flex w-[320px] shrink-0 flex-col justify-between rounded-[28px] border border-zinc-800 bg-zinc-900/90 p-6 text-left shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] transition duration-200 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-800/90 hover:shadow-[0_26px_60px_-24px_rgba(0,0,0,0.8)]"
    >
      <div>
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${organization.accent} text-sm font-bold`}
          >
            {organization.initials}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white group-hover:text-zinc-100">
              {organization.name}
            </h3>
            {organization.position ? (
              <p className="truncate text-xs font-medium text-zinc-400 mt-0.5">
                {organization.position}
                {organization.department ? ` • ${organization.department}` : ""}
              </p>
            ) : (
              <p className="truncate text-xs text-zinc-400 mt-0.5">
                {organization.description || "Workspace"}
              </p>
            )}
          </div>
        </div>

        {(organization.brief || organization.description) && (
          <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {organization.brief || organization.description}
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-zinc-800/80 pt-3.5">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Last activity:
          </span>
          <span className="text-zinc-300 font-medium">{organization.lastActivity}</span>
        </div>
      </div>
    </button>
  );
}

export default OrganizationCard;
