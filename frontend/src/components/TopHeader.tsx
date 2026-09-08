import { API_BASE_URL } from "../lib/api";
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import FriendRequestBell from "./FriendRequestBell";
import UserAvatar from "./UserAvatar";
import { useAuth } from "../context/AuthContext";
import { LogOut, ShieldCheck, Home } from "lucide-react";
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
      const incomingRes = await fetch(`${API_BASE_URL}/api/invitations/user/${user.id}`);
      if (incomingRes.ok) {
        const data = await incomingRes.json();
        setIncomingInvites(data.invitations || []);
      }

      // 2. Fetch sent invitations created by this user
      const outgoingRes = await fetch(`${API_BASE_URL}/api/invitations/sent/${user.id}`);
      if (outgoingRes.ok) {
        const data = await outgoingRes.json();
        setOutgoingInvites(data.invitations || []);
      }

      // 3. Fetch meeting invitations for this user (all organizations)
      const meetingRes = await fetch(`${API_BASE_URL}/api/meetings/invitations/user/${user.id}`);
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
    const interval = setInterval(fetchInvitations, 6000);
    return () => clearInterval(interval);
  }, [fetchInvitations]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-18 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md px-6 lg:px-8 text-[#1E293B]">
      <div className="flex items-center gap-3.5">
        <UserAvatar
          name={displayName}
          avatarUrl={user?.avatarUrl}
          size="md"
          className="shadow-xs"
        />
        <div>
          {isHomePage ? (
            <>
              <p className="text-sm font-semibold tracking-tight text-[#1E293B]">
                Good morning, {displayName}
              </p>
              <p className="text-xs text-[#64748B]">
                {user?.username ? (
                  <span className="font-mono text-[#3B82F6] mr-1.5">@{user.username} ·</span>
                ) : null}
                Hope you have a productive day.
              </p>
            </>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#1E293B] shadow-2xs transition hover:bg-[#F8FAFC]"
            >
              <Home className="h-3.5 w-3.5 text-[#64748B]" />
              Home
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchBar />
        <FriendRequestBell onRefresh={fetchInvitations} />
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
            className="flex items-center justify-center rounded-[6px] transition focus:outline-none"
            title={`${displayName} (${displayEmail})`}
          >
            <UserAvatar
              name={displayName}
              avatarUrl={user?.avatarUrl}
              size="sm"
              className="hover:border-[#3B82F6] transition-colors shadow-2xs"
            />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[8px] border border-[#E2E8F0] bg-white/95 backdrop-blur-lg p-2.5 shadow-xl text-[#1E293B]">
              <div className="border-b border-[#E2E8F0] p-2 pb-3">
                <p className="text-xs font-semibold text-[#1E293B] truncate">{displayName}</p>
                {user?.username && (
                  <p className="text-[11px] font-mono text-[#3B82F6]">@{user.username}</p>
                )}
                <p className="text-[11px] text-[#64748B] truncate">{displayEmail}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-[#0D9488]">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Google Authenticated</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-xs font-medium text-[#EF4444] transition hover:bg-[#EF4444]/10 hover:text-[#DC2626]"
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
