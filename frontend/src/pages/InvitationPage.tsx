import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import {
  invitationOrganizations,
  sendInvitation,
  users,
} from "../lib/mockData";
import {
  Building2,
  Calendar,
  Briefcase,
  User,
  Users,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
} from "lucide-react";

function getAvatarBadge(name: string) {
  if (name === "Rahul Verma") return "RA";
  if (name === "Ananya Mehta") return "AN";
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function InvitationPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (userId && user?.id) {
      fetch(`http://localhost:5000/api/organizations/user/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          const orgs = data.organizations || [];
          if (orgs.length > 0) {
            navigate(`/organization/${orgs[0].id}/invite?candidateId=${userId}`, { replace: true });
          }
        })
        .catch(() => {});
    }
  }, [userId, user?.id, navigate]);

  const profile = users.find((user) => user.id === userId);

  // Initialize with the default organization "openai-research"
  const defaultOrg =
    invitationOrganizations.find((org) => org.id === "openai-research") ||
    invitationOrganizations[0];

  const [selectedOrgId, setSelectedOrgId] = useState(defaultOrg?.id || "");
  const [selectedPosition, setSelectedPosition] = useState(
    defaultOrg?.defaultPosition || "ML Engineer"
  );
  const [department, setDepartment] = useState(
    defaultOrg?.defaultDepartment || "Applied AI"
  );
  const [employmentType, setEmploymentType] = useState(
    defaultOrg?.defaultEmploymentType || "Full-time"
  );
  const [joiningDate, setJoiningDate] = useState(
    defaultOrg?.defaultJoiningDate || "2026-09-15"
  );
  const [selectedSeniorId, setSelectedSeniorId] = useState(
    defaultOrg?.eligibleImmediateSeniors[0]?.id || "emp_301"
  );
  const [selectedMentorId, setSelectedMentorId] = useState(
    defaultOrg?.eligibleMentors[0]?.id || "emp_302"
  );

  const [inviterName, setInviterName] = useState(
    defaultOrg?.inviter?.name || "Priya Sharma"
  );
  const [inviterRole, setInviterRole] = useState(
    defaultOrg?.inviter?.role || "HR Manager"
  );
  const [inviterEmail, setInviterEmail] = useState(
    defaultOrg?.inviter?.email || "priya@openai-research.com"
  );
  const [inviterPhone, setInviterPhone] = useState(
    defaultOrg?.inviter?.phone || "+91 9876543210"
  );

  const [invitedOn, setInvitedOn] = useState(
    defaultOrg?.defaultInvitedOn || "2026-08-31"
  );
  const [expiresOn, setExpiresOn] = useState(
    defaultOrg?.defaultExpiresOn || "2026-09-07"
  );

  const [contactEmail, setContactEmail] = useState(
    defaultOrg?.defaultContactEmail || "hr@openai-research.com"
  );
  const [contactPhone, setContactPhone] = useState(
    defaultOrg?.defaultContactPhone || "+91 9876543210"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedOrg = invitationOrganizations.find(
    (org) => org.id === selectedOrgId
  );

  // Update dependent fields when organization changes
  useEffect(() => {
    if (selectedOrg) {
      setSelectedPosition(selectedOrg.defaultPosition || selectedOrg.availablePositions[0] || "");
      setDepartment(selectedOrg.defaultDepartment || selectedOrg.departments[0] || "");
      setEmploymentType(selectedOrg.defaultEmploymentType || "Full-time");
      setJoiningDate(selectedOrg.defaultJoiningDate || "2026-09-15");
      setSelectedSeniorId(selectedOrg.eligibleImmediateSeniors[0]?.id || "");
      setSelectedMentorId(selectedOrg.eligibleMentors[0]?.id || "");
      setInviterName(selectedOrg.inviter?.name || "");
      setInviterRole(selectedOrg.inviter?.role || "");
      setInviterEmail(selectedOrg.inviter?.email || "");
      setInviterPhone(selectedOrg.inviter?.phone || "");
      setInvitedOn(selectedOrg.defaultInvitedOn || "2026-08-31");
      setExpiresOn(selectedOrg.defaultExpiresOn || "2026-09-07");
      setContactEmail(selectedOrg.defaultContactEmail);
      setContactPhone(selectedOrg.defaultContactPhone);
    }
  }, [selectedOrgId]);

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full items-center justify-center p-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent mb-3" />
          <p className="text-sm font-medium text-white">Opening Organization Invitation...</p>
          <p className="text-xs text-zinc-500 mt-1">Connecting to workspace and preparing invitation form.</p>
        </div>
      </AppLayout>
    );
  }

  const selectedSenior = selectedOrg?.eligibleImmediateSeniors.find(
    (s) => s.id === selectedSeniorId
  );
  const selectedMentor = selectedOrg?.eligibleMentors.find(
    (m) => m.id === selectedMentorId
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    if (!selectedOrgId || !selectedPosition || !contactEmail) {
      setErrorMessage("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await sendInvitation({
        inviteeUserId: profile.id,
        organizationId: selectedOrgId,
        position: selectedPosition,
        department,
        employmentType,
        joiningDate,
        immediateSeniorId: selectedSeniorId,
        mentorId: selectedMentorId,
        invitedBy: {
          name: inviterName,
          role: inviterRole,
          email: inviterEmail,
          phone: inviterPhone,
        },
        invitedOn,
        expiresOn,
        contactEmail,
        contactPhone,
      });

      if (result.success) {
        setSuccessMessage("Invitation sent successfully! Redirecting...");
        setTimeout(() => {
          navigate(`/profile/${profile.id}`);
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout contentClassName="mx-auto w-full max-w-4xl min-w-0 flex-1 rounded-4xl border border-zinc-800 bg-zinc-900/90 p-8">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Organization Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Invite to Organization
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Assign the selected person to your organization and configure their role, reporting structure, and invitation terms.
        </p>
      </div>

      {/* Invitee Card */}
      <div className="mb-8 rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Invitee
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xl font-bold text-white">
            {profile.initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{profile.name}</p>
            <p className="text-sm text-zinc-400">@{profile.username}</p>
            <p className="mt-1 text-xs text-zinc-500">User ID: {profile.id}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* 1. Organization Information */}
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-400" /> Organization Information
            </h2>
            <span className="text-xs text-zinc-500">Select & review organization</span>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Select Organization *
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              required
            >
              {invitationOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {selectedOrg && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-white/5 bg-black/40 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Company Name</p>
                <p className="mt-1 text-base font-semibold text-white">{selectedOrg.name}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Industry</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedOrg.industry}</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">{selectedOrg.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Company Size</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedOrg.size}</p>
              </div>
            </div>
          )}
        </section>

        {/* 2. Offered Role */}
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-zinc-400" /> Offered Role
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Position *
              </label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                disabled={!selectedOrgId}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                required
              >
                {selectedOrg?.availablePositions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Department *
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Applied AI"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Expected Joining Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Reporting Structure */}
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" /> Reporting Structure
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Direct Senior / Immediate Manager
              </label>
              <select
                value={selectedSeniorId}
                onChange={(e) => setSelectedSeniorId(e.target.value)}
                disabled={!selectedOrgId}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none disabled:opacity-50"
              >
                {selectedOrg?.eligibleImmediateSeniors.map((senior) => (
                  <option key={senior.id} value={senior.id}>
                    {senior.name} — {senior.position}
                  </option>
                ))}
              </select>

              {selectedSenior && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    {getAvatarBadge(selectedSenior.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedSenior.name}</p>
                    <p className="text-xs text-zinc-400">Direct Senior • {selectedSenior.position}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Mentor
              </label>
              <select
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
                disabled={!selectedOrgId}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none disabled:opacity-50"
              >
                {selectedOrg?.eligibleMentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name} — {mentor.position}
                  </option>
                ))}
              </select>

              {selectedMentor && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    {getAvatarBadge(selectedMentor.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedMentor.name}</p>
                    <p className="text-xs text-zinc-400">Mentor • {selectedMentor.position}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Invited By */}
        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <User className="h-4 w-4 text-zinc-400" /> Invited By
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Name
              </label>
              <input
                type="text"
                value={inviterName}
                onChange={(e) => setInviterName(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Role
              </label>
              <input
                type="text"
                value={inviterRole}
                onChange={(e) => setInviterRole(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                type="email"
                value={inviterEmail}
                onChange={(e) => setInviterEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Phone
              </label>
              <input
                type="tel"
                value={inviterPhone}
                onChange={(e) => setInviterPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* 5. Invitation Details & 6. Organization Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invitation Details */}
          <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" /> Invitation Details
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Invited On
              </label>
              <input
                type="date"
                value={invitedOn}
                onChange={(e) => setInvitedOn(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Expires On
              </label>
              <input
                type="date"
                value={expiresOn}
                onChange={(e) => setExpiresOn(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </section>

          {/* Organization Contact */}
          <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-400" /> Organization Contact
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Email Queries *
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="hr@openai-research.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="+91 9876543210"
              />
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-4 border-t border-zinc-800 pt-6">
          <button
            type="button"
            onClick={() => navigate(`/profile/${profile.id}`)}
            className="rounded-2xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
