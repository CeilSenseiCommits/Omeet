import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
  onMeetingCreated?: () => void;
}

function CreateMeetingModal({ isOpen, onClose, organizationId, onMeetingCreated }: CreateMeetingModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("Entire Organization");
  const [hierarchyMode, setHierarchyMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleStartMeeting = async () => {
    if (!title.trim()) {
      setError("Please enter a meeting title.");
      return;
    }
    if (!organizationId) {
      setError("Organization context missing.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const scopeKey = scope === "Entire Organization" ? "ORG_WIDE" : scope === "Department" ? "DIRECT_REPORTS" : "DEPTH_2";

      const res = await fetch(`http://localhost:5000/api/organizations/${organizationId}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          title: title.trim(),
          scope: scopeKey,
          userId: user?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create meeting.");
      }

      setTitle("");
      onMeetingCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to start meeting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xl rounded-[32px] border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Create meeting</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Start an organization meeting</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-white">
            Close
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Meeting title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-600 transition"
              placeholder="e.g. Strategy sync, Product Alignment"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Hierarchy mode</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setHierarchyMode(false)}
                className={`rounded-2xl border px-3 py-2 text-sm transition ${
                  !hierarchyMode ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-800 bg-zinc-950/70 text-zinc-400"
                }`}
              >
                OFF
              </button>
              <button
                type="button"
                onClick={() => setHierarchyMode(true)}
                className={`rounded-2xl border px-3 py-2 text-sm transition ${
                  hierarchyMode ? "border-fuchsia-500 bg-fuchsia-950/40 text-fuchsia-200" : "border-zinc-800 bg-zinc-950/70 text-zinc-400"
                }`}
              >
                ON
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Scope</p>
            <div className="flex flex-wrap gap-2">
              {["Entire Organization", "Department", "Custom Selection"].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setScope(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    scope === item
                      ? "border-fuchsia-500 bg-fuchsia-950/50 text-white"
                      : "border-zinc-700 bg-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartMeeting}
            disabled={isSubmitting}
            className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
          >
            {isSubmitting ? "Starting..." : "Start Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMeetingModal;

