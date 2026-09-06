interface NotificationTabsProps {
  active: "incoming" | "meetings" | "outgoing";
  incomingCount?: number;
  meetingsCount?: number;
  outgoingCount?: number;
  onChange: (tab: "incoming" | "meetings" | "outgoing") => void;
}

function NotificationTabs({
  active,
  incomingCount = 0,
  meetingsCount = 0,
  outgoingCount = 0,
  onChange,
}: NotificationTabsProps) {
  return (
    <div className="flex rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange("incoming")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
          active === "incoming" ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
        }`}
      >
        <span>Org Invites</span>
        {incomingCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              active === "incoming" ? "bg-emerald-600 text-white" : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {incomingCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange("meetings")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
          active === "meetings" ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
        }`}
      >
        <span>Meetings</span>
        {meetingsCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              active === "meetings" ? "bg-fuchsia-600 text-white" : "bg-fuchsia-500/20 text-fuchsia-400"
            }`}
          >
            {meetingsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange("outgoing")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
          active === "outgoing" ? "bg-white text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
        }`}
      >
        <span>Sent</span>
        {outgoingCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
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
