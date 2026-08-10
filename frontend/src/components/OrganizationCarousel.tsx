import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrganizationCard from "./OrganizationCard";
import JoinOrganizationModal from "./JoinOrganizationModal";
import type { Organization } from "../lib/mockData";

interface OrganizationCarouselProps {
  organizations: Organization[];
}

function OrganizationCarousel({ organizations }: OrganizationCarouselProps) {
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
            onClick={() => navigate("/createOrganization")}
            className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 transition"
          >
            Create Organization
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {organizations.map((organization) => (
          <OrganizationCard key={organization.id} organization={organization} />
        ))}
      </div>

      <JoinOrganizationModal
        open={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />
    </section>
  );
}

export default OrganizationCarousel;
