import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, Video, Plus, ShieldCheck, ArrowRight, Info } from "lucide-react";
import type { Organization } from "../../lib/mockData";
import JoinOrganizationModal from "../JoinOrganizationModal";

interface HomeOrganizationsViewProps {
  organizations: Organization[];
  isLoading: boolean;
}

export default function HomeOrganizationsView({ organizations, isLoading }: HomeOrganizationsViewProps) {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-blue-400" /> My Organizations
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Workspaces you are enrolled in with your position, role permissions, and public details.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-white transition"
          >
            Join with Code
          </button>
          <Link
            to="/create-organization"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/50 transition"
          >
            <Plus className="h-4 w-4" /> Create Org
          </Link>
        </div>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 rounded-3xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No Organizations Joined</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              You are currently not a member of any organization. Create a new organization or join with an invite code.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition"
            >
              Join with Code
            </button>
            <Link
              to="/create-organization"
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition"
            >
              Create Organization
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {organizations.map((org) => {
            const initials = org.name.slice(0, 2).toUpperCase();
            return (
              <div
                key={org.id}
                className="group flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg hover:border-zinc-700 hover:bg-zinc-900 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-xl font-bold text-white shadow-md overflow-hidden">
                        {org.avatarUrl ? (
                          <img src={org.avatarUrl} alt={org.name} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                          {org.name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {org.position || "Member"} • {org.size || "Organization"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-lg bg-zinc-800/80 border border-zinc-700/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                      {org.role || "Member"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mt-4 line-clamp-2 leading-relaxed">
                    {org.description || org.brief || "Collaborative company workspace on OMeet."}
                  </p>

                  <div className="mt-5 flex items-center gap-4 border-t border-zinc-800/60 pt-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-400" />
                      {org.employeeCount || 1} team member{(org.employeeCount || 1) === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                      Active Workspace
                    </span>
                  </div>
                </div>

                {/* Bottom Actions: More Info & Go to Dashboard */}
                <div className="mt-6 flex items-center gap-2.5 pt-2">
                  <Link
                    to={`/org-profile/${org.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
                    title="View public details and roster"
                  >
                    <Info className="h-3.5 w-3.5 text-zinc-400" /> More Info
                  </Link>

                  <Link
                    to={`/organization/${org.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-950/50 transition"
                  >
                    Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <JoinOrganizationModal
        open={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
