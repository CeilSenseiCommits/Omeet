import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrganizationCard from "./OrganizationCard";
import JoinOrganizationModal from "./JoinOrganizationModal";
import type { Organization } from "../types/organization";
import { Building2, Plus } from "lucide-react";

interface OrganizationCarouselProps {
  organizations: Organization[];
  isLoading?: boolean;
}

function OrganizationCarousel({ organizations, isLoading }: OrganizationCarouselProps) {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="rounded-[10px] border border-[#E2E8F0] bg-gradient-to-br from-white via-white to-[#F0FDFA]/40 p-5 shadow-xs">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            Workspaces
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-[#1E293B]">
            Your Organizations
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJoinOpen(true)}
            className="rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] transition-all shadow-2xs"
          >
            Join Organization
          </button>

          <button
            type="button"
            onClick={() => navigate("/create-organization")}
            className="flex items-center gap-1.5 rounded-[6px] bg-gradient-to-r from-[#0D9488] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Workspace
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="mt-5 flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#0D9488]" />
        </div>
      ) : organizations.length > 0 ? (
        /* Carousel with Cards */
        <div className="mt-4 flex gap-3.5 overflow-x-auto pb-1.5">
          {organizations.map((organization) => (
            <OrganizationCard key={organization.id} organization={organization} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="mt-4 rounded-[8px] border border-dashed border-[#CBD5E1] bg-white/70 p-8 text-center">
          <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]">
            <Building2 className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-semibold text-[#1E293B]">No organizations joined yet</h3>
          <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
            You are not currently part of any workspace. Join using an invitation code shared by your team, or establish your own.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
            >
              Enter Code
            </button>
            <button
              type="button"
              onClick={() => navigate("/create-organization")}
              className="rounded-[6px] bg-gradient-to-r from-[#0D9488] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs"
            >
              Create Workspace
            </button>
          </div>
        </div>
      )}

      <JoinOrganizationModal
        open={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />
    </section>
  );
}

export default OrganizationCarousel;
