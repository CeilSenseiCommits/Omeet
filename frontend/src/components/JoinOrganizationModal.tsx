import { API_BASE_URL } from "../lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface JoinOrganizationModalProps {
  open: boolean;
  onClose: () => void;
}

function JoinOrganizationModal({
  open,
  onClose,
}: JoinOrganizationModalProps) {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!open) return null;

  const handleSubmit = async () => {
    if (!inviteCode.trim()) return;
    setError(null);
    setLoading(true);

    const cleanCode = inviteCode.trim().toUpperCase();

    try {
      const res = await fetch(`${API_BASE_URL}/api/invitations/code/${cleanCode}`, {
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      const data = await res.json();

      if (res.ok && data.isValid && data.invitationId) {
        navigate(`/invitation-preview/${data.invitationId}`);
        onClose();
        return;
      } else {
        setError(data.error || "Invalid or expired invitation code.");
      }
    } catch (backendErr) {
      setError("Unable to reach server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[8px] border border-[#383D47] bg-[#1D2026] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#383D47] pb-3.5">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Join Organization
            </h2>
            <p className="mt-0.5 text-xs text-[#A9ACB4]">
              Enter the invite code issued by your organization.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-[4px] p-1 text-[#717684] hover:text-white hover:bg-[#2C3039] transition"
          >
            ✕
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1.5">
            Invitation Code
          </label>
          <input
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value);
              setError(null);
            }}
            placeholder="e.g. OM-7X9K2"
            className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider text-white outline-none placeholder:text-[#717684] focus:border-[#4963C8] transition"
          />
        </div>

        {error && (
          <p className="mt-2.5 text-xs font-semibold text-[#B44A4A] bg-[#B44A4A]/10 border border-[#B44A4A]/20 rounded-[4px] p-2">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-[5px] border border-[#383D47] px-4 py-2 text-xs font-semibold text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !inviteCode.trim()}
            className="rounded-[5px] bg-[#4963C8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#3E56B5] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs"
          >
            {loading ? "Validating..." : "Redeem Code"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinOrganizationModal;