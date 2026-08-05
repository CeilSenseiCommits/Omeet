import type { ActivityItem } from "../lib/mockData";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Recent Activity</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">A lightweight pulse of team momentum</h2>
      </div>

      <ul className="space-y-3">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
          >
            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${activity.dotClass}`} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{activity.organization}</p>
                <p className="text-xs text-zinc-500">{activity.timestamp}</p>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{activity.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ActivityFeed;
