import type { DepartmentNode, OrganizationDetails } from "../../types/organization";

interface DepartmentDetailsPanelProps {
  organization: OrganizationDetails;
  selectedDepartment: DepartmentNode | null;
}

function DepartmentDetailsPanel({ organization, selectedDepartment }: DepartmentDetailsPanelProps) {
  const department = selectedDepartment ?? organization.hierarchy;

  const stats = [
    { label: "Manager", value: department.manager },
    { label: "Members", value: `${department.members}` },
    { label: "Meetings", value: `${department.activeMeetings}` },
  ];

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Department Insights</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{department.name}</h2>
        </div>
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
          {organization.status}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-sm font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
        <p className="text-sm leading-6 text-zinc-400">{department.description}</p>
      </div>

      <div className="mt-6 space-y-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">Recent activity</p>
          <p className="mt-2 text-sm text-zinc-300">{department.recentActivity}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">AI summary</p>
          <p className="mt-2 text-sm text-zinc-300">{organization.aiSummary}</p>
        </div>
      </div>
    </div>
  );
}

export default DepartmentDetailsPanel;
