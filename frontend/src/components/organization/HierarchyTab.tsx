import { useMemo, useState } from "react";
import type { DepartmentNode, OrganizationDetails } from "../../types/organization";
import DepartmentDetailsPanel from "./DepartmentDetailsPanel";
import OrgTree from "./OrgTree";

interface HierarchyTabProps {
  organization: OrganizationDetails;
}

function HierarchyTab({ organization }: HierarchyTabProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentNode | null>(organization.hierarchy);

  const selectedDepartmentName = useMemo(() => selectedDepartment?.name ?? organization.hierarchy.name, [selectedDepartment, organization.hierarchy.name]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,32%)_1fr]">
      <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Hierarchy</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{selectedDepartmentName}</h3>
          </div>
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
            Interactive
          </span>
        </div>

        <div className="mt-5 space-y-1">
          <OrgTree node={organization.hierarchy} onSelect={setSelectedDepartment} selectedId={selectedDepartment?.id ?? organization.hierarchy.id} />
        </div>
      </div>

      <DepartmentDetailsPanel organization={organization} selectedDepartment={selectedDepartment} />
    </div>
  );
}

export default HierarchyTab;
