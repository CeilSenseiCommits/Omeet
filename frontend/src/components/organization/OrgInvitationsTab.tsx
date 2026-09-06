import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Send, UserPlus, CheckCircle2, XCircle, Clock, Copy, Check, Loader2, AlertCircle } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-fuchsia-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-center max-w-md mx-auto">
        <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-rose-200">{error}</p>
        <button
          type="button"
          onClick={fetchLogs}
          className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="py-6 space-y-6">
      {/* Top Action Bar & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Organization Invitation Logs</h2>
          <p className="text-xs text-zinc-400">
            Audit trail of invitations issued for this workspace and candidate responses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/organization/${organizationId}/invite`)}
          className="flex items-center gap-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-fuchsia-950/40 transition shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Invite New Member
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Sent</p>
          <p className="mt-1 text-2xl font-bold text-white">{logs.length}</p>
        </div>
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
          <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-200">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Accepted</p>
          <p className="mt-1 text-2xl font-bold text-emerald-200">{acceptedCount}</p>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4">
          <p className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Declined</p>
          <p className="mt-1 text-2xl font-bold text-rose-200">{rejectedCount}</p>
        </div>
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500 mx-auto mb-3">
            <Send className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No invitations issued yet</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
            You haven't sent any invitations for this workspace yet. Recruit talent using the invite button above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/40">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800/60 bg-zinc-900/50 text-xs text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Position & Dept</th>
                <th className="px-5 py-3">Reporting Senior</th>
                <th className="px-5 py-3">Invite Code</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Sent Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/40 transition">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <img
                      src={
                        log.inviteeAvatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(log.inviteeName)}&background=2563eb&color=ffffff`
                      }
                      alt={log.inviteeName}
                      className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                    />
                    <div>
                      <p className="font-medium text-white">{log.inviteeName}</p>
                      <p className="text-xs text-zinc-500">@{log.inviteeUsername}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-300">
                    <p className="font-medium text-white">{log.position}</p>
                    <p className="text-xs text-zinc-500">{log.department || "General Team"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400">
                    {log.managerName ? log.managerName : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(log.inviteCode)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-mono font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition"
                    >
                      <span>{log.inviteCode}</span>
                      {copiedCode === log.inviteCode ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-zinc-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    {log.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-800/60 bg-amber-950/50 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                    {log.status === "ACCEPTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800/60 bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Accepted
                      </span>
                    )}
                    {log.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-800/60 bg-rose-950/50 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
                        <XCircle className="h-3 w-3" />
                        Declined
                      </span>
                    )}
                    {log.status === "EXPIRED" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                        Expired
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-zinc-500">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default OrgInvitationsTab;
