import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import UserAvatar from "../components/UserAvatar";
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
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7E7C77] hover:text-[#242427] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6]">
            <Loader2 className="h-6 w-6 animate-spin text-[#7E7C77]" />
          </div>
        ) : error || !org ? (
          <div className="rounded-[6px] border border-[#B44A4A]/30 bg-red-50 p-6 text-center text-[#B44A4A]">
            <p className="font-semibold text-xs">{error || "Organization profile could not be found."}</p>
            <Link
              to="/"
              className="mt-3 inline-block rounded-[5px] bg-[#242427] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black transition"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Organization Banner & Header Card */}
            <div className="relative overflow-hidden rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] shadow-sm">
              <div className="h-28 bg-[#1D2026] border-b border-[#383D47]" />

              <div className="px-6 pb-6 pt-0">
                <div className="relative -mt-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[6px] border-2 border-white bg-[#EDE9DF] text-2xl font-bold text-[#242427] shadow-sm overflow-hidden">
                      {org.avatarUrl ? (
                        <img src={org.avatarUrl} alt={org.name} className="h-full w-full object-cover" />
                      ) : (
                        org.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="mb-1">
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-[#242427]">{org.name}</h1>
                        <span className="flex items-center gap-1 rounded-[3px] border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-semibold text-[#10B981]">
                          <ShieldCheck className="h-3 w-3" /> Verified Org
                        </span>
                      </div>
                      <p className="text-xs text-[#585754] mt-0.5">{org.size || "Organization"} • {org.employeeCount} team member{org.employeeCount === 1 ? "" : "s"}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mb-1 flex items-center gap-2.5">
                    {org.isMember ? (
                      <Link
                        to={`/organization/${org.id}`}
                        className="flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                      >
                        <Building2 className="h-3.5 w-3.5" /> Go to Workspace
                      </Link>
                    ) : (
                      <Link
                        to={`/organization/${org.id}`}
                        className="flex items-center gap-1.5 rounded-[5px] border border-[#D8D4CB] bg-white px-4 py-2 text-xs font-semibold text-[#242427] hover:bg-[#FAF9F6] transition"
                      >
                        Join Workspace
                      </Link>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-5 border-t border-[#D8D4CB] pt-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77] mb-1.5">About Organization</h3>
                  <p className="text-xs text-[#585754] leading-relaxed max-w-2xl">
                    {org.description || org.brief || "No description provided by the organization administrator."}
                  </p>
                </div>

                {/* Metrics Pill Grid */}
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#D8D4CB] pt-4">
                  <div className="rounded-[5px] border border-[#D8D4CB] bg-white p-3.5">
                    <span className="flex items-center gap-1 text-[11px] text-[#7E7C77]">
                      <Users className="h-3.5 w-3.5 text-[#4963C8]" /> Members
                    </span>
                    <p className="text-lg font-bold text-[#242427] mt-1">{org.employeeCount}</p>
                  </div>
                  <div className="rounded-[5px] border border-[#D8D4CB] bg-white p-3.5">
                    <span className="flex items-center gap-1 text-[11px] text-[#7E7C77]">
                      <Video className="h-3.5 w-3.5 text-[#10B981]" /> Active Meetings
                    </span>
                    <p className="text-lg font-bold text-[#242427] mt-1">{org.activeMeetings}</p>
                  </div>
                  <div className="rounded-[5px] border border-[#D8D4CB] bg-white p-3.5">
                    <span className="flex items-center gap-1 text-[11px] text-[#7E7C77]">
                      <Calendar className="h-3.5 w-3.5 text-[#585754]" /> Founded
                    </span>
                    <p className="text-xs font-semibold text-[#242427] mt-1.5">
                      {new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder / Owner Info Card */}
            {org.owner && (
              <div className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77] flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-[#D97706]" /> Organization Owner
                  </h3>
                  <Link
                    to={`/profile/${org.owner.id}`}
                    className="flex items-center gap-1 text-xs font-medium text-[#4963C8] hover:text-[#3E56B5] transition"
                  >
                    View Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="flex items-center gap-3 rounded-[5px] border border-[#D8D4CB] bg-white p-3">
                  <UserAvatar name={org.owner.name} avatarUrl={org.owner.avatarUrl} size="md" />
                  <div>
                    <p className="text-xs font-semibold text-[#242427]">{org.owner.name}</p>
                    <p className="text-[11px] text-[#7E7C77] font-mono">@{org.owner.username}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Public Channels List */}
            {org.channels && org.channels.length > 0 && (
              <div className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-5 space-y-3 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77] flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-[#7E7C77]" /> Public Channels
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {org.channels.map((ch: any) => (
                    <div
                      key={ch.name}
                      className="rounded-[5px] border border-[#D8D4CB] bg-white p-3 space-y-0.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-[#4963C8]" />
                        <span className="font-semibold text-[#242427] text-xs">#{ch.name}</span>
                      </div>
                      <p className="text-[11px] text-[#7E7C77] line-clamp-2">{ch.topic || "Workspace discussion channel"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Team Members */}
            {org.topMembers && org.topMembers.length > 0 && (
              <div className="rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-5 space-y-3 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77] flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#4963C8]" /> Team Members Preview
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {org.topMembers.map((m: any) => (
                    <Link
                      key={m.id}
                      to={`/profile/${m.id}`}
                      className="flex flex-col items-center text-center rounded-[5px] border border-[#D8D4CB] bg-white p-3 hover:border-[#4963C8]/50 transition"
                    >
                      <UserAvatar name={m.name} avatarUrl={m.avatarUrl} size="sm" className="mb-1.5" />
                      <p className="text-xs font-semibold text-[#242427] truncate w-full">{m.name}</p>
                      <p className="text-[10px] text-[#7E7C77] truncate w-full">{m.position || "Member"}</p>
                      <span className="mt-1 rounded-[3px] bg-[#EDE9DF] px-1.5 py-0.5 text-[9px] font-medium text-[#585754]">
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
