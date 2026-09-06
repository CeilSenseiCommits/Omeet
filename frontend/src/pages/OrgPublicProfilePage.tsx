import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { 
  Building2, 
  Users, 
  Video, 
  Hash, 
  Calendar, 
  ArrowLeft, 
  Sparkles, 
  Crown, 
  ShieldCheck,
  ExternalLink,
  Loader2
} from "lucide-react";

export default function OrgPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [org, setOrg] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/api/organizations/${id}/public`, {
      headers: {
        "x-user-id": currentUser?.id || "",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Organization not found.");
        return res.json();
      })
      .then((data) => {
        setOrg(data.organization);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load organization profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, currentUser?.id]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {loading ? (
          <div className="flex h-72 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/50">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : error || !org ? (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-8 text-center text-rose-300">
            <p className="font-semibold">{error || "Organization profile could not be found."}</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Organization Banner & Header Card */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl">
              <div className="h-36 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border-b border-zinc-800/80" />

              <div className="px-8 pb-8 pt-0">
                <div className="relative -mt-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="flex items-end gap-5">
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-zinc-900 bg-gradient-to-br from-zinc-800 to-zinc-900 text-3xl font-extrabold text-white shadow-2xl overflow-hidden">
                      {org.avatarUrl ? (
                        <img src={org.avatarUrl} alt={org.name} className="h-full w-full object-cover" />
                      ) : (
                        org.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold text-white">{org.name}</h1>
                        <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                          <ShieldCheck className="h-3 w-3" /> Verified Org
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{org.size || "Organization"} • {org.employeeCount} team member{org.employeeCount === 1 ? "" : "s"}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mb-2 flex items-center gap-3">
                    {org.isMember ? (
                      <Link
                        to={`/organization/${org.id}`}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-950/50 transition"
                      >
                        <Building2 className="h-4 w-4" /> Go to Workspace
                      </Link>
                    ) : (
                      <Link
                        to={`/organization/${org.id}`}
                        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700 transition"
                      >
                        Join Workspace
                      </Link>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6 border-t border-zinc-800/80 pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">About Organization</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
                    {org.description || org.brief || "No description provided by the organization administrator."}
                  </p>
                </div>

                {/* Metrics Pill Grid */}
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-zinc-800/80 pt-5">
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Users className="h-3.5 w-3.5 text-blue-400" /> Members
                    </span>
                    <p className="text-xl font-bold text-white mt-1">{org.employeeCount}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Video className="h-3.5 w-3.5 text-emerald-400" /> Active Meetings
                    </span>
                    <p className="text-xl font-bold text-white mt-1">{org.activeMeetings}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Calendar className="h-3.5 w-3.5 text-purple-400" /> Founded
                    </span>
                    <p className="text-sm font-semibold text-white mt-2">
                      {new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder / Owner Info Card */}
            {org.owner && (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5 text-amber-400" /> Organization Owner
                  </h3>
                  <Link
                    to={`/profile/${org.owner.id}`}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    View Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                  <img
                    src={org.owner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(org.owner.name)}`}
                    alt={org.owner.name}
                    className="h-12 w-12 rounded-full object-cover border border-zinc-700"
                  />
                  <div>
                    <p className="font-semibold text-white">{org.owner.name}</p>
                    <p className="text-xs text-zinc-400 font-mono">@{org.owner.username}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Public Channels List */}
            {org.channels && org.channels.length > 0 && (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-zinc-400" /> Public Channels
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {org.channels.map((ch: any) => (
                    <div
                      key={ch.name}
                      className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-blue-400" />
                        <span className="font-semibold text-white text-sm">#{ch.name}</span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{ch.topic || "Workspace discussion channel"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Team Members */}
            {org.topMembers && org.topMembers.length > 0 && (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-blue-400" /> Team Members Preview
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {org.topMembers.map((m: any) => (
                    <Link
                      key={m.id}
                      to={`/profile/${m.id}`}
                      className="flex flex-col items-center text-center rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-3 hover:bg-zinc-900 transition"
                    >
                      <img
                        src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                        alt={m.name}
                        className="h-10 w-10 rounded-full object-cover mb-2 border border-zinc-700"
                      />
                      <p className="text-xs font-semibold text-white truncate w-full">{m.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate w-full">{m.position || "Member"}</p>
                      <span className="mt-1 rounded-md bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300">
                        {m.role}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
