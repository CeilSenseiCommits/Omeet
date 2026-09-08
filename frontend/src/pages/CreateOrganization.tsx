import { API_BASE_URL } from "../lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Building2, User } from "lucide-react";
import UserAvatar from "../components/UserAvatar";

interface CreateOrganizationForm {
  name: string;
  brief: string;
  description: string;
  size: string;
  position: string;
}

function CreateOrganization() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<CreateOrganizationForm>({
    name: "",
    brief: "",
    description: "",
    size: "",
    position: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatorName = user?.name || "Workspace Creator";
  const creatorEmail = user?.email || "";
  const creatorInitials = user?.initials || "WC";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Organization Name is required.");
      return;
    }
    if (!formData.position.trim()) {
      setError("Your Position / Job Title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          brief: formData.brief.trim(),
          description: formData.description.trim(),
          size: formData.size,
          position: formData.position.trim(),
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.organization?.id) {
        throw new Error(data.error || "Failed to create organization.");
      }

      window.dispatchEvent(new Event("organization-updated"));
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1E293B] flex justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group flex items-center text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </button>
          <div className="mt-4 border-b border-[#E2E8F0] pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#0D9488]">
              Workspace Administration
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1E293B]">Create Organization</h1>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              Set up a governed workspace for your team. You will automatically be designated as the OWNER and Employee #1.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Organization Information */}
          <div className="rounded-[10px] border border-[#E2E8F0] bg-white/95 backdrop-blur-sm p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 border-b border-[#F1F5F9] pb-3">
              <Building2 className="h-4 w-4 text-[#0D9488]" />
              1. Organization Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-[#242427]">
                  Organization Name <span className="text-[#B44A4A]">*</span>
                </label>
                <div className="mt-1.5">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 px-3 text-xs text-[#242427] placeholder-[#7E7C77] focus:border-[#4963C8] focus:outline-none transition-all"
                    placeholder="e.g. Acme Corporation"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="brief" className="block text-xs font-semibold text-[#242427]">
                    Brief / Tagline <span className="text-[11px] text-[#7E7C77] font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-[#7E7C77]">
                    {formData.brief?.length || 0}/255
                  </span>
                </div>
                <div className="mt-1.5">
                  <input
                    type="text"
                    name="brief"
                    id="brief"
                    maxLength={255}
                    value={formData.brief || ""}
                    onChange={handleChange}
                    className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 px-3 text-xs text-[#242427] placeholder-[#7E7C77] focus:border-[#4963C8] focus:outline-none transition-all"
                    placeholder="e.g. Next-gen AI video conferencing for engineering teams"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#7E7C77]">
                  A concise one-liner summary displayed on workspace directories and cards.
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-[#242427]">
                  Organization Description <span className="text-[11px] text-[#7E7C77] font-normal">(Optional)</span>
                </label>
                <div className="mt-1.5">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 px-3 text-xs text-[#242427] placeholder-[#7E7C77] focus:border-[#4963C8] focus:outline-none transition-all"
                    placeholder="Describe your organization's mission or operations..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="size" className="block text-xs font-semibold text-[#242427]">
                  Expected Team Size
                </label>
                <div className="mt-1.5">
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="block w-full rounded-[5px] border border-[#D8D4CB] bg-white py-2 px-3 text-xs text-[#242427] focus:border-[#4963C8] focus:outline-none transition-all"
                  >
                    <option value="">Select expected size bracket...</option>
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-500 employees">201-500 employees</option>
                    <option value="500+ employees">500+ employees</option>
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-[#7E7C77]">
                  Active employee count will be dynamically audited and tracked in the database.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Creator Information */}
          <div className="rounded-[6px] border border-[#D8D4CB] bg-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7E7C77] flex items-center gap-1.5">
                <User className="h-4 w-4 text-[#4963C8]" />
                2. Your Employment Designation
              </h2>
              <span className="inline-flex items-center rounded-[4px] bg-[#0D9488]/10 border border-[#0D9488]/20 px-2 py-0.5 text-[10px] font-semibold text-[#0F766E]">
                Owner (Employee #1)
              </span>
            </div>

            {/* Authenticated User Card */}
            <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0]">
              <UserAvatar name={creatorName} avatarUrl={user?.avatarUrl} size="md" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#1E293B] truncate">{creatorName}</div>
                <div className="text-[11px] text-[#64748B] truncate">{creatorEmail}</div>
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-xs font-semibold text-[#1E293B]">
                Your Position / Job Title <span className="text-[#EF4444]">*</span>
              </label>
              <div className="mt-1.5">
                <input
                  type="text"
                  name="position"
                  id="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="block w-full rounded-[6px] border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:border-[#0D9488] focus:outline-none transition-all shadow-2xs"
                  placeholder="e.g. Founder, CEO, Lead Architect"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-[#64748B]">
                Recorded in organization directory with primary executive permissions.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-[6px] bg-[#FEF2F2] p-3 border border-[#EF4444]/30 text-xs font-semibold text-[#EF4444]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-[6px] border border-[#E2E8F0] bg-white px-5 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[6px] bg-gradient-to-r from-[#0D9488] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] px-6 py-2 text-xs font-semibold text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Creating Workspace..." : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOrganization;
