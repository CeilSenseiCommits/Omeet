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
    <div className="grid gap-4 xl:grid-cols-[minmax(280px,32%)_1fr]">
      <div className="rounded-[6px] border border-[#383D47] bg-[#252932] p-4 text-[#F3F3EE]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A9ACB4]">Hierarchy</p>
            <h3 className="mt-1 text-base font-semibold text-[#F3F3EE]">{selectedDepartmentName}</h3>
          </div>
          <span className="rounded-[3px] border border-[#383D47] bg-[#1D2026] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
            Interactive
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <OrgTree node={organization.hierarchy} onSelect={setSelectedDepartment} selectedId={selectedDepartment?.id ?? organization.hierarchy.id} />
        </div>
      </div>

      <DepartmentDetailsPanel organization={organization} selectedDepartment={selectedDepartment} />
    </div>
  );
}

export default HierarchyTab;
