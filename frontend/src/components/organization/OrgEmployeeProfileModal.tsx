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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-[8px] border border-[#383D47] bg-[#1D2026] text-[#F3F3EE] p-6 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#383D47]">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#717684]">
            Organization Member Profile
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] border border-[#383D47] bg-[#252932] p-1.5 text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Profile Identity */}
        <div className="mt-5 flex items-start gap-3.5">
          <img
            src={
              employee.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2563eb&color=ffffff`
            }
            alt={employee.name}
            className="h-14 w-14 rounded-[5px] border border-[#383D47] object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white truncate">{employee.name}</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10px] font-semibold border ${
                  employee.role === "OWNER"
                    ? "bg-[#4963C8]/15 text-[#9BB1FA] border-[#4963C8]/40"
                    : employee.role === "ADMIN"
                    ? "bg-[#252932] text-white border-[#383D47]"
                    : "bg-[#252932] text-[#A9ACB4] border-[#383D47]"
                }`}
              >
                {employee.role === "OWNER" ? (
                  <ShieldCheck className="h-3 w-3 text-[#4963C8]" />
                ) : (
                  <UserCheck className="h-3 w-3" />
                )}
                {employee.role || "MEMBER"}
              </span>
            </div>
            <p className="text-xs text-[#A9ACB4] mt-0.5">@{employee.username}</p>
            <p className="text-xs font-semibold text-[#4963C8] mt-1.5">
              {employee.position || "Member"}
              {employee.department ? ` · ${employee.department}` : ""}
            </p>
          </div>
        </div>

        {/* Reporting Hierarchy Details */}
        <div className="mt-4 rounded-[5px] border border-[#383D47] bg-[#252932] p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#717684] flex items-center gap-1.5 text-[11px]">
              <Briefcase className="h-3.5 w-3.5" /> Direct Senior
            </span>
            <span className="font-semibold text-white text-[11px]">
              {employee.managerName ? `Reports to ${employee.managerName}` : "— Top Level Authority"}
            </span>
          </div>
          {employee.joiningDate && (
            <div className="flex items-center justify-between border-t border-[#383D47] pt-1.5">
              <span className="text-[#717684] flex items-center gap-1.5 text-[11px]">
                <User className="h-3.5 w-3.5" /> Joined Workspace
              </span>
              <span className="font-medium text-[#A9ACB4] text-[11px]">
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
        <div className="mt-3.5">
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center justify-between w-full rounded-[5px] border border-[#383D47] bg-[#252932] px-3.5 py-2 text-xs font-semibold text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
          >
            <span>{showInfo ? "Hide Contact Information" : "See Contact Info (Email & Phone)"}</span>
            <span className="text-[#4963C8] font-mono text-[11px]">{showInfo ? "▲" : "▼"}</span>
          </button>

          {showInfo && (
            <div className="mt-2 rounded-[5px] border border-[#383D47] bg-[#252932] p-3 space-y-2.5 text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#1D2026] border border-[#383D47] text-[#A9ACB4] shrink-0">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#717684] uppercase tracking-wider">Email Address</p>
                  <p className="font-medium text-white truncate text-xs">{employee.email || "Protected"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 border-t border-[#383D47] pt-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#1D2026] border border-[#383D47] text-[#A9ACB4] shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[10px] text-[#717684] uppercase tracking-wider">Direct Phone</p>
                  <p className="font-medium text-white text-xs">{employee.phone || "Not configured"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-2.5 pt-3 border-t border-[#383D47]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMessage(employee);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-4 py-2 text-xs font-semibold text-white shadow-xs transition"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Direct Message
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInviteMeeting(employee);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-[5px] border border-[#383D47] bg-[#252932] hover:bg-[#2C3039] px-4 py-2 text-xs font-semibold text-white transition"
          >
            <Video className="h-3.5 w-3.5 text-[#CBEA57]" />
            Schedule Sync
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrgEmployeeProfileModal;
