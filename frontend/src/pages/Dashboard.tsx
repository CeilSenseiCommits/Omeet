import { useEffect, useState } from "react";
import ActivityFeed from "../components/ActivityFeed";
import AppLayout from "../components/AppLayout";
import MeetSection from "../components/MeetSection";
import OrganizationCarousel from "../components/OrganizationCarousel";
import SidebarNav from "../components/SidebarNav";
import { fetchUserOrganizations, recentActivity, type Organization } from "../lib/mockData";
import { useAuth } from "../context/AuthContext";

const primaryNavItems = [
  { id: "dashboard", label: "Dashboard", icon: "◉", active: true },
  { id: "organizations", label: "Organizations", icon: "◌" },
  { id: "meetings", label: "Meetings", icon: "◌" },
  { id: "people", label: "People", icon: "◌" },
  { id: "notifications", label: "Notifications", icon: "◌" },
];

const utilityNavItems = [
  { id: "profile", label: "Profile", icon: "◎" },
  { id: "settings", label: "Settings", icon: "⚙" },
  { id: "privacy", label: "Privacy", icon: "◐" },
  { id: "appearance", label: "Appearance", icon: "☼" },
  { id: "ai", label: "AI Assistant", icon: "✦" },
];

/**
 * Dashboard is the primary home page experience:
 * - On load, it queries the database for the authenticated user's joined organizations.
 * - If the user has joined organizations, they appear in the carousel.
 * - If the user has NOT joined any organization, an empty state is shown.
 */
function Dashboard() {
  const { user } = useAuth();
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  useEffect(() => {
    async function loadOrganizations() {
      if (!user?.id) return;
      setIsLoadingOrgs(true);
      try {
        const orgs = await fetchUserOrganizations(user.id);
        setUserOrganizations(orgs);
      } catch (err) {
        console.error("Failed to load user organizations from database:", err);
      } finally {
        setIsLoadingOrgs(false);
      }
    }

    loadOrganizations();

    window.addEventListener("organization-updated", loadOrganizations);
    return () => {
      window.removeEventListener("organization-updated", loadOrganizations);
    };
  }, [user?.id]);

  const userDisplayName = user?.name || "User";
  const userInitials = user?.initials || "U";
  const primaryRole = userOrganizations[0]?.position || "Team Member";

  return (
    <AppLayout
      leftRail={
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Primary
            </p>
            <div className="mt-3">
              <SidebarNav items={primaryNavItems} title="Primary navigation" />
            </div>
          </div>
        </div>
      }
      rightRail={
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{userDisplayName}</p>
                <p className="truncate text-xs text-zinc-400">{primaryRole}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Utilities
            </p>
            <div className="mt-3">
              <SidebarNav items={utilityNavItems} title="Utility navigation" />
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <OrganizationCarousel
          organizations={userOrganizations}
          isLoading={isLoadingOrgs}
        />
        <MeetSection />
        <ActivityFeed activities={recentActivity} />
      </div>
    </AppLayout>
  );
}

export default Dashboard;
