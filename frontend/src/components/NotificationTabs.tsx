interface NotificationTabsProps {
  active: "incoming" | "outgoing";
  incomingCount?: number;
  outgoingCount?: number;
  onChange: (tab: "incoming" | "outgoing") => void;
}

function NotificationTabs({
  active,
  incomingCount = 0,
  outgoingCount = 0,
  onChange,
}: NotificationTabsProps) {
  return (
    <div className="flex rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1">
      <button
        type="button"
        onClick={() => onChange("incoming")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
          active === "incoming" ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
        }`}
      >
        <span>Received Invites</span>
        {incomingCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              active === "incoming" ? "bg-emerald-600 text-white" : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {incomingCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange("outgoing")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
          active === "outgoing" ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
        }`}
      >
        <span>Sent Invites</span>
        {outgoingCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              active === "outgoing" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {outgoingCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default NotificationTabs;
