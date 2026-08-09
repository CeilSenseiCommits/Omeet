interface NotificationTabsProps {
  active: "incoming" | "outgoing";
  onChange: (tab: "incoming" | "outgoing") => void;
}

function NotificationTabs({ active, onChange }: NotificationTabsProps) {
  return (
    <div className="flex rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1">
      <button
        type="button"
        onClick={() => onChange("incoming")}
        className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          active === "incoming" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
        }`}
      >
        Incoming
      </button>
      <button
        type="button"
        onClick={() => onChange("outgoing")}
        className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          active === "outgoing" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
        }`}
      >
        Outgoing
      </button>
    </div>
  );
}

export default NotificationTabs;
