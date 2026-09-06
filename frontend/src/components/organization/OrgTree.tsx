import { useState } from "react";
import type { DepartmentNode } from "../../types/organization";

interface OrgTreeProps {
  node: DepartmentNode;
  level?: number;
  onSelect?: (node: DepartmentNode) => void;
  selectedId?: string;
}

function OrgTree({ node, level = 0, onSelect, selectedId }: OrgTreeProps) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedId === node.id;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => {
          if (node.children?.length) {
            setExpanded((value) => !value);
          }
          onSelect?.(node);
        }}
        className={`flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left transition ${
          isSelected ? "bg-[#252932] text-[#F3F3EE]" : "text-[#A9ACB4] hover:bg-[#252932]/70 hover:text-[#F3F3EE]"
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <span className="text-sm text-zinc-500">{node.children?.length ? (expanded ? "▾" : "▸") : "•"}</span>
        <span className="text-sm font-medium">{node.name}</span>
      </button>

      {expanded && node.children?.length ? (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <OrgTree key={child.id} node={child} level={level + 1} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default OrgTree;
