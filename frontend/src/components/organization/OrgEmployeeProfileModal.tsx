import { useState } from "react";
import { MessageSquare, Video, Mail, Phone, ShieldCheck, UserCheck, X, Briefcase, User } from "lucide-react";

interface EmployeeProfileData {
  id: string;
  employeeId?: string;
  name: string;
  username: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  bio?: string;
  timezone?: string;
  position?: string;
  role?: string;
  department?: string;
  managerName?: string;
  joiningDate?: string;
}

interface OrgEmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeProfileData | null;
  onMessage: (employee: EmployeeProfileData) => void;
  onInviteMeeting: (employee: EmployeeProfileData) => void;
}

function OrgEmployeeProfileModal({
  isOpen,
  onClose,
  employee,
  onMessage,
  onInviteMeeting,
}: OrgEmployeeProfileModalProps) {
  const [showInfo, setShowInfo] = useState(false);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#121214] p-6 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            Organization Member Profile
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Identity */}
        <div className="mt-6 flex items-start gap-4">
          <img
            src={
              employee.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2563eb&color=ffffff`
            }
            alt={employee.name}
            className="h-16 w-16 rounded-2xl border border-zinc-700 object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white truncate">{employee.name}</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  employee.role === "OWNER"
                    ? "bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-800/60"
                    : employee.role === "ADMIN"
                    ? "bg-indigo-950/80 text-indigo-300 border border-indigo-800/60"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {employee.role === "OWNER" ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <UserCheck className="h-3 w-3" />
                )}
                {employee.role || "MEMBER"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">@{employee.username}</p>
            <p className="text-sm font-medium text-fuchsia-400 mt-2">
              {employee.position || "Member"}
              {employee.department ? ` · ${employee.department}` : ""}
            </p>
          </div>
        </div>

        {/* Reporting Hierarchy Details */}
        <div className="mt-5 rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Direct Senior
            </span>
            <span className="font-medium text-zinc-300">
              {employee.managerName ? `Reports to ${employee.managerName}` : "— Top Level Leader"}
            </span>
          </div>
          {employee.joiningDate && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Joined Organization
              </span>
              <span className="font-medium text-zinc-300">
                {new Date(employee.joiningDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* See Info Section */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center justify-between w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition"
          >
            <span>{showInfo ? "Hide Contact Information" : "See Info (Email & Phone)"}</span>
            <span className="text-fuchsia-400 font-mono">{showInfo ? "▲" : "▼"}</span>
          </button>

          {showInfo && (
            <div className="mt-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 space-y-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Email Address</p>
                  <p className="font-medium text-white truncate">{employee.email || "Not publicly visible"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Phone Number</p>
                  <p className="font-medium text-white">{employee.phone || "Not provided"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3 pt-3 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={() => {
              onMessage(employee);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-fuchsia-950/40 transition"
          >
            <MessageSquare className="h-4 w-4" />
            Message
          </button>
          <button
            type="button"
            onClick={() => {
              onInviteMeeting(employee);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white transition"
          >
            <Video className="h-4 w-4 text-emerald-400" />
            Invite to a Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrgEmployeeProfileModal;
