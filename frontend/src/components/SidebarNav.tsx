interface SidebarNavProps {
  items: Array<{
    id: string;
    label: string;
    icon: string;
    active?: boolean;
    badge?: number;
  }>;
  title: string;
  onSelect?: (id: string) => void;
}

function SidebarNav({ items, title, onSelect }: SidebarNavProps) {
  return (
    <nav className="space-y-1" aria-label={title}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          className={`flex w-full items-center justify-between rounded-[6px] px-3 py-2 text-left text-xs font-medium transition ${
            item.active
              ? "border border-[#E2E8F0] bg-white text-[#1E293B] font-semibold shadow-xs"
              : "border border-transparent text-[#64748B] hover:bg-white/70 hover:text-[#1E293B]"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </div>
          {typeof item.badge === "number" && item.badge > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-[4px] bg-[#3B82F6] px-1 text-[10px] font-semibold text-white shadow-2xs">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

export default SidebarNav;
