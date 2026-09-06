import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { 
  X, 
  Users, 
  UserPlus, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Loader2, 
  AlertCircle,
  Hash,
  Crown
} from "lucide-react";

interface GroupMember {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  position?: string;
  department?: string;
  groupRole: string;
  orgRole?: string;
  joinedAt: string;
  isCreator: boolean;
}

interface CandidateMember {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  position?: string;
  department?: string;
}

interface GroupDetailsData {
  conversation: {
    id: string;
    type: "CHANNEL" | "GROUP" | "DIRECT";
    name: string;
    topic?: string;
    isPrivate?: boolean;
    createdAt: string;
    creatorName?: string;
    creatorUsername?: string;
    memberCount: number;
  };
  members: GroupMember[];
  callerRole: string | null;
  isCallerAdmin: boolean;
  canDeleteGroup: boolean;
  availableCandidates: CandidateMember[];
}

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  conversationId: string;
  onGroupDeleted?: () => void;
  onMemberUpdated?: () => void;
}

function getInitials(name: string) {
  return (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function GroupInfoModal({
  isOpen,
  onClose,
  organizationId,
  conversationId,
  onGroupDeleted,
  onMemberUpdated,
}: GroupInfoModalProps) {
  const { user } = useAuth();
  const [data, setData] = useState<GroupDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add member state
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Remove member state
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Delete group confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch details
  const fetchGroupDetails = useCallback(async () => {
    if (!isOpen || !conversationId || !organizationId) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/conversations/${conversationId}/details?userId=${user?.id || ""}`,
        {
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load group details.");
      }

      const resData = await res.json();
      setData(resData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to fetch group details.");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, conversationId, organizationId, user?.id]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  if (!isOpen) return null;

  // Add member handler
  const handleAddMember = async () => {
    if (!selectedCandidateId || isAdding || !user?.id) return;

    try {
      setIsAdding(true);
      setError(null);
      const res = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/conversations/${conversationId}/participants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            userId: user.id,
            targetUserId: selectedCandidateId,
            role: "MEMBER",
          }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to add member.");
      }

      setSelectedCandidateId("");
      await fetchGroupDetails();
      onMemberUpdated?.();
    } catch (err: any) {
      setError(err.message || "Failed to add member.");
    } finally {
      setIsAdding(false);
    }
  };

  // Remove member handler
  const handleRemoveMember = async (targetUserId: string) => {
    if (!user?.id || removingUserId) return;

    try {
      setRemovingUserId(targetUserId);
      setError(null);
      const res = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/conversations/${conversationId}/participants/${targetUserId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to remove member.");
      }

      // If user removed themselves (left group), close modal and notify
      if (targetUserId === user.id) {
        onClose();
        onGroupDeleted?.();
        return;
      }

      await fetchGroupDetails();
      onMemberUpdated?.();
    } catch (err: any) {
      setError(err.message || "Failed to remove member.");
    } finally {
      setRemovingUserId(null);
    }
  };

  // Delete group handler
  const handleDeleteGroup = async () => {
    if (!user?.id || isDeleting) return;

    try {
      setIsDeleting(true);
      setError(null);
      const res = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to delete group.");
      }

      setShowDeleteConfirm(false);
      onClose();
      onGroupDeleted?.();
    } catch (err: any) {
      setError(err.message || "Failed to delete group.");
    } finally {
      setIsDeleting(false);
    }
  };

  const conv = data?.conversation;
  const isChannel = conv?.type === "CHANNEL";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#121214] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-950/80 border border-fuchsia-800/60 text-fuchsia-400">
              {isChannel ? <Hash className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white truncate">
                {isChannel ? `# ${conv?.name}` : conv?.name || "Group Info"}
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                {conv?.memberCount || 0} active members
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-fuchsia-500" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Group Description / Topic */}
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Topic / Purpose
                </p>
                <p className="text-sm text-zinc-200">
                  {conv?.topic || "No topic set for this team space."}
                </p>
                {conv?.creatorName && (
                  <p className="text-[11px] text-zinc-500 pt-1">
                    Created by {conv.creatorName} (@{conv.creatorUsername})
                  </p>
                )}
              </div>

              {/* Add Members Section (Admin only) */}
              {data?.isCallerAdmin && data.availableCandidates.length > 0 && (
                <div className="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-fuchsia-300">
                    <UserPlus className="h-4 w-4" />
                    <span>Add Organization Colleague</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-600 transition"
                    >
                      <option value="">Select a colleague to add...</option>
                      {data.availableCandidates.map((c) => (
                        <option key={c.userId} value={c.userId}>
                          {c.name} (@{c.username}) — {c.position || "Member"}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedCandidateId || isAdding}
                      onClick={handleAddMember}
                      className="rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-40 shrink-0"
                    >
                      {isAdding ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              )}

              {/* Members Roster */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Group Members ({data?.members.length})
                  </h4>
                  {data?.isCallerAdmin && (
                    <span className="text-[11px] text-fuchsia-400 font-medium">
                      You are an admin
                    </span>
                  )}
                </div>

                <div className="divide-y divide-zinc-800/40 rounded-xl border border-zinc-800/60 bg-zinc-950/40 overflow-hidden">
                  {data?.members.map((member) => {
                    const isSelf = member.userId === user?.id;
                    const isGroupOwner = member.isCreator || member.groupRole === "OWNER";
                    const canRemoveThisMember =
                      data.isCallerAdmin && !isGroupOwner && !isSelf;

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 hover:bg-zinc-900/40 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              member.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563eb&color=ffffff`
                            }
                            alt={member.name}
                            className="h-8 w-8 rounded-full border border-zinc-700 object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-white truncate flex items-center gap-1.5">
                              {member.name} {isSelf && <span className="text-zinc-500">(You)</span>}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              @{member.username} · {member.position || "Member"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Role Badge */}
                          {isGroupOwner ? (
                            <span className="flex items-center gap-1 rounded-full border border-amber-800/50 bg-amber-950/60 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              <Crown className="h-3 w-3" /> Owner
                            </span>
                          ) : member.groupRole === "ADMIN" ? (
                            <span className="flex items-center gap-1 rounded-full border border-indigo-800/50 bg-indigo-950/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                              <ShieldCheck className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                              <UserCheck className="h-3 w-3" /> Member
                            </span>
                          )}

                          {/* Remove button for admin */}
                          {canRemoveThisMember && (
                            <button
                              type="button"
                              disabled={removingUserId === member.userId}
                              onClick={() => handleRemoveMember(member.userId)}
                              className="rounded-lg p-1 text-zinc-500 hover:bg-rose-950/60 hover:text-rose-400 transition"
                              title="Remove member from group"
                            >
                              {removingUserId === member.userId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone: Delete Group or Leave */}
              <div className="pt-2 border-t border-zinc-800/60 space-y-3">
                {/* Delete Group Section for Creator / Admin */}
                {data?.canDeleteGroup && !isChannel && (
                  <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-rose-300">Delete Team Group</p>
                      <p className="text-[11px] text-zinc-400">
                        Permanently delete this group and all its conversation history.
                      </p>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-xl border border-rose-700/60 bg-rose-900/30 hover:bg-rose-900/60 px-3.5 py-1.5 text-xs font-semibold text-rose-200 transition shrink-0"
                      >
                        Delete Group
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={handleDeleteGroup}
                          className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Leave Group for non-creator members */}
                {!data?.canDeleteGroup && !isChannel && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => user?.id && handleRemoveMember(user.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-rose-950/60 hover:border-rose-700 hover:text-rose-300 px-4 py-2 text-xs font-semibold text-zinc-300 transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Leave Group
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupInfoModal;
