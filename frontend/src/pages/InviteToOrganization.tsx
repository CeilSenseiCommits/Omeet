import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const { user } = useAuth();

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-400">Verifying invite permissions & hierarchy...</p>
        </div>
      </div>
    );
  }

  // State: Permission Denied (has_permission is false and not Owner)
  if (!canInvite) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-zinc-950/80 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">Invite Permission Required</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{permissionReason}</p>

          <div className="mt-6 rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-left text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-2 font-medium text-zinc-300">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>OMeet Permission Governance</span>
            </div>
            <p>
              By default, only the Organization Owner has <code className="text-indigo-300">has_permission = TRUE</code>. 
              The Owner can grant invite permissions to team leads and managers inside the workspace directory.
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate(`/organization/${organizationId}`)}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl space-y-8">
        {/* Navigation & Header */}
        <div>
          <button
            type="button"
            onClick={() => navigate(`/organization/${organizationId}`)}
            className="group flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Workspace
          </button>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                  {isOwner ? "👑 Owner Access" : "✨ Delegated Permission"}
                </span>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs text-zinc-400">Direct In-App Invite</span>
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
                Invite Colleague to {orgDetails?.name || "Workspace"}
              </h1>
              {orgDetails?.brief && (
                <p className="mt-1 text-sm text-zinc-400">{orgDetails.brief}</p>
              )}
            </div>
          </div>
        </div>

        {/* Success Modal Card */}
        {invitationSuccess ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Invitation Created!</h2>
              <p className="text-sm text-zinc-300 max-w-md mx-auto">
                <span className="font-semibold text-white">{selectedUser?.name}</span> (@{selectedUser?.username}) has been sent an in-app invite for the position of{" "}
                <span className="font-semibold text-white">{position}</span>.
              </p>
            </div>

            {/* Invite Code Box for HR to give directly */}
            {createdInviteCode && (
              <div className="p-5 rounded-2xl bg-black/60 border border-indigo-500/30 max-w-md mx-auto space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    HR Quick-Share Code
                  </span>
                  <span className="text-[11px] text-zinc-400">Valid for {expiryDays} days</span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="font-mono text-xl font-bold tracking-widest text-white">
                    {createdInviteCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-sm"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCode ? "Copied!" : "Copy Code"}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-xs text-zinc-400">
                  <span className="truncate">Direct URL: {window.location.origin}/join/{createdInviteCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    {copiedLink ? "Link Copied!" : "Copy Link"}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  🔒 <span className="font-medium text-zinc-400">Account Exclusive:</span> Only @{selectedUser?.username} can redeem this code. If anyone else attempts to enter it, the system will reject it as invalid.
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-400 max-w-md mx-auto space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-zinc-500">Invitee:</span>
                <span className="text-white font-medium">@{selectedUser?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Assigned Direct Senior:</span>
                <span className="text-white font-medium">
                  {eligibleSeniors.find((s) => s.employeeId === selectedSeniorId)?.name || "Direct Senior"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Delivery:</span>
                <span className="text-emerald-400 font-medium">Delivered to OMeet Inbox & Ready via Code</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleResetForAnotherInvite}
                className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
              >
                Invite Another Member
              </button>
              <button
                type="button"
                onClick={() => navigate(`/organization/${organizationId}`)}
                className="rounded-full bg-white px-8 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Select Registered OMeet User */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium leading-6 text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-400" />
                  1. Select Registered OMeet User
                </h2>
                <span className="text-xs text-zinc-400">Must have an existing account</span>
              </div>

              {!selectedUser ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Search className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by @username, full name, or email..."
                      className="block w-full rounded-2xl border-0 bg-white/5 py-3.5 pl-11 pr-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 placeholder:text-zinc-500 transition-all"
                    />
                    {isSearchingUsers && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                      </div>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl divide-y divide-white/5 max-h-64 overflow-y-auto">
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(searchUser);
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={searchUser.avatarUrl}
                              alt={searchUser.name}
                              className="h-10 w-10 rounded-full object-cover border border-white/10"
                            />
                            <div>
                              <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                                {searchUser.name}
                              </div>
                              <div className="text-xs text-zinc-400 flex items-center gap-2">
                                <span>@{searchUser.username}</span>
                                <span>•</span>
                                <span>{searchUser.timezone}</span>
                              </div>
                            </div>
                          </div>
                          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
                            Select User
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim().length > 0 && searchResults.length === 0 && !isSearchingUsers && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center text-xs text-zinc-500">
                      No matching registered user found (or user is already a member / has pending invite).
                    </div>
                  )}

                  <p className="text-xs text-zinc-500">
                    Search finds any verified OMeet user by their @handle or name. They will immediately receive an in-app invite.
                  </p>
                </div>
              ) : (
                /* Selected User Preview Card */
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-indigo-500/40"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{selectedUser.name}</span>
                        <span className="text-xs font-medium text-indigo-400">@{selectedUser.username}</span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {selectedUser.bio || selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Position & Department */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <h2 className="text-lg font-medium leading-6 text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-400" />
                2. Position & Department
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-zinc-300">
                    Target Position / Job Title <span className="text-red-400">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="position"
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-zinc-300">
                    Department <span className="text-xs text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="department"
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Core Engineering"
                      className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Hierarchical Direct Senior Assignment */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium leading-6 text-white flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-indigo-400" />
                    3. Assign Direct Senior (Hierarchy Gate)
                  </h2>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Governed Selection
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Strict Hierarchy Rule:</span> You can only assign
                  yourself or an employee in your subordinate tree as the direct senior for this new colleague.
                </p>
              </div>

              <div className="space-y-3">
                {eligibleSeniors.map((senior) => {
                  const isSelected = selectedSeniorId === senior.employeeId;
                  return (
                    <label
                      key={senior.employeeId}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-500/10 border-indigo-500 text-white shadow-sm"
                          : "bg-white/[0.02] border-white/5 text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="manager_employee_id"
                          value={senior.employeeId}
                          checked={isSelected}
                          onChange={() => setSelectedSeniorId(senior.employeeId)}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400 border-zinc-700 bg-zinc-900"
                        />
                        <img
                          src={senior.avatarUrl}
                          alt={senior.name}
                          className="h-9 w-9 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-2">
                            <span>{senior.name}</span>
                            {senior.isSelf && (
                              <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                                You (Inviter)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {senior.position} • {senior.isSelf ? "Direct Manager" : "Reports under you"}
                          </div>
                        </div>
                      </div>

                      {senior.depth > 0 && (
                        <span className="text-xs text-zinc-500">Subordinate (Level {senior.depth})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Role & Compensation */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <h2 className="text-lg font-medium leading-6 text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                4. Organization Role & Compensation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-zinc-300">
                    Organization Role
                  </label>
                  <div className="mt-2">
                    <select
                      id="role"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all [&>option]:bg-zinc-900"
                    >
                      <option value="MEMBER">MEMBER (Standard employee access)</option>
                      {isOwner && <option value="ADMIN">ADMIN (Workspace management permissions)</option>}
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    New joiners default to <code className="text-zinc-400">has_permission = FALSE</code> until the Owner explicitly grants it.
                  </p>
                </div>

                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-zinc-300">
                    Annual Salary <span className="text-xs text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <div className="mt-2 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <DollarSign className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="number"
                      name="salary"
                      id="salary"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g. 120000"
                      className="block w-full rounded-xl border-0 bg-white/5 py-3 pl-10 pr-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="expiryDays" className="block text-sm font-medium text-zinc-300">
                    Invitation Expiry <span className="text-xs text-indigo-400 font-normal">(HR Choice)</span>
                  </label>
                  <div className="mt-2">
                    <select
                      id="expiryDays"
                      name="expiryDays"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all [&>option]:bg-zinc-900"
                    >
                      <option value="3">3 Days (Fast turnaround)</option>
                      <option value="7">7 Days (Standard / Recommended)</option>
                      <option value="14">14 Days (Extended)</option>
                      <option value="30">30 Days (Long-term offer)</option>
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    The code and in-app offer will automatically expire after this period.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20 text-sm text-red-400">
                {errorMessage}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/organization/${organizationId}`)}
                className="rounded-full px-6 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedUser || !position.trim()}
                className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-sm hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? "Sending Invitation..." : "Send In-App Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
