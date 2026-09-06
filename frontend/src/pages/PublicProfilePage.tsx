import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import SidebarNav from "../components/SidebarNav";
import UserAvatar from "../components/UserAvatar";
import type { UserProfile } from "../types/user";
import { useAuth } from "../context/AuthContext";
import { 
  Building, 
  Building2, 
  UserPlus, 
  UserCheck, 
  Clock, 
  Check, 
  MessageSquare, 
  Loader2, 
  X 
} from "lucide-react";

function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOrg, setIsCheckingOrg] = useState(false);
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [showOrgSelectModal, setShowOrgSelectModal] = useState(false);

  // Friend actions state
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);
  const [friendActionFeedback, setFriendActionFeedback] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (currentUser?.id) {
        headers["x-user-id"] = currentUser.id;
      }

      const res = await fetch(`http://localhost:5000/api/users/profile/${userId}`, { headers });
      if (!res.ok) throw new Error("User not found in database");
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
      } else {
        setError("User profile not found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.id]);

  useEffect(() => {
    loadProfile();

    window.addEventListener("friends-updated", loadProfile);
    return () => {
      window.removeEventListener("friends-updated", loadProfile);
    };
  }, [loadProfile]);

  const handleSendFriendRequest = async () => {
    if (!currentUser?.id) {
      navigate("/login");
      return;
    }
    if (!profile) return;

    setIsFriendActionLoading(true);
    setFriendActionFeedback(null);
    try {
      const res = await fetch("http://localhost:5000/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ targetUserId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send friend request.");

      setProfile((prev) => prev ? { ...prev, friendshipStatus: "REQUEST_SENT" } : null);
      setFriendActionFeedback("Friend request sent!");
      window.dispatchEvent(new Event("friends-updated"));
      window.dispatchEvent(new Event("friend-request-updated"));
    } catch (err: any) {
      console.error("Failed to send friend request:", err);
      setFriendActionFeedback(err.message || "Failed to send request.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!currentUser?.id || !profile?.friendshipId) return;

    setIsFriendActionLoading(true);
    setFriendActionFeedback(null);
    try {
      const res = await fetch(`http://localhost:5000/api/friends/requests/${profile.friendshipId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({ action: "ACCEPT", userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept friend request.");

      setProfile((prev) => prev ? { ...prev, friendshipStatus: "FRIENDS" } : null);
      setFriendActionFeedback("Friend request accepted!");
      window.dispatchEvent(new Event("friends-updated"));
      window.dispatchEvent(new Event("friend-request-updated"));
    } catch (err: any) {
      console.error("Failed to accept friend request:", err);
      setFriendActionFeedback(err.message || "Failed to accept request.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!currentUser?.id || !profile?.friendshipId) return;

    setIsFriendActionLoading(true);
    setFriendActionFeedback(null);
    try {
      const res = await fetch(`http://localhost:5000/api/friends/${profile.friendshipId}`, {
        method: "DELETE",
        headers: { "x-user-id": currentUser.id },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel request.");
      }

      setProfile((prev) => prev ? { ...prev, friendshipStatus: "NONE", friendshipId: null } : null);
      setFriendActionFeedback("Request cancelled.");
      window.dispatchEvent(new Event("friends-updated"));
      window.dispatchEvent(new Event("friend-request-updated"));
    } catch (err: any) {
      console.error("Failed to cancel friend request:", err);
      setFriendActionFeedback(err.message || "Failed to cancel request.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!currentUser?.id || !profile?.friendshipId) return;
    if (!confirm(`Are you sure you want to remove ${profile.name} from your friends?`)) return;

    setIsFriendActionLoading(true);
    setFriendActionFeedback(null);
    try {
      const res = await fetch(`http://localhost:5000/api/friends/${profile.friendshipId}`, {
        method: "DELETE",
        headers: { "x-user-id": currentUser.id },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove friend.");
      }

      setProfile((prev) => prev ? { ...prev, friendshipStatus: "NONE", friendshipId: null } : null);
      setFriendActionFeedback("Friend removed.");
      window.dispatchEvent(new Event("friends-updated"));
      window.dispatchEvent(new Event("friend-request-updated"));
    } catch (err: any) {
      console.error("Failed to remove friend:", err);
      setFriendActionFeedback(err.message || "Failed to remove friend.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleInviteToOrg = async () => {
    if (!currentUser?.id) {
      navigate("/login");
      return;
    }

    if (!profile) return;
    if (currentUser.id === profile.id) {
      alert("You cannot invite yourself to an organization.");
      return;
    }

    setIsCheckingOrg(true);
    try {
      const res = await fetch(`http://localhost:5000/api/organizations/user/${currentUser.id}`);
      if (!res.ok) throw new Error("Could not load your organizations");
      const data = await res.json();
      const orgs = data.organizations || [];

      if (orgs.length === 0) {
        alert("You must create or join an organization before you can invite colleagues.");
        navigate("/create-organization");
        return;
      }

      if (orgs.length === 1) {
        // Automatically route to the invite page of your organization with this candidate pre-selected!
        navigate(`/organization/${orgs[0].id}/invite?candidateId=${profile.id}`);
      } else {
        // If the user belongs to multiple organizations, let them choose which organization to invite to
        setUserOrgs(orgs);
        setShowOrgSelectModal(true);
      }
    } catch (err) {
      console.error("Failed to load organizations for invitation:", err);
      alert("Failed to load your organizations. Please try again.");
    } finally {
      setIsCheckingOrg(false);
    }
  };

  const primaryNavItems = [
    { id: "dashboard", label: "Dashboard", icon: "◉" },
    { id: "organizations", label: "Organizations", icon: "◌" },
    { id: "meetings", label: "Meetings", icon: "◌" },
    { id: "people", label: "People", icon: "◌" },
    { id: "notifications", label: "Notifications", icon: "◌" },
  ];

  const isOwnProfile = Boolean(currentUser?.id && profile?.id && currentUser.id === profile.id);

  return (
    <AppLayout
      leftRail={
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Primary</p>
            <div className="mt-3">
              <SidebarNav items={primaryNavItems} title="Primary navigation" />
            </div>
          </div>
        </div>
      }
      rightRail={
        <div className="space-y-4">
          <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-4 shadow-xs text-[#242427]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Public profile</p>
                <h2 className="mt-1 text-lg font-semibold text-[#242427]">Directory</h2>
              </div>
              <span className="rounded-[3px] border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#10B981]">
                Public
              </span>
            </div>
          </div>
          
          <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-4 shadow-xs text-[#242427]">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Actions</p>
            {isOwnProfile ? (
              <div className="rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] p-2.5 text-center text-xs text-[#585754]">
                This is your account profile
              </div>
            ) : !profile ? (
              <div className="rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] p-2.5 text-center text-xs text-[#7E7C77]">
                Profile unavailable
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Friend Action Button */}
                {profile.friendshipStatus === "NONE" && (
                  <button
                    type="button"
                    disabled={isFriendActionLoading}
                    onClick={handleSendFriendRequest}
                    className="w-full flex items-center justify-center gap-2 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                  >
                    {isFriendActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span>{isFriendActionLoading ? "Sending request..." : "Add Friend"}</span>
                  </button>
                )}

                {profile.friendshipStatus === "REQUEST_SENT" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 rounded-[5px] border border-[#F59E0B]/30 bg-[#FEF3C7] px-4 py-2.5 text-xs font-semibold text-[#92400E] shadow-xs">
                      <Clock className="h-4 w-4 text-[#D97706]" />
                      <span>Friend Request Sent</span>
                    </div>
                    <button
                      type="button"
                      disabled={isFriendActionLoading}
                      onClick={handleCancelFriendRequest}
                      className="w-full text-center text-[11px] text-[#7E7C77] hover:text-[#DC2626] transition py-0.5"
                    >
                      {isFriendActionLoading ? "Cancelling..." : "Cancel Request"}
                    </button>
                  </div>
                )}

                {profile.friendshipStatus === "REQUEST_RECEIVED" && (
                  <div className="space-y-1.5">
                    <div className="rounded-[5px] border border-[#4963C8]/30 bg-[#EEF2FF] p-2 text-center text-xs text-[#312E81] font-medium">
                      @{profile.username} sent you a friend request
                    </div>
                    <button
                      type="button"
                      disabled={isFriendActionLoading}
                      onClick={handleAcceptFriendRequest}
                      className="w-full flex items-center justify-center gap-2 rounded-[5px] bg-[#10B981] hover:bg-[#059669] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                    >
                      {isFriendActionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      <span>Accept Friend Request</span>
                    </button>
                  </div>
                )}

                {profile.friendshipStatus === "FRIENDS" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 rounded-[5px] border border-[#10B981]/30 bg-[#ECFDF5] p-2 text-xs font-semibold text-[#065F46]">
                      <Check className="h-3.5 w-3.5 text-[#10B981]" />
                      <span>Friends</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/?tab=people&friendId=${profile.id}`)}
                      className="w-full flex items-center justify-center gap-2 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Message</span>
                    </button>
                    <button
                      type="button"
                      disabled={isFriendActionLoading}
                      onClick={handleRemoveFriend}
                      className="w-full text-center text-[11px] text-[#7E7C77] hover:text-[#DC2626] transition py-0.5"
                    >
                      {isFriendActionLoading ? "Removing..." : "Remove Friend"}
                    </button>
                  </div>
                )}

                {/* Invite to Organization */}
                <button
                  type="button"
                  disabled={isCheckingOrg}
                  onClick={handleInviteToOrg}
                  className="w-full flex items-center justify-center gap-2 rounded-[5px] border border-[#D8D4CB] bg-white hover:bg-[#EDE9DF] px-4 py-2.5 text-xs font-semibold text-[#242427] shadow-xs transition disabled:opacity-50"
                >
                  <Building className="h-4 w-4 text-[#7E7C77]" />
                  <span>{isCheckingOrg ? "Checking access..." : "Invite to Organization"}</span>
                </button>

                {friendActionFeedback && (
                  <div className="rounded-[4px] border border-[#D8D4CB] bg-[#EDE9DF] p-2 text-center text-[11px] text-[#585754]">
                    {friendActionFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      }
    >
      {/* Organization Selection Modal (for users with multiple organizations) */}
      {showOrgSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[8px] border border-[#D8D4CB] bg-[#FAF9F6] p-5 shadow-2xl text-[#242427]">
            <div className="flex items-center justify-between border-b border-[#D8D4CB] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#242427]">Choose Organization</h3>
                <p className="text-xs text-[#7E7C77] mt-0.5">
                  Select which organization to invite @{profile?.username} to
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOrgSelectModal(false)}
                className="rounded-[4px] p-1 text-[#7E7C77] hover:bg-[#EDE9DF] hover:text-[#242427]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {userOrgs.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => {
                    setShowOrgSelectModal(false);
                    if (profile?.id) {
                      navigate(`/organization/${org.id}/invite?candidateId=${profile.id}`);
                    }
                  }}
                  className="w-full flex items-center justify-between rounded-[5px] border border-[#D8D4CB] bg-white p-3 text-left transition hover:border-[#4963C8] hover:bg-[#EDE9DF] shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-[#EDE9DF] text-[#4963C8] font-bold text-xs border border-[#D8D4CB]">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#242427]">{org.name}</p>
                      <p className="text-[11px] text-[#7E7C77]">
                        {org.position} · {org.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#4963C8]">Select →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-12 text-center">
          <p className="text-xs text-[#7E7C77]">Loading directory profile...</p>
        </div>
      ) : error || !profile ? (
        <div className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-[#242427]">Profile Not Found</p>
          <p className="text-xs text-[#7E7C77]">{error || "This user profile does not exist in the OMeet directory."}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-[5px] bg-[#4963C8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3E56B5] transition"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-5">
              <UserAvatar
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                size="xl"
                className="h-20 w-20 text-2xl shadow-xs"
              />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Public Profile</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#242427]">{profile.name}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  <span className="text-xs text-[#585754]">@{profile.username}</span>
                  <span className="text-[#D8D4CB]">•</span>
                  <span className="rounded-[3px] border border-[#D8D4CB] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#585754]">
                    {profile.position}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action buttons in profile header */}
            {!isOwnProfile && profile && (
              <div className="flex items-center gap-2.5">
                {profile.friendshipStatus === "NONE" && (
                  <button
                    type="button"
                    disabled={isFriendActionLoading}
                    onClick={handleSendFriendRequest}
                    className="flex items-center gap-2 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                  >
                    {isFriendActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span>{isFriendActionLoading ? "Sending..." : "Add Friend"}</span>
                  </button>
                )}

                {profile.friendshipStatus === "REQUEST_SENT" && (
                  <span className="flex items-center gap-1.5 rounded-[5px] border border-[#F59E0B]/30 bg-[#FEF3C7] px-3.5 py-2 text-xs font-medium text-[#92400E]">
                    <Clock className="h-3.5 w-3.5 text-[#D97706]" />
                    <span>Friend Request Sent</span>
                  </span>
                )}

                {profile.friendshipStatus === "REQUEST_RECEIVED" && (
                  <button
                    type="button"
                    disabled={isFriendActionLoading}
                    onClick={handleAcceptFriendRequest}
                    className="flex items-center gap-2 rounded-[5px] bg-[#10B981] hover:bg-[#059669] px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                  >
                    {isFriendActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    <span>Accept Request</span>
                  </button>
                )}

                {profile.friendshipStatus === "FRIENDS" && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-[5px] border border-[#10B981]/30 bg-[#ECFDF5] px-3 py-1.5 text-xs font-semibold text-[#065F46]">
                      <Check className="h-3.5 w-3.5 text-[#10B981]" />
                      <span>Friends</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/?tab=people&friendId=${profile.id}`)}
                      className="flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-5 shadow-sm">
              <div className="space-y-3.5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Organization</p>
                  <p className="mt-1 text-base font-semibold text-[#242427]">{profile.organization}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Location</p>
                  <p className="mt-1 text-xs text-[#585754]">{profile.location}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Position</p>
                  <p className="mt-1 text-xs text-[#585754]">{profile.position}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-5 shadow-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">About</p>
                <p className="mt-2 text-xs leading-relaxed text-[#585754]">{profile.about}</p>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Skills</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(profile.skills || []).map((skill: string) => (
                    <span key={skill} className="rounded-[4px] border border-[#D8D4CB] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#242427]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-5 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">Organizations</p>
              <h2 className="mt-1 text-base font-semibold text-[#242427]">Current access</h2>
            </div>

            <div className="mt-3.5 grid gap-2.5 md:grid-cols-3">
              {(profile.organizations || []).map((organization: string) => (
                <div key={organization} className="rounded-[5px] border border-[#D8D4CB] bg-white p-3 text-xs font-medium text-[#242427]">
                  {organization}
                </div>
              ))}
            </div>
          </section>
        </section>
      )}
    </AppLayout>
  );
}

export default PublicProfilePage;
