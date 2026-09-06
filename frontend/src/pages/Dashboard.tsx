import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ActivityFeed from "../components/ActivityFeed";
import AppLayout from "../components/AppLayout";
import MeetSection from "../components/MeetSection";
import OrganizationCarousel from "../components/OrganizationCarousel";
import SidebarNav from "../components/SidebarNav";
import { fetchUserOrganizations, fetchUserActivity } from "../lib/api";
import type { Organization, ActivityItem } from "../types/organization";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/UserAvatar";

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
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as HomeTab | null;
  const [activeTab, setActiveTab] = useState<HomeTab>(
    tabParam && ["dashboard", "organizations", "meetings", "people", "groups", "notifications"].includes(tabParam)
      ? tabParam
      : "dashboard"
  );
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  useEffect(() => {
    const tab = searchParams.get("tab") as HomeTab | null;
    if (tab && ["dashboard", "organizations", "meetings", "people", "groups", "notifications"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

    async function loadActivity() {
      if (!user?.id) return;
      setIsLoadingActivities(true);
      try {
        const acts = await fetchUserActivity(user.id);
        setActivities(acts);
      } catch (err) {
        console.error("Failed to load user activity:", err);
      } finally {
        setIsLoadingActivities(false);
      }
    }

    loadOrganizations();
    loadActivity();

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
        <div className="space-y-4">
          <div>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#717684]">
              Workspace
            </p>
            <div className="mt-2">
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
        <div className="space-y-5">
          <div className="rounded-[8px] border border-[#E2E8F0] bg-white/90 p-3.5 text-[#1E293B] shadow-xs">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={userDisplayName}
                avatarUrl={user?.avatarUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#1E293B]">{userDisplayName}</p>
                <p className="truncate text-[11px] text-[#64748B]">{primaryRole}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              Utilities
            </p>
            <div className="mt-2">
              <SidebarNav items={utilityNavItems} title="Utility navigation" />
            </div>
          </div>
        </div>
      }
    >
      {/* Exclusive View Display */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <OrganizationCarousel
            organizations={userOrganizations}
            isLoading={isLoadingOrgs}
          />
          <MeetSection />
          <ActivityFeed activities={activities} isLoading={isLoadingActivities} />
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
