import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface JoinOrganizationModalProps {
  open: boolean;
  onClose: () => void;
}

function JoinOrganizationModal({
  open,
  onClose,
}: JoinOrganizationModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const navigate = useNavigate();

  if (!open) return null;

  const handleSubmit = () => {
    navigate("/placeholderForInvitationPage", {
      state: { inviteCode },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Join organization
          </h2>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-white/60">
          Enter the invite code you received from your organization.
        </p>

        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter invite code"
          className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/20"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinOrganizationModal;