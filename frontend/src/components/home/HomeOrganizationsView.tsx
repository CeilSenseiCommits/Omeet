import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, Video, Plus, ArrowRight, Info } from "lucide-react";
import type { Organization } from "../../types/organization";
import JoinOrganizationModal from "../JoinOrganizationModal";

interface HomeOrganizationsViewProps {
  organizations: Organization[];
  isLoading: boolean;
}

export default function HomeOrganizationsView({ organizations, isLoading }: HomeOrganizationsViewProps) {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8D4CB] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#242427] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#4963C8]" />
            <span>My Organizations</span>
          </h2>
          <p className="text-xs text-[#585754] mt-0.5">
            Workspaces you are enrolled in with your position, role permissions, and public details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="rounded-[5px] border border-[#D8D4CB] bg-white hover:bg-[#EFECE4] px-3 py-1.5 text-xs font-medium text-[#242427] transition-colors"
          >
            Join with Code
          </button>
          <Link
            to="/create-organization"
            className="flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Workspace
          </Link>
        </div>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 rounded-[6px] border border-[#D8D4CB] bg-white animate-pulse" />
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-[#D8D4CB] bg-white p-10 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] text-[#7E7C77]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#242427]">No Organizations Joined</h3>
            <p className="text-xs text-[#7E7C77] mt-1 max-w-sm mx-auto">
              You are currently not a member of any organization. Create a new organization or join with an invite code.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="rounded-[5px] border border-[#D8D4CB] bg-white px-3 py-1.5 text-xs font-medium text-[#242427] hover:bg-[#EFECE4] transition-colors"
            >
              Join with Code
            </button>
            <Link
              to="/create-organization"
              className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              Create Workspace
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map((org) => {
            const initials = org.name.slice(0, 2).toUpperCase();
            return (
              <div
                key={org.id}
                className="group flex flex-col justify-between rounded-[6px] border border-[#D8D4CB] bg-white p-4.5 shadow-xs hover:border-[#4963C8] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[5px] border border-[#D8D4CB] bg-[#FAF9F6] text-xs font-bold text-[#242427] overflow-hidden shrink-0">
                        {org.avatarUrl ? (
                          <img src={org.avatarUrl} alt={org.name} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#242427] group-hover:text-[#4963C8] transition-colors truncate">
                          {org.name}
                        </h3>
                        <p className="text-xs text-[#7E7C77] mt-0.5 truncate">
                          {org.position || "Member"} · {org.size || "Organization"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-[3px] border border-[#CBD5E1] bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4963C8] shrink-0">
                      {org.role || "Member"}
                    </span>
                  </div>

                  <p className="text-xs text-[#585754] mt-3 line-clamp-2 leading-relaxed">
                    {org.description || org.brief || "Collaborative workspace on OMeet."}
                  </p>

                  <div className="mt-4 flex items-center gap-4 border-t border-[#E8E5DD] pt-3 text-xs text-[#7E7C77]">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-[#4963C8]" />
                      {org.employeeCount || 1} team member{(org.employeeCount || 1) === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active Workspace
                    </span>
                  </div>
                </div>

                {/* Bottom Actions: More Info & Go to Dashboard */}
                <div className="mt-4 flex items-center gap-2 pt-1">
                  <Link
                    to={`/org-profile/${org.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-[#D8D4CB] bg-white hover:bg-[#FAF9F6] py-1.5 text-xs font-medium text-[#585754] transition-colors"
                    title="View public details and roster"
                  >
                    <Info className="h-3 w-3 text-[#7E7C77]" /> More Info
                  </Link>

                  <Link
                    to={`/organization/${org.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] py-1.5 text-xs font-medium text-white transition-colors"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="h-3 w-3" />
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
