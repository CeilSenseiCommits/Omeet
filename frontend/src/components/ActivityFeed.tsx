import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ActivityItem } from "../types/organization";

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77]">Pulse</p>
        <h2 className="text-base font-bold text-[#242427]">Recent Activity</h2>
      </div>

      {isLoading ? (
        <div className="rounded-[8px] border border-[#E2E8F0] bg-white p-6 text-center">
          <p className="text-xs text-[#64748B]">Loading activity...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-[#CBD5E1] bg-white/70 p-6 text-center">
          <p className="text-xs text-[#64748B]">No recent activity recorded yet.</p>
        </div>
      ) : isExpanded ? (
        /* Expanded scrollable view */
        <div className="space-y-2">
          <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: "thin" }}>
            <ul className="space-y-2">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-start gap-3 rounded-[8px] border border-[#E2E8F0] bg-white p-3.5 shadow-xs"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0D9488]" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-[#1E293B]">{activity.organization}</p>
                      <p className="text-[11px] text-[#64748B]">{activity.timestamp}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-[#475569] leading-relaxed">{activity.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#E2E8F0] bg-white/90 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] transition-colors shadow-2xs"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span>Show less</span>
          </button>
        </div>
      ) : (
        /* Collapsed view: at most 4 items, 5th item is Show More */
        <ul className="space-y-2">
          {activities.slice(0, 4).map((activity) => (
            <li
              key={activity.id}
              className="flex items-start gap-3 rounded-[8px] border border-[#E2E8F0] bg-white p-3.5 shadow-xs"
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0D9488]" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-[#1E293B]">{activity.organization}</p>
                  <p className="text-[11px] text-[#64748B]">{activity.timestamp}</p>
                </div>
                <p className="mt-0.5 text-xs text-[#475569] leading-relaxed">{activity.description}</p>
              </div>
            </li>
          ))}

          {/* 5th element: Show more options */}
          {activities.length > 4 && (
            <li>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#CBD5E1] bg-white/90 p-3 text-xs font-semibold text-[#4963C8] hover:border-[#4963C8] hover:bg-[#EEF2FF]/60 transition-all shadow-2xs group"
              >
                <span>Show more activities (+{activities.length - 4} more)</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

export default ActivityFeed;
