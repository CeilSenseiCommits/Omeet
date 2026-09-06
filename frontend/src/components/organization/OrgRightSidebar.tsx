import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  if (isCollapsed) {
    return (
      <aside className="flex h-full w-[54px] shrink-0 flex-col items-center border-l border-[#D8D4CB] bg-[#FAF9F6] py-3 transition-all duration-300">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#D8D4CB] bg-[#EDE9DF] text-[#7E7C77] hover:text-[#242427] transition-colors"
          aria-label="Expand right panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-5 flex flex-col items-center gap-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[#EDE9DF] border border-[#D8D4CB] text-[10px] font-bold text-[#242427]" title={organization.name}>
            {getInitials(organization.name)}
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Workspace Active" />
          <div title="Privacy settings">
            <Lock className="h-3.5 w-3.5 text-[#7E7C77]" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-l border-[#D8D4CB] bg-[#FAF9F6] p-4 text-[#242427] transition-all duration-300 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-[#D8D4CB] bg-[#EDE9DF] text-[#7E7C77] hover:text-[#242427] hover:bg-[#E2DDD0] transition"
          aria-label="Collapse panel"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77]">
          Workspace Details
        </span>
      </div>

      <div className="flex items-center gap-3 mb-6 p-2.5 rounded-[5px] border border-[#D8D4CB] bg-white shadow-xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-[#EDE9DF] border border-[#D8D4CB] text-xs font-bold text-[#242427]">
          {getInitials(organization.name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#242427] text-xs truncate">{organization.name}</p>
          <p className="text-[11px] text-[#7E7C77] mt-0.5">{organization.memberCount} members</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77] mb-2.5">Workspace Status</p>
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {organization.status} <span className="text-[#7E7C77] text-[10px]">·</span> {organization.activeMeetings} active sessions
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77] mb-2.5">Privacy</p>
          <div className="flex gap-2">
            <Lock className="h-3.5 w-3.5 text-[#7E7C77] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-[#585754]">
              Meeting recordings and metadata follow this organization's retention policy.
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77] mb-2.5">Quick Actions</p>
          <nav className="space-y-0.5">
            {[
              {
                icon: UserPlus,
                label: "Invite Members",
                action: () => navigate(`/organization/${organization.id}/invite`),
              },
              { icon: Settings, label: "Settings" },
              { icon: BarChart, label: "Analytics" },
              { icon: CreditCard, label: "Billing & Plan" },
            ].map((link, i) => (
              <button
                key={i}
                type="button"
                onClick={link.action}
                className="group flex w-full items-center justify-between rounded-[5px] px-2 py-1.5 text-xs font-medium text-[#585754] hover:bg-[#EDE9DF] hover:text-[#242427] transition"
              >
                <span className="flex items-center gap-2.5">
                  <link.icon className="h-3.5 w-3.5 text-[#7E7C77] group-hover:text-[#242427]" />
                  {link.label}
                </span>
                <ChevronRight className="h-3 w-3 text-[#7E7C77] group-hover:text-[#242427]" />
              </button>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77] mb-2">Storage</p>
          <div className="h-1.5 w-full overflow-hidden rounded-[2px] bg-[#EDE9DF] border border-[#D8D4CB]">
            <div className="h-full rounded-[2px] bg-[#4963C8]" style={{ width: "23%" }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-[#7E7C77]">
            <span>238 GB of 1 TB used</span>
            <span className="text-[#242427] font-semibold">23%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default OrgRightSidebar;
