import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrganizationCard from "./OrganizationCard";
import JoinOrganizationModal from "./JoinOrganizationModal";
import type { Organization } from "../lib/mockData";
import { Building2 } from "lucide-react";

interface OrganizationCarouselProps {
  organizations: Organization[];
  isLoading?: boolean;
}

function OrganizationCarousel({ organizations, isLoading }: OrganizationCarouselProps) {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">
            Your Organizations
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            Stay close to the work that matters
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            Join Organization
          </button>

          <button
            onClick={() => navigate("/create-organization")}
            className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 transition"
          >
            Create Organization
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : organizations.length > 0 ? (
        /* Carousel with Cards */
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {organizations.map((organization) => (
            <OrganizationCard key={organization.id} organization={organization} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No organizations joined yet</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
            You are not currently part of any workspace. Join an organization using an invitation code shared by your team, or create your own.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition"
            >
              Enter Invite Code
            </button>
            <button
              onClick={() => navigate("/create-organization")}
              className="rounded-full bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-white/90 transition"
            >
              Create Organization
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
