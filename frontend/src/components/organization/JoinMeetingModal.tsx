import { API_BASE_URL } from "../../lib/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  Video, 
  X, 
  Lock, 
  ShieldAlert, 
  ArrowRight, 
  Loader2, 
  Building, 
  KeyRound,
  AlertCircle
} from "lucide-react";

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
}

function JoinMeetingModal({ isOpen, onClose, organizationId }: JoinMeetingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restrictedInfo, setRestrictedInfo] = useState<{
    organizationName: string;
    isRestricted: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCode("");
    setError(null);
    setRestrictedInfo(null);
    setIsVerifying(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = code.trim().toUpperCase();
    if (!raw) {
      setError("Please enter a meeting code.");
      return;
    }

    let sanitized = raw;
    if (!sanitized.startsWith("OM-")) {
      sanitized = `OM-${sanitized}`;
    }

    try {
      setIsVerifying(true);
      setError(null);
      setRestrictedInfo(null);

      const res = await fetch(`${API_BASE_URL}/api/meetings/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          meetingCode: sanitized,
          userId: user?.id || null,
        }),
      });

      const data = await res.json();

      if (res.status === 404) {
        setError(`No meeting found with code "${sanitized}". Please verify the code and try again.`);
        return;
      }

      if (res.status === 403) {
        setError(data.error || "Access Denied: You are not an active member of this organization.");
        setRestrictedInfo({
          organizationName: data.organizationName || "the host organization",
          isRestricted: true,
        });
        return;
      }

      if (res.status === 401) {
        setError(data.error || "You must be signed in to join this organization meeting.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to join meeting. Please try again.");
        return;
      }

      // Success! Close modal and navigate to meeting room
      onClose();
      navigate(`/meeting/${data.meeting.meetingCode}`, { state: { fromOrgId: organizationId, fromTab: "Meetings" } });
    } catch (err: any) {
      console.error("Join meeting error:", err);
      setError("Unable to connect to meeting service. Please check your connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-[8px] border border-[#383D47] bg-[#1D2026] text-[#F3F3EE] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#383D47] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#252932] border border-[#383D47] text-[#4963C8]">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Join Meeting</h3>
              <p className="text-[11px] text-[#A9ACB4]">Connect with room invitation code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] border border-[#383D47] bg-[#252932] p-1.5 text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleJoin} className="p-6 space-y-4">
          {/* General Error Banner */}
          {error && !restrictedInfo && (
            <div className="flex items-start gap-2.5 rounded-[5px] border border-[#B44A4A]/30 bg-[#B44A4A]/10 p-3 text-xs font-semibold text-[#B44A4A] leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Org Restricted Access Denied Banner */}
          {restrictedInfo && (
            <div className="rounded-[5px] border border-[#B44A4A]/40 bg-[#B44A4A]/10 p-3.5 space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B44A4A]">
                <ShieldAlert className="h-4 w-4 text-[#B44A4A]" />
                <span>Organization Access Required</span>
              </div>
              <p className="text-xs text-[#F3F3EE] leading-relaxed">
                This meeting is restricted to active members of{" "}
                <strong className="text-white font-semibold">"{restrictedInfo.organizationName}"</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#A9ACB4] border-t border-[#B44A4A]/20 pt-2">
                <Building className="h-3.5 w-3.5 text-[#4963C8] shrink-0" />
                <span>You must be an employee of this workspace to participate.</span>
              </div>
            </div>
          )}

          {/* Code Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
              Meeting Code *
            </label>
            <div className="relative">
              <Video className="absolute left-3.5 top-3 h-4 w-4 text-[#717684]" />
              <input
                autoFocus
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                  setRestrictedInfo(null);
                }}
                placeholder="e.g. OM-7F2A9B"
                className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] pl-9 pr-3.5 py-2 text-xs font-mono uppercase tracking-wider text-white placeholder:text-[#717684] outline-none focus:border-[#4963C8] transition"
                required
              />
            </div>
          </div>

          {/* Info note */}
          <div className="rounded-[5px] border border-[#383D47] bg-[#252932] p-3 text-[11px] text-[#A9ACB4] leading-relaxed">
            <span className="text-white font-medium">Access Verification:</span> Organization meetings verify member credentials before admitting participants into video calls.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#383D47]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[5px] border border-[#383D47] bg-[#252932] px-4 py-2 text-xs font-semibold text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !code.trim()}
              className="flex items-center gap-1.5 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-40"
            >
              {isVerifying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              {isVerifying ? "Verifying..." : "Join Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JoinMeetingModal;
