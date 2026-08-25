import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import { notifications } from "../lib/mockData";

const user = {
  name: "Suryansh",
  // A backend response will eventually replace this mock value.
  avatarUrl: null as string | null,
};

/**
 * The persistent header owns global identity and search controls. Keeping it separate
 * means every future page can reuse one consistent header rather than copying its markup.
 */
function TopHeader() {
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<"incoming" | "outgoing">("incoming");
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const incomingNotifications = notifications.filter((item) => item.direction === "incoming");
  const outgoingNotifications = notifications.filter((item) => item.direction === "outgoing");

  // `??` uses the fallback only for null or undefined. An empty string is kept as a
  // deliberate backend value, unlike `||`, which would treat it as missing.
  const avatar =
    user.avatarUrl ??
    "https://ui-avatars.com/api/?name=Suryansh&background=111827&color=ffffff";

  return (
    <header className="flex h-24 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-8">
      <div className="flex items-center gap-4">
        <img
          className="size-12 rounded-full border border-zinc-800 object-cover"
          src={avatar}
          alt={`${user.name}'s profile`}
        />
        <div>
          {isHomePage ? (
            <>
              <p className="text-lg font-semibold text-white">Good morning, {user.name}</p>
              <p className="mt-1 text-sm text-zinc-400">Hope you have a productive day.</p>
            </>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Home
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SearchBar />
        <NotificationBell
          incoming={incomingNotifications}
          outgoing={outgoingNotifications}
          isOpen={isNotificationsOpen}
          activeTab={activeNotificationTab}
          onToggle={() => setNotificationsOpen((current) => !current)}
          onTabChange={(tab) => setActiveNotificationTab(tab)}
        />
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-sm font-semibold text-white">
          SR
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
