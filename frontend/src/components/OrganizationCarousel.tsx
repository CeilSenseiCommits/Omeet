import OrganizationCard from "./OrganizationCard";
import type { Organization } from "../lib/mockData";

interface OrganizationCarouselProps {
  organizations: Organization[];
}

function OrganizationCarousel({ organizations }: OrganizationCarouselProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">
            Your Organizations
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Stay close to the work that matters</h2>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {organizations.map((organization) => (
          <OrganizationCard key={organization.id} organization={organization} />
        ))}
      </div>
    </section>
  );
}

export default OrganizationCarousel;
