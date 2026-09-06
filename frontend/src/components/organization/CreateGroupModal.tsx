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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[8px] border border-[#383D47] bg-[#1D2026] p-6 shadow-2xl text-[#F3F3EE]">
        <div className="flex items-center justify-between border-b border-[#383D47] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#252932] border border-[#383D47] text-[#4963C8]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Create Team Group</h3>
              <p className="text-[11px] text-[#A9ACB4]">Collaborative channel for departments</p>
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

        {error && (
          <div className="mt-3.5 rounded-[5px] border border-[#B44A4A]/30 bg-[#B44A4A]/10 p-3 text-xs font-semibold text-[#B44A4A]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1">
              Group Identifier / Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. frontend-core, design-studio"
              className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] px-3.5 py-2 text-xs text-white placeholder-[#717684] outline-none focus:border-[#4963C8] transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A9ACB4] mb-1">
              Group Purpose / Topic (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Design reviews and sprint asset coordination"
              className="w-full rounded-[5px] border border-[#383D47] bg-[#252932] px-3.5 py-2 text-xs text-white placeholder-[#717684] outline-none focus:border-[#4963C8] transition"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2.5 pt-2 border-t border-[#383D47]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[5px] border border-[#383D47] bg-[#252932] px-4 py-2 text-xs font-semibold text-[#A9ACB4] hover:bg-[#2C3039] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-5 py-2 text-xs font-semibold text-white transition disabled:opacity-50 shadow-xs"
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
