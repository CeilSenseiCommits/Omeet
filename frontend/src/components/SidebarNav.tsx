interface SidebarNavProps {
  items: Array<{
    id: string;
    label: string;
    icon: string;
    active?: boolean;
  }>;
  title: string;
}

function SidebarNav({ items, title }: SidebarNavProps) {
  return (
    <nav className="space-y-2" aria-label={title}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
            item.active
              ? "bg-zinc-800 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
          }`}
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default SidebarNav;
