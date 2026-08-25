import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
  invitationOrganizations,
  sendInvitation,
  users,
} from "../lib/mockData";

export default function InvitationPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const profile = users.find((user) => user.id === userId);

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedSeniorId, setSelectedSeniorId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedOrg = invitationOrganizations.find(
    (org) => org.id === selectedOrgId
  );

  // Effect to reset dependent fields when organization changes
  useEffect(() => {
    if (selectedOrg) {
      setSelectedPosition("");
      setSelectedSeniorId("");
      setContactEmail(selectedOrg.defaultContactEmail);
      setContactPhone(selectedOrg.defaultContactPhone);
    } else {
      setSelectedPosition("");
      setSelectedSeniorId("");
      setContactEmail("");
      setContactPhone("");
    }
  }, [selectedOrgId]);

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-zinc-400">User not found.</p>
        </div>
      </AppLayout>
    );
  }

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
        immediateSeniorId: selectedSeniorId,
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
    <AppLayout contentClassName="mx-auto w-full max-w-3xl min-w-0 flex-1 rounded-4xl border border-zinc-800 bg-zinc-900/90 p-8">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Organization Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Invite to Organization
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Assign the selected person to one of your organizations and configure their role.
        </p>
      </div>

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
            <p className="mt-1 text-xs text-zinc-500">ID: {profile.id}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            {successMessage}
          </div>
        )}

        <div className="space-y-6 rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Role & Structure
          </p>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Organization *
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none"
              required
            >
              <option value="">Select an organization...</option>
              {invitationOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Position / Job Title *
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              disabled={!selectedOrgId}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none disabled:opacity-50"
              required
            >
              <option value="">Select a position...</option>
              {selectedOrg?.availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Immediate Senior
              <span className="ml-2 text-xs font-normal text-zinc-500">
                (Will be searchable in the future)
              </span>
            </label>
            <select
              value={selectedSeniorId}
              onChange={(e) => setSelectedSeniorId(e.target.value)}
              disabled={!selectedOrgId}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-zinc-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Select immediate senior...</option>
              {selectedOrg?.eligibleImmediateSeniors.map((senior) => (
                <option key={senior.id} value={senior.id}>
                  {senior.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6 rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Organization Contact Information
          </p>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Contact Email *
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
              placeholder="hr@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Contact Phone
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

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
            className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
