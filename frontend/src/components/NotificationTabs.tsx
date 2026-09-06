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
    <div className="flex rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange("incoming")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium transition ${
          active === "incoming" ? "bg-white text-[#242427] shadow-xs font-semibold" : "text-[#7E7C77] hover:text-[#242427]"
        }`}
      >
        <span>Org Invites</span>
        {incomingCount > 0 && (
          <span
            className={`rounded-[3px] px-1.5 py-0.2 text-[10px] font-bold ${
              active === "incoming" ? "bg-[#4963C8] text-white" : "bg-[#FAF9F6] text-[#4963C8]"
            }`}
          >
            {incomingCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange("meetings")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium transition ${
          active === "meetings" ? "bg-white text-[#242427] shadow-xs font-semibold" : "text-[#7E7C77] hover:text-[#242427]"
        }`}
      >
        <span>Meetings</span>
        {meetingsCount > 0 && (
          <span
            className={`rounded-[3px] px-1.5 py-0.2 text-[10px] font-bold ${
              active === "meetings" ? "bg-[#4963C8] text-white" : "bg-[#FAF9F6] text-[#4963C8]"
            }`}
          >
            {meetingsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange("outgoing")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium transition ${
          active === "outgoing" ? "bg-white text-[#242427] shadow-xs font-semibold" : "text-[#7E7C77] hover:text-[#242427]"
        }`}
      >
        <span>Sent</span>
        {outgoingCount > 0 && (
          <span
            className={`rounded-[3px] px-1.5 py-0.2 text-[10px] font-bold ${
              active === "outgoing" ? "bg-[#4963C8] text-white" : "bg-[#FAF9F6] text-[#4963C8]"
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
