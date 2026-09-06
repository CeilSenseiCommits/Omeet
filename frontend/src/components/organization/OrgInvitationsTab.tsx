import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Send, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  Search, 
  ExternalLink 
} from "lucide-react";

interface InvitationLog {
  id: string;
  inviteCode: string;
  position: string;
  department?: string;
  role: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  inviteeId: string;
  inviteeName: string;
  inviteeUsername: string;
  inviteeAvatarUrl?: string;
  managerName?: string;
  managerPosition?: string;
}

interface OrgInvitationsTabProps {
  organizationId: string;
}

function OrgInvitationsTab({ organizationId }: OrgInvitationsTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState<InvitationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/invitations/logs?userId=${user?.id || ""}`,
        {
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load organization invitation logs.");
      }

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch invitation records.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, user?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pendingCount = logs.filter((l) => l.status === "PENDING").length;
  const acceptedCount = logs.filter((l) => l.status === "ACCEPTED").length;
  const rejectedCount = logs.filter((l) => l.status === "REJECTED").length;

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== "ALL" && log.status !== statusFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const statusStr = log.status.toLowerCase();
      const statusMatch =
        statusStr.includes(q) ||
        (q === "declined" && statusStr === "rejected") ||
        (q.startsWith("pend") && statusStr === "pending") ||
        (q.startsWith("acc") && statusStr === "accepted") ||
        (q.startsWith("dec") && statusStr === "rejected") ||
        (q.startsWith("rej") && statusStr === "rejected") ||
        (q.startsWith("exp") && statusStr === "expired");

      const nameMatch = log.inviteeName?.toLowerCase().includes(q);
      const usernameMatch = log.inviteeUsername?.toLowerCase().includes(q);
      const codeMatch = log.inviteCode?.toLowerCase().includes(q);
      const posMatch = log.position?.toLowerCase().includes(q);
      const deptMatch = log.department?.toLowerCase().includes(q);
      const mgrMatch = log.managerName?.toLowerCase().includes(q);

      return (
        statusMatch ||
        nameMatch ||
        usernameMatch ||
        codeMatch ||
        posMatch ||
        deptMatch ||
        mgrMatch
      );
    });
  }, [logs, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#7E7C77]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 rounded-[6px] border border-[#B44A4A]/30 bg-white p-6 text-center max-w-md mx-auto shadow-xs">
        <AlertCircle className="h-6 w-6 text-[#B44A4A] mx-auto mb-2" />
        <p className="text-xs font-semibold text-[#B44A4A]">{error}</p>
        <button
          type="button"
          onClick={fetchLogs}
          className="mt-3 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3.5 py-1.5 text-xs font-medium text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="py-5 space-y-5">
      {/* Top Action Bar & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#242427]">Organization Invitation Logs</h2>
          <p className="text-xs text-[#585754]">
            Audit trail of invitations issued for this workspace. Click any row to preview offer letter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/organization/${organizationId}/invite`, { state: { fromOrgId: organizationId, fromTab: "Invitations" } })}
          className="flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Invite New Member</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter("ALL")}
          className={`rounded-[6px] border p-3.5 cursor-pointer transition-colors shadow-xs ${
            statusFilter === "ALL" 
              ? "border-[#4963C8] bg-white ring-1 ring-[#4963C8]/30" 
              : "border-[#D8D4CB] bg-white hover:bg-[#FAF9F6]"
          }`}
        >
          <p className="text-[10px] font-semibold text-[#7E7C77] uppercase tracking-wider">Total Sent</p>
          <p className="mt-0.5 text-xl font-bold text-[#242427]">{logs.length}</p>
        </div>
        <div 
          onClick={() => setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING")}
          className={`rounded-[6px] border p-3.5 cursor-pointer transition-colors shadow-xs ${
            statusFilter === "PENDING" 
              ? "border-[#4963C8] bg-white ring-1 ring-[#4963C8]/30" 
              : "border-[#D8D4CB] bg-white hover:bg-[#FAF9F6]"
          }`}
        >
          <p className="text-[10px] font-semibold text-[#7E7C77] uppercase tracking-wider">Pending</p>
          <p className="mt-0.5 text-xl font-bold text-[#585754]">{pendingCount}</p>
        </div>
        <div 
          onClick={() => setStatusFilter(statusFilter === "ACCEPTED" ? "ALL" : "ACCEPTED")}
          className={`rounded-[6px] border p-3.5 cursor-pointer transition-colors shadow-xs ${
            statusFilter === "ACCEPTED" 
              ? "border-emerald-600 bg-white ring-1 ring-emerald-500/30" 
              : "border-[#D8D4CB] bg-white hover:bg-[#FAF9F6]"
          }`}
        >
          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Accepted</p>
          <p className="mt-0.5 text-xl font-bold text-emerald-700">{acceptedCount}</p>
        </div>
        <div 
          onClick={() => setStatusFilter(statusFilter === "REJECTED" ? "ALL" : "REJECTED")}
          className={`rounded-[6px] border p-3.5 cursor-pointer transition-colors shadow-xs ${
            statusFilter === "REJECTED" 
              ? "border-[#B44A4A] bg-white ring-1 ring-[#B44A4A]/30" 
              : "border-[#D8D4CB] bg-white hover:bg-[#FAF9F6]"
          }`}
        >
          <p className="text-[10px] font-semibold text-[#B44A4A] uppercase tracking-wider">Declined</p>
          <p className="mt-0.5 text-xl font-bold text-[#B44A4A]">{rejectedCount}</p>
        </div>
      </div>

      {/* Search Bar & Status Quick Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E7C77]" />
          <input
            type="text"
            placeholder="Search by status, candidate, position, or invite code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[5px] border border-[#D8D4CB] bg-white pl-9 pr-8 py-1.5 text-xs text-[#242427] placeholder:text-[#A6A49F] outline-none focus:border-[#4963C8] transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E7C77] hover:text-[#242427] text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All" },
            { id: "PENDING", label: "Pending" },
            { id: "ACCEPTED", label: "Accepted" },
            { id: "REJECTED", label: "Declined" },
            { id: "EXPIRED", label: "Expired" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === pill.id
                  ? "bg-[#242427] text-white"
                  : "bg-white border border-[#D8D4CB] text-[#585754] hover:bg-[#FAF9F6]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-[#D8D4CB] bg-white p-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#FAF9F6] border border-[#D8D4CB] text-[#7E7C77] mx-auto mb-2.5">
            <Send className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-semibold text-[#242427]">No invitations issued yet</h3>
          <p className="mt-0.5 text-xs text-[#7E7C77] max-w-sm mx-auto">
            You haven't sent any invitations for this workspace yet. Recruit talent using the invite button above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[6px] border border-[#D8D4CB] bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#D8D4CB] bg-[#FAF9F6] text-[10px] text-[#7E7C77] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-2.5">Candidate</th>
                <th className="px-4 py-2.5">Position & Dept</th>
                <th className="px-4 py-2.5">Reporting Senior</th>
                <th className="px-4 py-2.5">Invite Code</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Sent Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E5DD]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#7E7C77]">
                    No invitations found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => navigate(`/invitation-preview/${log.id}`, { state: { fromOrgId: organizationId, fromTab: "Invitations" } })}
                    className="hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
                    title="Click to view candidate invitation preview"
                  >
                    <td className="px-4 py-2.5 flex items-center gap-2.5">
                      <img
                        src={
                          log.inviteeAvatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(log.inviteeName)}&background=252932&color=F3F3EE`
                        }
                        alt={log.inviteeName}
                        className="h-7 w-7 rounded-[4px] border border-[#D8D4CB] object-cover"
                      />
                      <div>
                        <p className="font-semibold text-[#242427] group-hover:text-[#4963C8] transition-colors flex items-center gap-1">
                          {log.inviteeName}
                          <ExternalLink className="h-3 w-3 text-[#7E7C77] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <p className="text-[10px] text-[#7E7C77]">@{log.inviteeUsername}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#242427]">
                      <p className="font-medium">{log.position}</p>
                      <p className="text-[10px] text-[#7E7C77]">{log.department || "General Team"}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#585754]">
                      {log.managerName ? log.managerName : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(log.inviteCode);
                        }}
                        className="inline-flex items-center gap-1 rounded-[3px] border border-[#CBD5E1] bg-[#EEF2FF] px-2 py-0.5 text-xs font-mono font-semibold text-[#4963C8] hover:bg-[#E0E7FF] transition-colors"
                        title="Copy code"
                      >
                        <span>{log.inviteCode}</span>
                        {copiedCode === log.inviteCode ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-[#7E7C77]" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      {log.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-[3px] border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          <Clock className="h-2.5 w-2.5" />
                          Pending
                        </span>
                      )}
                      {log.status === "ACCEPTED" && (
                        <span className="inline-flex items-center gap-1 rounded-[3px] border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Accepted
                        </span>
                      )}
                      {log.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 rounded-[3px] border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                          <XCircle className="h-2.5 w-2.5" />
                          Declined
                        </span>
                      )}
                      {log.status === "EXPIRED" && (
                        <span className="inline-flex items-center gap-1 rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-2 py-0.5 text-[10px] font-semibold text-[#7E7C77]">
                          Expired
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11px] text-[#7E7C77]">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default OrgInvitationsTab;
