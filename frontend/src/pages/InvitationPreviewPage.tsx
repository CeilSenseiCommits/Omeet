import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  acceptInvitation,
  declineInvitation,
  getInvitationById,
  type ReceiverInvitation,
} from "../lib/mockData";
import {
  Building2,
  Calendar,
  Briefcase,
  User,
  Users,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";

function InvitationPreviewPage() {
  const { invitationId } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<ReceiverInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      if (!invitationId) return;
      try {
        const data = await getInvitationById(invitationId);
        if (data) {
          setInvitation(data);
        } else {
          setError("Invitation not found.");
        }
      } catch (err) {
        setError("Failed to load invitation details.");
      } finally {
        setLoading(false);
      }
    }
    fetchInvitation();
  }, [invitationId]);

  const handleAccept = async () => {
    if (!invitationId || !invitation) return;
    setActionLoading(true);
    try {
      await acceptInvitation(invitationId);
      setInvitation({ ...invitation, status: "ACCEPTED" });
    } catch (err) {
      alert("Failed to accept invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!invitationId || !invitation) return;
    setActionLoading(true);
    try {
      await declineInvitation(invitationId);
      setInvitation({ ...invitation, status: "DECLINED" });
    } catch (err) {
      alert("Failed to decline invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="animate-pulse">Loading invitation...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Oops!</h2>
          <p className="text-zinc-400 mb-6">{error || "Something went wrong."}</p>
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="rounded-full p-2 hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Invitation Preview</h1>
        </div>
        <div>
          {invitation.status === "PENDING" && (
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
              PENDING
            </span>
          )}
          {invitation.status === "ACCEPTED" && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> ACCEPTED
            </span>
          )}
          {invitation.status === "DECLINED" && (
            <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              <XCircle className="h-3 w-3" /> DECLINED
            </span>
          )}
          {invitation.status === "EXPIRED" && (
            <span className="rounded-full border border-zinc-500/30 bg-zinc-500/10 px-3 py-1 text-xs font-medium text-zinc-400">
              EXPIRED
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-6 space-y-8">
        
        {/* Organization Info */}
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Organization Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Company Name</p>
              <p className="text-lg font-medium">{invitation.organization.name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Industry</p>
              <p className="text-white">{invitation.organization.industry}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-zinc-400 mb-1">Description</p>
              <p className="text-white">{invitation.organization.description}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Company Size</p>
              <p className="text-white">{invitation.organization.size} employees</p>
            </div>
          </div>
        </section>

        {/* Offered Role */}
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Offered Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Position</p>
              <p className="text-lg font-medium">{invitation.position}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Department</p>
              <p className="text-white">{invitation.department}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Employment Type</p>
              <p className="text-white">{invitation.employmentType}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Expected Joining Date</p>
              <p className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                {invitation.joiningDate}
              </p>
            </div>
          </div>
        </section>

        {/* Reporting Structure */}
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <Users className="h-4 w-4" /> Reporting Structure
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                {invitation.directSenior.name.substring(0,2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{invitation.directSenior.name}</p>
                <p className="text-xs text-zinc-400">Direct Senior • {invitation.directSenior.position}</p>
              </div>
            </div>

            {invitation.mentor && (
              <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  {invitation.mentor.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{invitation.mentor.name}</p>
                  <p className="text-xs text-zinc-400">Mentor • {invitation.mentor.position}</p>
                </div>
              </div>
            )}
            
            {invitation.teamLead && (
              <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  {invitation.teamLead.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{invitation.teamLead.name}</p>
                  <p className="text-xs text-zinc-400">Team Lead • {invitation.teamLead.position}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Inviter Info */}
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <User className="h-4 w-4" /> Invited By
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Name</p>
              <p className="text-white">{invitation.inviter.name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Role</p>
              <p className="text-white">{invitation.inviter.role}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Email</p>
              <p className="text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-500" /> {invitation.inviter.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Phone</p>
              <p className="text-white flex items-center gap-2">
                <Phone className="h-4 w-4 text-zinc-500" /> {invitation.inviter.phone}
              </p>
            </div>
          </div>
        </section>

        {/* Metadata & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Invitation Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-400">Invited On</p>
                <p className="text-sm">{invitation.createdAt}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Expires On</p>
                <p className="text-sm text-red-300">{invitation.expiresAt}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Organization Contact
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-400">Email Queries</p>
                <p className="text-sm">{invitation.contactEmail}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Phone</p>
                <p className="text-sm">{invitation.contactPhone}</p>
              </div>
            </div>
          </section>
        </div>
        
        {/* Actions */}
        {invitation.status === "PENDING" && (
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap items-center justify-end gap-4">
            <button
              onClick={() => navigate("/")}
              disabled={actionLoading}
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white/70 hover:bg-white/5 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDecline}
              disabled={actionLoading}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-6 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
            >
              Decline Invitation
            </button>
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="rounded-full bg-white px-8 py-3 text-sm font-medium text-black hover:bg-zinc-200 transition disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {actionLoading ? "Processing..." : "Accept Invitation"}
            </button>
          </div>
        )}

        {invitation.status !== "PENDING" && (
          <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
             <button
              onClick={() => navigate("/")}
              className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/20 transition"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default InvitationPreviewPage;
