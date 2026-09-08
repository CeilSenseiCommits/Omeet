import { API_BASE_URL } from "../lib/api";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReceiverInvitation } from "../types/invitation";
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
  const location = useLocation();
  const { user } = useAuth();

  const [invitation, setInvitation] = useState<ReceiverInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleBack = () => {
    const fromOrgId = location.state?.fromOrgId || invitation?.organization?.id;
    const fromTab = location.state?.fromTab || "Invitations";
    if (fromOrgId) {
      navigate(`/organization/${fromOrgId}?tab=${fromTab}`);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    async function fetchInvitation() {
      if (!invitationId) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/invitations/${invitationId}`, {
          headers: {
            "x-user-id": user?.id || "",
          },
        });

        const data = await res.json();

        if (res.ok && data.invitation) {
          const inv = data.invitation;
          setInvitation({
            invitationId: inv.id,
            code: inv.inviteCode || "OM-OFFER",
            organization: {
              id: inv.organizationId,
              name: inv.organizationName,
              description: inv.organizationDescription || inv.organizationBrief || "Workspace",
              industry: "Technology",
              size: "10-50",
            },
            invitee: {
              id: inv.inviteeUserId || inv.inviteeId || user?.id || "u_1",
              name: inv.inviteeName || user?.name || "Candidate",
              username: inv.inviteeUsername || user?.username || "user",
            },
            position: inv.position,
            department: inv.department || "Core Workspace",
            employmentType: "Full-time",
            joiningDate: new Date().toISOString().split("T")[0],
            directSenior: {
              id: inv.managerEmployeeId || "mgr_id",
              name: inv.managerName,
              position: inv.managerPosition,
            },
            mentor: {
              id: inv.managerEmployeeId || "mgr_id",
              name: inv.managerName,
              position: inv.managerPosition,
            },
            inviter: {
              id: inv.inviterUserId || "inv_id",
              name: inv.inviterName,
              role: "Inviting Authority",
              email: "inviter@omeet.app",
              phone: "Verified Account",
            },
            contactEmail: "support@omeet.app",
            contactPhone: "+91 9876543210",
            status: (inv.status === "PENDING" ? "PENDING" : inv.status) as "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED",
            createdAt: new Date(inv.createdAt).toLocaleDateString(),
            expiresAt: inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "In 7 days",
          });
        } else {
          setError(data.error || "Invitation not found or has expired.");
        }
      } catch (backendErr) {
        setError("Unable to connect to server. Please verify your connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [invitationId, user?.id]);

  const handleAccept = async () => {
    if (!invitationId || !invitation) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          action: "ACCEPT",
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInvitation({ ...invitation, status: "ACCEPTED" });
        setTimeout(() => {
          navigate(data.organizationId ? `/organization/${data.organizationId}` : "/");
        }, 800);
      } else {
        alert(data.error || "Failed to accept invitation.");
      }
    } catch (err) {
      alert("Network error. Failed to accept invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!invitationId || !invitation) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          action: "REJECT",
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInvitation({ ...invitation, status: "DECLINED" });
      } else {
        alert(data.error || "Failed to decline invitation.");
      }
    } catch (err) {
      alert("Network error. Failed to decline invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F1E9] text-[#242427]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4963C8] border-t-transparent" />
          <p className="text-xs font-medium text-[#7E7C77]">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F1E9] text-[#242427] p-6">
        <div className="max-w-md w-full bg-white border border-[#D8D4CB] rounded-[6px] p-8 text-center shadow-sm">
          <XCircle className="mx-auto mb-4 h-10 w-10 text-[#B44A4A]" />
          <h2 className="text-lg font-semibold text-[#242427] mb-2">Invitation Unavailable</h2>
          <p className="text-xs text-[#7E7C77] mb-6 leading-relaxed">{error || "Something went wrong."}</p>
          <button
            onClick={handleBack}
            className="w-full rounded-[5px] bg-[#1D2026] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#2C3039] transition"
          >
            {location.state?.fromOrgId || invitation?.organization?.id ? "Return to Workspace" : "Go back to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  const isInvitee = !user?.id || invitation.invitee.id === user?.id;

  return (
    <div className="min-h-screen bg-[#F4F1E9] text-[#242427] pb-24 font-sans">
      {/* Header bar */}
      <header className="sticky top-0 z-20 border-b border-[#383D47] bg-[#1D2026] text-[#F3F3EE] px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-[5px] p-1.5 text-[#A9ACB4] hover:text-white hover:bg-[#2C3039] transition"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-white tracking-wide uppercase">OMEET</span>
            <span className="text-xs text-[#717684]">/</span>
            <span className="text-xs text-[#A9ACB4] font-medium">Official Organization Invitation</span>
            {!isInvitee && (
              <span className="ml-2 rounded-[3px] border border-[#4963C8]/40 bg-[#4963C8]/15 px-2 py-0.5 text-[10px] font-semibold text-[#9BB1FA]">
                Sender View
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invitation.status === "PENDING" && (
            <span className="rounded-[3px] border border-[#D97706]/30 bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-semibold text-[#92400E]">
              PENDING RESPONSE
            </span>
          )}
          {invitation.status === "ACCEPTED" && (
            <span className="flex items-center gap-1 rounded-[3px] border border-[#10B981]/30 bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#065F46]">
              <CheckCircle2 className="h-3 w-3" /> ACCEPTED
            </span>
          )}
          {invitation.status === "DECLINED" && (
            <span className="flex items-center gap-1 rounded-[3px] border border-[#B44A4A]/30 bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-semibold text-[#991B1B]">
              <XCircle className="h-3 w-3" /> DECLINED
            </span>
          )}
          {invitation.status === "EXPIRED" && (
            <span className="rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-semibold text-[#7E7C77]">
              EXPIRED
            </span>
          )}
        </div>
      </header>

      {/* Main formal document container */}
      <main className="max-w-3xl mx-auto mt-8 px-4 sm:px-6">
        <div className="bg-white border border-[#D8D4CB] rounded-[6px] p-8 sm:p-10 shadow-sm space-y-8">
          
          {/* Document Header / Letterhead */}
          <div className="border-b border-[#E8E5DD] pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#7E7C77]">
                Letter of Engagement
              </span>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#242427]">
                {invitation.organization.name}
              </h1>
              <p className="mt-1 text-xs text-[#585754] leading-relaxed max-w-lg">
                {invitation.organization.description}
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="inline-block rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#585754]">
                Ref: {invitation.code}
              </span>
              <p className="mt-2 text-[11px] text-[#7E7C77]">Issued: {invitation.createdAt}</p>
              <p className="text-[11px] text-[#B44A4A] font-medium">Valid until: {invitation.expiresAt}</p>
            </div>
          </div>

          {/* Recipient Notice */}
          <div className="bg-[#FAF9F6] border border-[#E8E5DD] rounded-[5px] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[4px] bg-[#1D2026] text-[#F3F3EE] flex items-center justify-center font-semibold text-xs">
                {invitation.invitee.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#242427]">Candidate / Nominee</p>
                <p className="text-xs text-[#585754]">{invitation.invitee.name} <span className="text-[#7E7C77]">(@{invitation.invitee.username})</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77]">Assigned Type</p>
              <p className="text-xs font-semibold text-[#242427]">{invitation.employmentType}</p>
            </div>
          </div>

          {/* Section 1: Role & Department */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#7E7C77] flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-[#585754]" /> Position Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[#E8E5DD] rounded-[5px] p-4 bg-[#FAF9F6]/50">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7E7C77] tracking-wider">Designation</span>
                <p className="mt-0.5 text-sm font-semibold text-[#242427]">{invitation.position}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7E7C77] tracking-wider">Department</span>
                <p className="mt-0.5 text-sm font-semibold text-[#242427]">{invitation.department}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7E7C77] tracking-wider">Industry & Sector</span>
                <p className="mt-0.5 text-xs text-[#585754]">{invitation.organization.industry} • {invitation.organization.size} employees</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7E7C77] tracking-wider">Expected Joining Date</span>
                <p className="mt-0.5 text-xs text-[#585754] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#7E7C77]" />
                  {invitation.joiningDate}
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Hierarchy & Direct Senior */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#7E7C77] flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-[#585754]" /> Reporting & Supervision Chain
            </h2>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 rounded-[5px] border border-[#E8E5DD] bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-[4px] bg-[#4963C8]/10 text-[#4963C8] flex items-center justify-center font-bold text-xs border border-[#4963C8]/20">
                    {invitation.directSenior.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#242427]">{invitation.directSenior.name}</p>
                    <p className="text-[11px] text-[#7E7C77]">{invitation.directSenior.position}</p>
                  </div>
                </div>
                <span className="rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-2 py-0.5 text-[10px] font-semibold text-[#585754]">
                  Direct Senior
                </span>
              </div>

              {invitation.mentor && (
                <div className="flex items-center justify-between p-3.5 rounded-[5px] border border-[#E8E5DD] bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-[4px] bg-[#10B981]/10 text-[#065F46] flex items-center justify-center font-bold text-xs border border-[#10B981]/20">
                      {invitation.mentor.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#242427]">{invitation.mentor.name}</p>
                      <p className="text-[11px] text-[#7E7C77]">{invitation.mentor.position}</p>
                    </div>
                  </div>
                  <span className="rounded-[3px] border border-[#D8D4CB] bg-[#FAF9F6] px-2 py-0.5 text-[10px] font-semibold text-[#585754]">
                    Assigned Mentor
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Inviting Authority & Official Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E8E5DD] pt-6">
            <div className="p-4 rounded-[5px] border border-[#E8E5DD] bg-[#FAF9F6]/40 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-[#7E7C77] tracking-wider flex items-center gap-1.5">
                <User className="h-3 w-3" /> Inviting Authority
              </span>
              <p className="text-xs font-semibold text-[#242427]">{invitation.inviter.name}</p>
              <p className="text-[11px] text-[#585754]">{invitation.inviter.role}</p>
              <p className="text-[11px] text-[#7E7C77] flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> {invitation.inviter.email}
              </p>
            </div>

            <div className="p-4 rounded-[5px] border border-[#E8E5DD] bg-[#FAF9F6]/40 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-[#7E7C77] tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> Organizational Queries
              </span>
              <p className="text-xs font-semibold text-[#242427]">{invitation.organization.name}</p>
              <p className="text-[11px] text-[#585754] flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-[#7E7C77]" /> {invitation.contactEmail}
              </p>
              <p className="text-[11px] text-[#7E7C77] flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-[#7E7C77]" /> {invitation.contactPhone}
              </p>
            </div>
          </div>

          {/* Legal / Policy Note */}
          <p className="text-[11px] text-[#7E7C77] leading-relaxed border-t border-[#E8E5DD] pt-4">
            By accepting this invitation, you agree to join the workspace directory of {invitation.organization.name} under the governed reporting structure established above. This invitation is cryptographically exclusive to your account identifier.
          </p>

          {/* Action Bar */}
          {!isInvitee ? (
            <div className="pt-4 border-t border-[#E8E5DD] flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-[#585754]">
                <span className="font-semibold text-[#242427]">Viewer Note:</span> Previewing candidate copy for <span className="font-semibold text-[#4963C8]">{invitation.invitee.name}</span>. Only the designated invitee may execute accept or decline actions.
              </p>
              <button
                onClick={handleBack}
                className="rounded-[5px] bg-[#1D2026] hover:bg-[#2C3039] px-5 py-2 text-xs font-semibold text-white transition"
              >
                Return to Workspace
              </button>
            </div>
          ) : (
            <>
              {invitation.status === "PENDING" && (
                <div className="pt-4 border-t border-[#E8E5DD] flex flex-wrap items-center justify-end gap-3">
                  <button
                    onClick={handleBack}
                    disabled={actionLoading}
                    className="rounded-[5px] border border-[#D8D4CB] bg-white px-5 py-2.5 text-xs font-semibold text-[#585754] hover:bg-[#FAF9F6] transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className="rounded-[5px] border border-[#B44A4A]/40 bg-white px-5 py-2.5 text-xs font-semibold text-[#B44A4A] hover:bg-[#FEF2F2] transition disabled:opacity-50"
                  >
                    Decline Invitation
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-6 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 shadow-xs"
                  >
                    {actionLoading ? "Confirming..." : "Accept Invitation & Join"}
                  </button>
                </div>
              )}

              {invitation.status !== "PENDING" && (
                <div className="pt-4 border-t border-[#E8E5DD] flex justify-end">
                  <button
                    onClick={handleBack}
                    className="rounded-[5px] bg-[#1D2026] hover:bg-[#2C3039] px-5 py-2.5 text-xs font-semibold text-white transition"
                  >
                    {location.state?.fromOrgId || invitation?.organization?.id ? "Return to Workspace" : "Back to Dashboard"}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default InvitationPreviewPage;
