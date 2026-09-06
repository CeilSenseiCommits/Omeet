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
    <div className="flex h-full flex-col rounded-[6px] border border-[#383D47] bg-[#252932] p-5 text-[#F3F3EE]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A9ACB4]">Department Insights</p>
          <h2 className="mt-1 text-base font-semibold text-[#F3F3EE]">{department.name}</h2>
        </div>
        <span className="rounded-[3px] border border-[#383D47] bg-[#1D2026] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
          {organization.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[5px] border border-[#383D47] bg-[#1D2026] p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">{stat.label}</p>
            <p className="mt-1 text-xs font-semibold text-[#F3F3EE]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[5px] border border-[#383D47] bg-[#1D2026] p-3">
        <p className="text-xs leading-relaxed text-[#C8C6C0]">{department.description}</p>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="rounded-[5px] border border-[#383D47] bg-[#1D2026] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Recent activity</p>
          <p className="mt-1 text-xs text-[#C8C6C0]">{department.recentActivity}</p>
        </div>

        <div className="rounded-[5px] border border-[#383D47] bg-[#1D2026] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">AI summary</p>
          <p className="mt-1 text-xs text-[#C8C6C0]">{organization.aiSummary}</p>
        </div>
      </div>
    </div>
  );
}

export default DepartmentDetailsPanel;
