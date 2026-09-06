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
    <nav className="space-y-2" aria-label={title}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
            item.active
              ? "bg-zinc-800 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-base shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </div>
          {typeof item.badge === "number" && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-sm">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

export default SidebarNav;
