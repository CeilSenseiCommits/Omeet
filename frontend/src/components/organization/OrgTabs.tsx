interface OrgTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const tabs = ["Hierarchy", "Meetings", "Members", "Files", "AI"];

function OrgTabs({ activeTab, onChange }: OrgTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[24px] border border-zinc-800 bg-zinc-900/80 p-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border border-zinc-700 bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
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
