import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import SidebarNav from "../components/SidebarNav";
import { users, type UserProfile } from "../lib/mockData";
import { useAuth } from "../context/AuthContext";
import { Building, Building2, UserPlus, X } from "lucide-react";

function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile>(() => {
    return users.find((user) => user.id === userId) ?? users[0];
  });
  const [loading, setLoading] = useState(false);
  const [isCheckingOrg, setIsCheckingOrg] = useState(false);
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [showOrgSelectModal, setShowOrgSelectModal] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`http://localhost:5000/api/users/profile/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("User not found in database");
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.user) {
          setProfile(data.user);
        }
      })
      .catch((err) => {
        console.warn("Falling back to local profile:", err);
        const fallback = users.find((user) => user.id === userId);
        if (isMounted && fallback) {
          setProfile(fallback);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleInviteToOrg = async () => {
    if (!currentUser?.id) {
      navigate("/login");
      return;
    }

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

  const isOwnProfile = currentUser?.id === profile.id;

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
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Public profile</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Directory</h2>
              </div>
              <span className="rounded-full border border-emerald-400/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Public
              </span>
            </div>
          </div>
          
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Actions</p>
            {isOwnProfile ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-center text-xs text-zinc-400">
                This is your account profile
              </div>
            ) : (
              <button
                type="button"
                disabled={isCheckingOrg}
                onClick={handleInviteToOrg}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/50 transition hover:bg-indigo-500 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                <span>{isCheckingOrg ? "Checking access..." : "Invite to Organization"}</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Organization Selection Modal (for users with multiple organizations) */}
      {showOrgSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white">Choose Organization</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select which organization to invite @{profile.username} to
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOrgSelectModal(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {userOrgs.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => {
                    setShowOrgSelectModal(false);
                    navigate(`/organization/${org.id}/invite?candidateId=${profile.id}`);
                  }}
                  className="w-full flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-left transition hover:border-indigo-500/50 hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-white font-bold text-sm">
                      <Building2 className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{org.name}</p>
                      <p className="text-xs text-zinc-400">
                        {org.position} · {org.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400">Select →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <section className="space-y-6">
        <div className="rounded-[34px] border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-center gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-3xl font-bold text-white">
              {profile.initials}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Public Profile</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{profile.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-sm text-zinc-400">@{profile.username}</span>
                <span className="text-zinc-700">•</span>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  {profile.position}
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Organization</p>
                <p className="mt-2 text-lg font-semibold text-white">{profile.organization}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Location</p>
                <p className="mt-2 text-sm text-zinc-300">{profile.location}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Position</p>
                <p className="mt-2 text-sm text-zinc-300">{profile.position}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">About</p>
              <p className="mt-3 leading-7 text-zinc-400">{profile.about}</p>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.skills || []).map((skill: string) => (
                  <span key={skill} className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-medium text-zinc-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Organizations</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Current access</h2>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {(profile.organizations || []).map((organization: string) => (
              <div key={organization} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                {organization}
              </div>
            ))}
          </div>
        </section>
      </section>
    </AppLayout>
  );
}

export default PublicProfilePage;
