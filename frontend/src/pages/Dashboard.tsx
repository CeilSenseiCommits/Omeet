import { useEffect, useState } from "react";
import ActivityFeed from "../components/ActivityFeed";
import AppLayout from "../components/AppLayout";
import MeetSection from "../components/MeetSection";
import OrganizationCarousel from "../components/OrganizationCarousel";
import SidebarNav from "../components/SidebarNav";
import { fetchUserOrganizations, recentActivity, type Organization } from "../lib/mockData";
import { useAuth } from "../context/AuthContext";

// Home page views
import HomeOrganizationsView from "../components/home/HomeOrganizationsView";
import HomeMeetingsView from "../components/home/HomeMeetingsView";
import HomePeopleView from "../components/home/HomePeopleView";
import HomeGroupsView from "../components/home/HomeGroupsView";
import HomeNotificationsView from "../components/home/HomeNotificationsView";

type HomeTab = "dashboard" | "organizations" | "meetings" | "people" | "groups" | "notifications";

const utilityNavItems = [
  { id: "profile", label: "Profile", icon: "◎" },
  { id: "settings", label: "Settings", icon: "⚙" },
  { id: "privacy", label: "Privacy", icon: "◐" },
  { id: "appearance", label: "Appearance", icon: "☼" },
  { id: "ai", label: "AI Assistant", icon: "✦" },
];

/**
 * Dashboard is the primary home page experience supporting 6 dedicated workspaces:
 * - Dashboard: Overview carousel, quick meeting launch, activity feed
 * - Organizations: Detailed cards with "More Info" (public page) and "Go to Dashboard"
 * - Meetings: Meetings Hub with Instant & Scheduled meeting creation, upcoming, and recent feeds
 * - People: Personal friends space with 1-on-1 direct chat, "+ Add Friend", and "Invite to Meet"
 * - Groups: Personal/global groups with group chat, member roster, and group video call initiation
 * - Notifications: Unified notifications feed with Org invites, Meeting invites, and Friend requests
 */
function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<HomeTab>("dashboard");
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

  const primaryNavItems = [
    { id: "dashboard", label: "Dashboard", icon: "◉", active: activeTab === "dashboard" },
    { id: "organizations", label: "Organizations", icon: "🏢", active: activeTab === "organizations" },
    { id: "meetings", label: "Meetings", icon: "📹", active: activeTab === "meetings" },
    { id: "people", label: "People", icon: "👥", active: activeTab === "people" },
    { id: "groups", label: "Groups", icon: "💬", active: activeTab === "groups" },
    { id: "notifications", label: "Notifications", icon: "🔔", active: activeTab === "notifications" },
  ];

  const handleNavSelect = (id: string) => {
    if (["dashboard", "organizations", "meetings", "people", "groups", "notifications"].includes(id)) {
      setActiveTab(id as HomeTab);
    }
  };

  return (
    <AppLayout
      leftRail={
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Primary
            </p>
            <div className="mt-3">
              <SidebarNav
                items={primaryNavItems}
                title="Primary navigation"
                onSelect={handleNavSelect}
              />
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
      {/* Exclusive View Display */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          <OrganizationCarousel
            organizations={userOrganizations}
            isLoading={isLoadingOrgs}
          />
          <MeetSection />
          <ActivityFeed activities={recentActivity} />
        </div>
      )}

      {activeTab === "organizations" && (
        <HomeOrganizationsView
          organizations={userOrganizations}
          isLoading={isLoadingOrgs}
        />
      )}

      {activeTab === "meetings" && <HomeMeetingsView />}

      {activeTab === "people" && <HomePeopleView />}

      {activeTab === "groups" && <HomeGroupsView />}

      {activeTab === "notifications" && <HomeNotificationsView />}
    </AppLayout>
  );
}

export default Dashboard;
