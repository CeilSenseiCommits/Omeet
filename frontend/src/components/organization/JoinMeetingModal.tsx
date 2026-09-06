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

      const res = await fetch("http://localhost:5000/api/meetings/join", {
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
      navigate(`/meeting/${data.meeting.meetingCode}`);
    } catch (err: any) {
      console.error("Join meeting error:", err);
      setError("Unable to connect to meeting service. Please check your connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-[#121215] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-950 border border-sky-800 text-sky-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Join Meeting</h3>
              <p className="text-xs text-zinc-400">Enter a code to connect to a room</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleJoin} className="p-6 space-y-5">
          {/* General Error Banner */}
          {error && !restrictedInfo && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Org Restricted Access Denied Banner */}
          {restrictedInfo && (
            <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 p-4 space-y-2.5 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-300">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span>Organization Membership Required</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                This meeting is restricted to active members of{" "}
                <strong className="text-white font-semibold">"{restrictedInfo.organizationName}"</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 border-t border-rose-900/40 pt-2">
                <Building className="h-3.5 w-3.5 text-fuchsia-400 shrink-0" />
                <span>You must be an active employee or member of this organization to join.</span>
              </div>
            </div>
          )}

          {/* Code Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Meeting Code *
            </label>
            <div className="relative">
              <Video className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                autoFocus
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                  setRestrictedInfo(null);
                }}
                placeholder="e.g. OM-7F2A9B or 7F2A9B"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-3 text-sm font-mono tracking-wider text-white placeholder:text-zinc-600 outline-none focus:border-sky-500 transition"
                required
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Prefix <span className="font-mono text-zinc-400">OM-</span> will be automatically added if omitted.
            </p>
          </div>

          {/* Info note */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-zinc-300 font-medium">Admission Rule:</span> For organization meetings, your membership credentials are automatically verified before admission. Open public meetings can be joined by any authenticated user.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !code.trim()}
              className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-950/50 transition disabled:opacity-40"
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isVerifying ? "Verifying Access..." : "Join Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JoinMeetingModal;
