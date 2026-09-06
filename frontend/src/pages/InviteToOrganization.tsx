import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  GitBranch,
  Lock,
  Search,
  ShieldAlert,
  User,
  UserCheck,
  UserPlus,
  Users,
  Briefcase,
  DollarSign,
  Clock,
  Sparkles,
  X,
  Copy,
  Check,
} from "lucide-react";

interface EligibleSenior {
  employeeId: string;
  userId: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  position: string;
  role: string;
  depth: number;
  isSelf: boolean;
  label: string;
}

interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  initials: string;
  bio?: string;
  timezone: string;
}

export default function InviteToOrganization() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const candidateId = searchParams.get("candidateId") || searchParams.get("userId");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    const targetOrgId = organizationId || location.state?.fromOrgId;
    const targetTab = location.state?.fromTab || "Invitations";
    if (targetOrgId) {
      navigate(`/organization/${targetOrgId}?tab=${targetTab}`);
    } else if (candidateId || selectedUser?.id) {
      navigate(`/profile/${candidateId || selectedUser?.id}`);
    } else {
      navigate("/");
    }
  };

  // Eligibility state
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [canInvite, setCanInvite] = useState(false);
  const [permissionReason, setPermissionReason] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [orgDetails, setOrgDetails] = useState<{ id: string; name: string; brief?: string } | null>(null);
  const [eligibleSeniors, setEligibleSeniors] = useState<EligibleSenior[]>([]);

  // Form inputs
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedSeniorId, setSelectedSeniorId] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [salary, setSalary] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invitationSuccess, setInvitationSuccess] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Check user invite eligibility and fetch hierarchy direct senior options
  useEffect(() => {
    async function checkEligibility() {
      if (!organizationId || !user?.id) return;
      setIsCheckingEligibility(true);
      setErrorMessage(null);

      try {
        const res = await fetch(
          `http://localhost:5000/api/organizations/${organizationId}/invitations/eligibility`,
          {
            headers: {
              "x-user-id": user.id,
            },
          }
        );

        const data = await res.json();

        if (res.ok && data.canInvite) {
          setCanInvite(true);
          setIsOwner(data.isOwner);
          setOrgDetails(data.organization);
          setEligibleSeniors(data.eligibleSeniors || []);

          // Automatically default direct senior to inviter themselves (depth 0)
          const selfSenior = (data.eligibleSeniors || []).find((s: EligibleSenior) => s.isSelf);
          if (selfSenior) {
            setSelectedSeniorId(selfSenior.employeeId);
          } else if (data.eligibleSeniors?.length > 0) {
            setSelectedSeniorId(data.eligibleSeniors[0].employeeId);
          }
        } else {
          setCanInvite(false);
          setPermissionReason(
            data.reason ||
              "You do not have permission to invite new members to this organization. Only the Owner and members with granted invite privileges can invite colleagues."
          );
        }
      } catch (err) {
        console.error("Failed to check invitation eligibility:", err);
        setCanInvite(false);
        setPermissionReason("Unable to reach the server. Please check your network connection.");
      } finally {
        setIsCheckingEligibility(false);
      }
    }

    checkEligibility();
  }, [organizationId, user?.id]);

  // 1.5 Automatically pre-select candidate if candidateId/userId is passed in URL
  useEffect(() => {
    if (!candidateId || selectedUser) return;

    fetch(`http://localhost:5000/api/users/profile/${candidateId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not find candidate user");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setSelectedUser({
            id: data.user.id,
            name: data.user.name,
            username: data.user.username,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl || "",
            initials: data.user.initials,
            bio: data.user.bio,
            timezone: data.user.timezone || "UTC",
          });
        }
      })
      .catch((err) => {
        console.warn("Could not pre-load candidate user:", err);
      });
  }, [candidateId, selectedUser]);

  // 2. Debounced search for registered OMeet users
  useEffect(() => {
    if (!searchQuery.trim() || selectedUser) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const cleanQ = searchQuery.trim().replace(/^@/, "");
        const res = await fetch(
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(cleanQ)}&orgId=${organizationId}&currentUserId=${user?.id || ""}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error("User search error:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery, organizationId, user?.id, selectedUser]);

  // 3. Handle Send Invitation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      setErrorMessage("Please select a registered OMeet user to invite.");
      return;
    }
    if (!position.trim()) {
      setErrorMessage("Please specify the target position / job title.");
      return;
    }
    if (!selectedSeniorId) {
      setErrorMessage("Please select a direct senior for this position.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `http://localhost:5000/api/organizations/${organizationId}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify({
            inviteeUserId: selectedUser.id,
            position: position.trim(),
            department: department.trim() || undefined,
            managerEmployeeId: selectedSeniorId,
            role,
            salary: salary ? parseFloat(salary) : undefined,
            expiryDays: parseInt(expiryDays, 10) || 7,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setCreatedInviteCode(data.invitation.inviteCode || null);
        setInvitationSuccess(true);
      } else {
        setErrorMessage(data.error || "Failed to create invitation. Please try again.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage("Network error sending invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdInviteCode) return;
    navigator.clipboard.writeText(createdInviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!createdInviteCode) return;
    const link = `${window.location.origin}/join/${createdInviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleResetForAnotherInvite = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setPosition("");
    setDepartment("");
    setSalary("");
    setRole("MEMBER");
    setExpiryDays("7");
    setCreatedInviteCode(null);
    setCopiedCode(false);
    setCopiedLink(false);
    setInvitationSuccess(false);
    setErrorMessage(null);
  };

  // State: Loading Eligibility
  if (isCheckingEligibility) {
    return (
      <div className="min-h-screen bg-[#F4F1E9] text-[#242427] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4963C8] border-t-transparent" />
          <p className="text-xs font-semibold text-[#585754]">Verifying invite permissions & hierarchy...</p>
        </div>
      </div>
    );
  }

  // State: Permission Denied (has_permission is false and not Owner)
  if (!canInvite) {
    return (
      <div className="min-h-screen bg-[#F4F1E9] text-[#242427] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[6px] border border-[#D8D4CB] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[5px] bg-[#FEF2F2] text-[#B44A4A] border border-[#B44A4A]/20">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold tracking-tight text-[#242427]">Invite Permission Required</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#585754]">{permissionReason}</p>

          <div className="mt-5 rounded-[5px] bg-[#FAF9F6] border border-[#E8E5DD] p-3.5 text-left text-xs text-[#585754] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#242427]">
              <ShieldAlert className="h-3.5 w-3.5 text-[#D97706]" />
              <span>OMeet Permission Governance</span>
            </div>
            <p className="text-[11px] text-[#7E7C77]">
              Only the Organization Owner has default invite privileges. The Owner can delegate permissions to managers within the workspace directory.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleReturn}
              className="rounded-[5px] bg-[#1D2026] px-5 py-2 text-xs font-semibold text-white hover:bg-[#2C3039] transition-colors"
            >
              Return to Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1E9] text-[#242427] flex justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl space-y-6">
        {/* Navigation & Header */}
        <div>
          <button
            type="button"
            onClick={handleReturn}
            className="group flex items-center text-xs font-semibold text-[#7E7C77] hover:text-[#242427] transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            {organizationId || location.state?.fromOrgId ? "Back to Workspace" : (candidateId || selectedUser?.id ? "Back to Profile" : "Back to Dashboard")}
          </button>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D8D4CB] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-[3px] bg-[#4963C8]/10 border border-[#4963C8]/20 px-2 py-0.5 text-[10px] font-semibold text-[#4963C8]">
                  {isOwner ? "👑 Owner Access" : "✨ Delegated Permission"}
                </span>
                <span className="text-xs text-[#D8D4CB]">•</span>
                <span className="text-[11px] text-[#7E7C77]">Direct In-App Invite</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#242427]">
                Invite Colleague to {orgDetails?.name || "Workspace"}
              </h1>
              {orgDetails?.brief && (
                <p className="mt-0.5 text-xs text-[#7E7C77]">{orgDetails.brief}</p>
              )}
            </div>
          </div>
        </div>

        {/* Success Modal Card */}
        {invitationSuccess ? (
          <div className="rounded-[6px] border border-[#10B981]/30 bg-white p-8 text-center space-y-6 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[5px] bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#242427]">Invitation Issued Successfully</h2>
              <p className="text-xs text-[#585754] max-w-md mx-auto leading-relaxed">
                An official offer for <span className="font-semibold text-[#242427]">{position}</span> has been issued to <span className="font-semibold text-[#242427]">{selectedUser?.name}</span> (@{selectedUser?.username}).
              </p>
            </div>

            {/* Invite Code Box */}
            {createdInviteCode && (
              <div className="p-4 rounded-[5px] bg-[#FAF9F6] border border-[#D8D4CB] max-w-md mx-auto space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4963C8]">
                    Candidate Redemption Code
                  </span>
                  <span className="text-[10px] text-[#7E7C77]">Valid for {expiryDays} days</span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-[5px] border border-[#D8D4CB]">
                  <span className="font-mono text-base font-bold tracking-widest text-[#242427]">
                    {createdInviteCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#4963C8] hover:bg-[#3E56B5] text-[11px] font-semibold text-white transition-all shadow-xs"
                  >
                    {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedCode ? "Copied" : "Copy Code"}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E8E5DD] text-[11px] text-[#7E7C77]">
                  <span className="truncate">Direct URL: {window.location.origin}/join/{createdInviteCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 text-[#4963C8] hover:underline font-semibold"
                  >
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                <p className="text-[10px] text-[#7E7C77] leading-relaxed">
                  🔒 <span className="font-medium text-[#585754]">Account Exclusive:</span> Only @{selectedUser?.username} can accept or redeem this invitation.
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-[5px] bg-[#FAF9F6] border border-[#E8E5DD] text-xs text-[#585754] max-w-md mx-auto space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-[#7E7C77]">Invitee:</span>
                <span className="text-[#242427] font-semibold">@{selectedUser?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7E7C77]">Assigned Direct Senior:</span>
                <span className="text-[#242427] font-semibold">
                  {eligibleSeniors.find((s) => s.employeeId === selectedSeniorId)?.name || "Direct Senior"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7E7C77]">Delivery:</span>
                <span className="text-[#065F46] font-semibold">In-app notifications + direct link</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForAnotherInvite}
                className="rounded-[5px] border border-[#D8D4CB] bg-white px-5 py-2 text-xs font-semibold text-[#585754] hover:bg-[#FAF9F6] transition-colors"
              >
                Invite Another Member
              </button>
              <button
                type="button"
                onClick={handleReturn}
                className="rounded-[5px] bg-[#1D2026] hover:bg-[#2C3039] px-6 py-2 text-xs font-semibold text-white transition-colors"
              >
                {organizationId || location.state?.fromOrgId ? "Return to Workspace" : (selectedUser ? `@${selectedUser.username}'s Profile` : "Return to Profile")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Select Registered OMeet User */}
            <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7E7C77] flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-[#4963C8]" />
                  1. Select Registered OMeet User
                </h2>
                <span className="text-[11px] text-[#7E7C77]">Must have an existing account</span>
              </div>

              {!selectedUser ? (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 text-[#7E7C77]" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by @username, full name, or email..."
                      className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2.5 pl-9 pr-3 text-xs text-[#242427] placeholder-[#7E7C77] focus:border-[#4963C8] focus:outline-none transition-all"
                    />
                    {isSearchingUsers && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4963C8] border-t-transparent" />
                      </div>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="rounded-[5px] border border-[#D8D4CB] bg-white shadow-md divide-y divide-[#E8E5DD] max-h-56 overflow-y-auto">
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(searchUser);
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center justify-between p-3 hover:bg-[#FAF9F6] transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={searchUser.avatarUrl}
                              alt={searchUser.name}
                              className="h-8 w-8 rounded-[4px] object-cover border border-[#D8D4CB]"
                            />
                            <div>
                              <div className="text-xs font-semibold text-[#242427] group-hover:text-[#4963C8] transition-colors">
                                {searchUser.name}
                              </div>
                              <div className="text-[11px] text-[#7E7C77] flex items-center gap-1.5">
                                <span>@{searchUser.username}</span>
                                <span>•</span>
                                <span>{searchUser.timezone}</span>
                              </div>
                            </div>
                          </div>
                          <span className="rounded-[3px] bg-[#4963C8]/10 border border-[#4963C8]/20 px-2.5 py-0.5 text-[10px] font-semibold text-[#4963C8]">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim().length > 0 && searchResults.length === 0 && !isSearchingUsers && (
                    <div className="rounded-[5px] border border-[#E8E5DD] bg-[#FAF9F6] p-3 text-center text-xs text-[#7E7C77]">
                      No matching registered user found (or user is already a member / has pending invite).
                    </div>
                  )}

                  <p className="text-[11px] text-[#7E7C77]">
                    Search finds any verified OMeet user by their @handle or name. They will immediately receive an in-app invite.
                  </p>
                </div>
              ) : (
                /* Selected User Preview Card */
                <div className="flex items-center justify-between p-3.5 rounded-[5px] bg-[#FAF9F6] border border-[#D8D4CB]">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.name}
                      className="h-10 w-10 rounded-[4px] object-cover border border-[#D8D4CB]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#242427] truncate">{selectedUser.name}</span>
                        <span className="text-[11px] font-semibold text-[#4963C8]">@{selectedUser.username}</span>
                      </div>
                      <p className="text-[11px] text-[#7E7C77] truncate mt-0.5">
                        {selectedUser.bio || selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#7E7C77] hover:text-[#B44A4A] px-2.5 py-1 rounded-[4px] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Position & Department */}
            <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-6 space-y-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7E7C77] flex items-center gap-1.5 border-b border-[#E8E5DD] pb-3">
                <Briefcase className="h-4 w-4 text-[#4963C8]" />
                2. Position & Department
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="position" className="block text-xs font-semibold text-[#242427]">
                    Target Position / Job Title <span className="text-[#B44A4A]">*</span>
                  </label>
                  <div className="mt-1.5">
                    <input
                      type="text"
                      name="position"
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 px-3 text-xs text-[#242427] placeholder-[#7E7C77] focus:border-[#4963C8] focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="department" className="block text-xs font-semibold text-[#242427]">
                    Department <span className="text-[11px] text-[#7E7C77] font-normal">(Optional)</span>
                  </label>
                  <div className="mt-1.5">
                    <input
                      type="text"
                      name="department"
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Core Engineering"
                      className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 px-3 text-xs text-[#242427] placeholder-[#7E7C77] focus:border-[#4963C8] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Hierarchical Direct Senior Assignment */}
            <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-6 space-y-4 shadow-sm">
              <div className="border-b border-[#E8E5DD] pb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7E7C77] flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4 text-[#4963C8]" />
                    3. Assign Direct Senior (Hierarchy Gate)
                  </h2>
                  <span className="text-[11px] text-[#065F46] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Governed Selection
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7E7C77]">
                  <span className="font-semibold text-[#585754]">Strict Hierarchy Rule:</span> You can only assign
                  yourself or an employee in your subordinate tree as the direct senior for this new colleague.
                </p>
              </div>

              <div className="space-y-2.5">
                {eligibleSeniors.map((senior) => {
                  const isSelected = selectedSeniorId === senior.employeeId;
                  return (
                    <label
                      key={senior.employeeId}
                      className={`flex items-center justify-between p-3 rounded-[5px] border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#4963C8]/5 border-[#4963C8] text-[#242427]"
                          : "bg-white border-[#D8D4CB] text-[#585754] hover:bg-[#FAF9F6]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="manager_employee_id"
                          value={senior.employeeId}
                          checked={isSelected}
                          onChange={() => setSelectedSeniorId(senior.employeeId)}
                          className="h-3.5 w-3.5 text-[#4963C8] focus:ring-[#4963C8] border-[#D8D4CB]"
                        />
                        <img
                          src={senior.avatarUrl}
                          alt={senior.name}
                          className="h-8 w-8 rounded-[4px] object-cover border border-[#D8D4CB]"
                        />
                        <div>
                          <div className="text-xs font-semibold flex items-center gap-2">
                            <span>{senior.name}</span>
                            {senior.isSelf && (
                              <span className="rounded-[3px] bg-[#4963C8]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#4963C8]">
                                You (Inviter)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#7E7C77]">
                            {senior.position} • {senior.isSelf ? "Direct Manager" : "Reports under you"}
                          </div>
                        </div>
                      </div>

                      {senior.depth > 0 && (
                        <span className="text-[10px] text-[#7E7C77]">Subordinate (Level {senior.depth})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Role & Compensation */}
            <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-6 space-y-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7E7C77] flex items-center gap-1.5 border-b border-[#E8E5DD] pb-3">
                <Users className="h-4 w-4 text-[#4963C8]" />
                4. Organization Role & Terms
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="role" className="block text-xs font-semibold text-[#242427]">
                    Role Access
                  </label>
                  <div className="mt-1.5">
                    <select
                      id="role"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 px-3 text-xs text-[#242427] focus:border-[#4963C8] focus:outline-none transition-all"
                    >
                      <option value="MEMBER">MEMBER (Standard)</option>
                      {isOwner && <option value="ADMIN">ADMIN (Workspace Lead)</option>}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="salary" className="block text-xs font-semibold text-[#242427]">
                    Annual Salary <span className="text-[11px] text-[#7E7C77] font-normal">(Optional)</span>
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                      <DollarSign className="h-3.5 w-3.5 text-[#7E7C77]" />
                    </div>
                    <input
                      type="number"
                      name="salary"
                      id="salary"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g. 120000"
                      className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 pl-8 pr-3 text-xs text-[#242427] placeholder-[#7E7C77] focus:border-[#4963C8] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="expiryDays" className="block text-xs font-semibold text-[#242427]">
                    Invitation Expiry
                  </label>
                  <div className="mt-1.5">
                    <select
                      id="expiryDays"
                      name="expiryDays"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 px-3 text-xs text-[#242427] focus:border-[#4963C8] focus:outline-none transition-all"
                    >
                      <option value="3">3 Days (Fast turnaround)</option>
                      <option value="7">7 Days (Standard / Recommended)</option>
                      <option value="14">14 Days (Extended)</option>
                      <option value="30">30 Days (Long-term offer)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="rounded-[5px] bg-[#FEF2F2] p-3 border border-[#B44A4A]/30 text-xs font-semibold text-[#B44A4A]">
                {errorMessage}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReturn}
                className="rounded-[5px] border border-[#D8D4CB] bg-white px-5 py-2 text-xs font-semibold text-[#585754] hover:bg-[#FAF9F6] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedUser || !position.trim()}
                className="rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-6 py-2 text-xs font-semibold text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? "Sending Invitation..." : "Send Formal Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
