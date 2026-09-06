import { useNavigate } from "react-router-dom";
import type { Notification } from "../lib/mockData";

interface NotificationItemProps {
  notification: Notification;
}

function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 transition hover:bg-zinc-800/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <p className="text-sm font-semibold text-white">{notification.title}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{notification.message}</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">
            <span>{notification.type}</span>
            <span className="text-zinc-700">•</span>
            <span>{notification.createdAt}</span>
          </div>
        </div>

        {notification.status ? (
          <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {notification.status}
          </span>
        ) : null}
      </div>

      {notification.type === "ORG_INVITATION" && notification.invitationId && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => navigate(`/invitation-preview/${notification.invitationId}`)}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black hover:bg-white/90 transition"
          >
            Preview Invitation
          </button>
        </div>
      )}
    </article>
  );
}

export default NotificationItem;
