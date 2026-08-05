import ActivityFeed from "../components/ActivityFeed";
import AppLayout from "../components/AppLayout";
import MeetSection from "../components/MeetSection";
import OrganizationCarousel from "../components/OrganizationCarousel";
import SidebarNav from "../components/SidebarNav";
import { organizations, recentActivity } from "../lib/mockData";

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
 * Dashboard composes the three main center-column experiences. Keeping the page as a
 * shell allows the feature-specific UI to stay focused on one responsibility each.
 */
function Dashboard() {
  return (
    <AppLayout
      leftRail={
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Primary</p>
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
                SR
              </div>
              <div>
                <p className="font-semibold text-white">Suryansh Rao</p>
                <p className="text-sm text-zinc-400">Workspace admin</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Utilities</p>
            <div className="mt-3">
              <SidebarNav items={utilityNavItems} title="Utility navigation" />
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <OrganizationCarousel organizations={organizations} />
        <MeetSection />
        <ActivityFeed activities={recentActivity} />
      </div>
    </AppLayout>
  );
}

export default Dashboard;
