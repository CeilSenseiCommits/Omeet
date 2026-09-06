import { useNavigate } from "react-router-dom";
import type { Organization } from "../types/organization";
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
      className="group flex w-72 shrink-0 flex-col justify-between rounded-[8px] border border-[#E2E8F0] bg-white p-4 text-left shadow-xs transition-all hover:border-[#0D9488]/60 hover:shadow-md"
    >
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#1E293B] shadow-2xs">
            {organization.avatarUrl ? (
              <img src={organization.avatarUrl} alt={organization.name} className="h-full w-full rounded-[6px] object-cover" referrerPolicy="no-referrer" />
            ) : (
              organization.initials || organization.name.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[#1E293B] group-hover:text-[#0D9488] transition-colors">
              {organization.name}
            </h3>
            {organization.position ? (
              <p className="truncate text-xs text-[#64748B] mt-0.5">
                {organization.position}
                {organization.department ? ` · ${organization.department}` : ""}
              </p>
            ) : (
              <p className="truncate text-xs text-[#64748B] mt-0.5">
                {organization.description || "Workspace"}
              </p>
            )}
          </div>
        </div>

        {(organization.brief || organization.description) && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#475569]">
            {organization.brief || organization.description}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-[#F1F5F9] pt-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Clock className="h-3 w-3 text-[#94A3B8] shrink-0" />
          <span className="uppercase tracking-wider text-[10px]">
            Activity:
          </span>
          <span className="text-[#475569] font-medium">{organization.lastActivity || "Recently active"}</span>
        </div>
      </div>
    </button>
  );
}

export default OrganizationCard;
