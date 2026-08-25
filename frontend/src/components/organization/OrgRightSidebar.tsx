import { ChevronLeft, Lock, UserPlus, Settings, BarChart, CreditCard, ChevronRight } from "lucide-react";
import type { OrganizationDetails } from "../../types/organization";

interface OrgRightSidebarProps {
  organization: OrganizationDetails;
  isCollapsed: boolean;
  onToggle: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function OrgRightSidebar({ organization, isCollapsed, onToggle }: OrgRightSidebarProps) {
  if (isCollapsed) {
    return (
      <aside className="flex h-full w-[60px] shrink-0 flex-col items-center border-l border-zinc-800/60 bg-[#111113] py-4 transition-all duration-300">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
          aria-label="Expand right panel"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="mt-6 flex flex-col items-center gap-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fuchsia-950 border border-fuchsia-900 text-xs font-bold text-fuchsia-200" title={organization.name}>
            {getInitials(organization.name)}
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Workspace Active" />
          <Lock className="h-4 w-4 text-zinc-500" title="Privacy settings" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-800/60 bg-[#111113] p-6 transition-all duration-300 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Collapse panel"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Organization Info
        </span>
      </div>

      <div className="flex items-center gap-4 mb-10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-950 border border-fuchsia-900 text-lg font-bold text-fuchsia-200">
          {getInitials(organization.name)}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{organization.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{organization.memberCount} members</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Workspace Status</p>
          <p className="text-sm font-medium text-emerald-500 flex items-center gap-2">
            {organization.status} <span className="text-zinc-600 text-[10px]">•</span> {organization.activeMeetings} meetings live
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Privacy</p>
          <div className="flex gap-3">
            <Lock className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-5 text-zinc-400">
              Meeting recordings and metadata follow this organization's retention policy.
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Quick Links</p>
          <nav className="space-y-1">
            {[
              { icon: UserPlus, label: "Invite Members" },
              { icon: Settings, label: "Organization Settings" },
              { icon: BarChart, label: "Workspace Analytics" },
              { icon: CreditCard, label: "Billing & Plan" },
            ].map((link, i) => (
              <button key={i} type="button" className="group flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition">
                <span className="flex items-center gap-3">
                  <link.icon className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300" />
                  {link.label}
                </span>
                <ChevronRight className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400" />
              </button>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Storage</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
            <div className="h-full rounded-full bg-fuchsia-900" style={{ width: "23%" }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-zinc-400">
            <span>238 GB of 1 TB used</span>
            <span className="text-white">23%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default OrgRightSidebar;
