import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Users, X } from "lucide-react";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onGroupCreated?: () => void;
}

function CreateGroupModal({ isOpen, onClose, organizationId, onGroupCreated }: CreateGroupModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`http://localhost:5000/api/organizations/${organizationId}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          name: name.trim().toLowerCase().replace(/\s+/g, "-"),
          topic: topic.trim() || undefined,
          userId: user?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create group.");
      }

      setName("");
      setTopic("");
      onGroupCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121214] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-950/60 border border-fuchsia-800/50 text-fuchsia-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create Team Group</h3>
              <p className="text-xs text-zinc-400">Collaborative group for teams or departments</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. frontend-core, design-studio"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-fuchsia-600 transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Group Purpose / Topic (Optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Design reviews and asset feedback"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-fuchsia-600 transition"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-4 py-2 text-xs font-medium text-white transition disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
