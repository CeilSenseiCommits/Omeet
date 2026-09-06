import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../context/AuthContext";
import { LogOut, ShieldCheck } from "lucide-react";
import type { IncomingInvitation, OutgoingInvitation, MeetingInvitation } from "../types/invitation";

/**
 * The persistent header owns global identity, live member search, and organization invitation notifications.
 * It connects to useAuth() to display the authenticated Google profile and provides a Sign Out action.
 */
function TopHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<"incoming" | "meetings" | "outgoing">("incoming");
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvitation[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<OutgoingInvitation[]>([]);
  const [meetingInvites, setMeetingInvites] = useState<MeetingInvitation[]>([]);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Query live invitations from Neon PostgreSQL database
  const fetchInvitations = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Fetch received pending invitations for user
      const incomingRes = await fetch(`http://localhost:5000/api/invitations/user/${user.id}`);
      if (incomingRes.ok) {
        const data = await incomingRes.json();
        setIncomingInvites(data.invitations || []);
      }

      // 2. Fetch sent invitations created by this user
      const outgoingRes = await fetch(`http://localhost:5000/api/invitations/sent/${user.id}`);
      if (outgoingRes.ok) {
        const data = await outgoingRes.json();
        setOutgoingInvites(data.invitations || []);
      }

      // 3. Fetch meeting invitations for this user (all organizations)
      const meetingRes = await fetch(`http://localhost:5000/api/meetings/invitations/user/${user.id}`);
      if (meetingRes.ok) {
        const data = await meetingRes.json();
        setMeetingInvites(data.invitations || []);
      }
    } catch (err) {
      console.warn("Could not query live invitations:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const displayName = user?.name || "Suryansh";
  const displayEmail = user?.email || "suryansh@example.com";
  const avatar =
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=111827&color=ffffff`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-24 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-8">
      <div className="flex items-center gap-4">
        <img
          className="size-12 rounded-full border border-zinc-800 object-cover"
          src={avatar}
          alt={`${displayName}'s profile`}
        />
        <div>
          {isHomePage ? (
            <>
              <p className="text-lg font-semibold text-white">Good morning, {displayName}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {user?.username ? (
                  <span className="font-mono text-blue-400 mr-1.5">@{user.username} •</span>
                ) : null}
                Hope you have a productive day.
              </p>
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
          incoming={incomingInvites}
          outgoing={outgoingInvites}
          meetingInvitations={meetingInvites}
          isOpen={isNotificationsOpen}
          activeTab={activeNotificationTab}
          userId={user?.id}
          onToggle={() => {
            setNotificationsOpen((current) => !current);
            setIsProfileMenuOpen(false);
          }}
          onClose={() => setNotificationsOpen(false)}
          onTabChange={(tab) => setActiveNotificationTab(tab)}
          onRefresh={fetchInvitations}
        />

        {/* User Profile Menu with Sign Out */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-semibold text-white transition hover:border-zinc-500 hover:ring-2 hover:ring-zinc-700 focus:outline-none overflow-hidden"
            title={`${displayName} (${displayEmail})`}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              user?.initials || "SR"
            )}
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-2xl backdrop-blur-md">
              <div className="border-b border-zinc-800 p-2 pb-3">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                {user?.username && (
                  <p className="text-[11px] font-mono text-blue-400">@{user.username}</p>
                )}
                <p className="text-[11px] text-zinc-400 truncate">{displayEmail}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-blue-400">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Google Authenticated</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
