interface OrgTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const tabs = ["Meetings", "Members", "Files", "AI"];

function OrgTabs({ activeTab, onChange }: OrgTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-[5px] border border-[#D8D4CB] bg-white p-1 shadow-xs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`rounded-[4px] px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border border-[#D8D4CB] bg-[#FAF9F6] text-[#242427] shadow-xs"
                : "border border-transparent text-[#7E7C77] hover:text-[#242427]"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

export default OrgTabs;
