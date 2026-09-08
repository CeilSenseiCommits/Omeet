import { API_BASE_URL } from "../../../lib/api";
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
    if (!conversationId || !organizationId || !user?.id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE_URL}/api/organizations/${organizationId}/conversations/${conversationId}/details?userId=${user.id}`,
        {
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to load group details.");
      }

      const resData = await res.json();
      setData(resData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load group details.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, organizationId, user?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchGroupDetails();
      setShowDeleteConfirm(false);
      setSelectedCandidateId("");
    }
  }, [isOpen, fetchGroupDetails]);

  if (!isOpen) return null;

  // Add member handler
  const handleAddMember = async () => {
    if (!selectedCandidateId || !user?.id || isAdding) return;

    try {
      setIsAdding(true);
      setError(null);
      const res = await fetch(
        `${API_BASE_URL}/api/organizations/${organizationId}/conversations/${conversationId}/participants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            targetUserId: selectedCandidateId,
          }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to add member to group.");
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
        `${API_BASE_URL}/api/organizations/${organizationId}/conversations/${conversationId}/participants/${targetUserId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to remove member from group.");
      }

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
        `${API_BASE_URL}/api/organizations/${organizationId}/conversations/${conversationId}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[8px] border border-[#383D47] bg-[#1D2026] text-[#F3F3EE] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#383D47] px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-[#252932] border border-[#383D47] text-[#8FA0EB]">
              {isChannel ? <Hash className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-[#F3F3EE] truncate">
                {isChannel ? `# ${conv?.name}` : conv?.name || "Group Info"}
              </h3>
              <p className="text-[10px] text-[#A9ACB4] truncate">
                {conv?.memberCount || 0} active members
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] p-1 text-[#A9ACB4] hover:bg-[#252932] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#717684]" />
            </div>
          ) : error ? (
            <div className="rounded-[5px] border border-[#B44A4A]/40 bg-[#B44A4A]/10 p-3 text-xs text-[#FCA5A5] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Group Description / Topic */}
              <div className="rounded-[5px] border border-[#383D47] bg-[#252932] p-3 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
                  Topic / Purpose
                </p>
                <p className="text-xs text-[#F3F3EE]">
                  {conv?.topic || "No topic set for this team space."}
                </p>
                {conv?.creatorName && (
                  <p className="text-[10px] text-[#717684] pt-0.5">
                    Created by {conv.creatorName} (@{conv.creatorUsername})
                  </p>
                )}
              </div>

              {/* Add Members Section (Admin only) */}
              {data?.isCallerAdmin && data.availableCandidates.length > 0 && (
                <div className="rounded-[5px] border border-[#383D47] bg-[#252932] p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8FA0EB]">
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add Colleague</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      className="flex-1 rounded-[5px] border border-[#383D47] bg-[#1D2026] px-2.5 py-1.5 text-xs text-[#F3F3EE] outline-none focus:border-[#4963C8] transition-colors"
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
                      className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40 shrink-0"
                    >
                      {isAdding ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              )}

              {/* Members Roster */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#A9ACB4]">
                    Members ({data?.members.length})
                  </h4>
                  {data?.isCallerAdmin && (
                    <span className="text-[10px] text-[#8FA0EB] font-medium">
                      Admin Access
                    </span>
                  )}
                </div>

                <div className="divide-y divide-[#383D47] rounded-[5px] border border-[#383D47] bg-[#252932] overflow-hidden">
                  {data?.members.map((member) => {
                    const isSelf = member.userId === user?.id;
                    const isGroupOwner = member.isCreator || member.groupRole === "OWNER";
                    const canRemoveThisMember =
                      data.isCallerAdmin && !isGroupOwner && !isSelf;

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-2.5 hover:bg-[#2C3039] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              member.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=1D2026&color=F3F3EE`
                            }
                            alt={member.name}
                            className="h-7 w-7 rounded-[4px] border border-[#383D47] object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[#F3F3EE] truncate flex items-center gap-1">
                              {member.name} {isSelf && <span className="text-[#717684]">(You)</span>}
                            </p>
                            <p className="text-[10px] text-[#A9ACB4] truncate">
                              @{member.username} · {member.position || "Member"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Role Badge */}
                          {isGroupOwner ? (
                            <span className="flex items-center gap-1 rounded-[3px] border border-amber-600/40 bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                              <Crown className="h-2.5 w-2.5" /> Owner
                            </span>
                          ) : member.groupRole === "ADMIN" ? (
                            <span className="flex items-center gap-1 rounded-[3px] border border-[#4963C8]/40 bg-[#4963C8]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#8FA0EB]">
                              <ShieldCheck className="h-2.5 w-2.5" /> Admin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-[3px] border border-[#383D47] bg-[#1D2026] px-1.5 py-0.5 text-[9px] font-medium text-[#A9ACB4]">
                              <UserCheck className="h-2.5 w-2.5" /> Member
                            </span>
                          )}

                          {/* Remove button for admin */}
                          {canRemoveThisMember && (
                            <button
                              type="button"
                              disabled={removingUserId === member.userId}
                              onClick={() => handleRemoveMember(member.userId)}
                              className="rounded-[3px] p-1 text-[#717684] hover:bg-[#B44A4A]/20 hover:text-[#B44A4A] transition-colors"
                              title="Remove member"
                            >
                              {removingUserId === member.userId ? (
                                <Loader2 className="h-3 w-3 animate-spin text-[#B44A4A]" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
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
              <div className="pt-2 border-t border-[#383D47] space-y-2">
                {/* Delete Group Section for Creator / Admin */}
                {data?.canDeleteGroup && !isChannel && (
                  <div className="rounded-[5px] border border-[#B44A4A]/30 bg-[#B44A4A]/10 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#FCA5A5]">Delete Team Group</p>
                      <p className="text-[10px] text-[#A9ACB4]">
                        Permanently delete this group and history.
                      </p>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-[5px] border border-[#B44A4A] bg-[#B44A4A]/20 hover:bg-[#B44A4A]/40 px-3 py-1 text-xs font-medium text-[#FCA5A5] transition-colors shrink-0"
                      >
                        Delete
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="rounded-[5px] border border-[#383D47] bg-[#252932] px-2.5 py-1 text-xs text-[#A9ACB4] hover:bg-[#2C3039] transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={handleDeleteGroup}
                          className="rounded-[5px] bg-[#B44A4A] hover:bg-[#9E3D3D] px-2.5 py-1 text-xs font-medium text-white transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Confirm"}
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
                      className="flex items-center gap-1 rounded-[5px] border border-[#383D47] bg-[#252932] hover:bg-[#B44A4A]/20 hover:border-[#B44A4A] hover:text-[#B44A4A] px-3 py-1.5 text-xs font-medium text-[#A9ACB4] transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Leave Group</span>
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
