import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createOrganizationAPI, CreateOrganizationRequest } from "../lib/mockApi";
import { ArrowLeft, Building2, User } from "lucide-react";

function CreateOrganization() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: "",
    brief: "",
    description: "",
    size: "",
    position: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatorName = user?.name || "Suryansh Rao";
  const creatorEmail = user?.email || "suryansh@example.com";
  const creatorInitials = user?.initials || "SR";

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
      // Calls API to create entry in PostgreSQL `organizations` (employee_count=1) and `organization_employees`
      const response = await createOrganizationAPI({
        ...formData,
        userId: user?.id,
      });

      // Redirect to the newly created organization's workspace
      navigate(`/organization/${response.organizationId}`);
    } catch (err) {
      setError("Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Create Organization</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Set up a new workspace for your team. You will automatically be added as the OWNER and first employee.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Organization Information */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
            <h2 className="text-lg font-medium leading-6 text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-zinc-400" />
              Organization Information
            </h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                  Organization Name <span className="text-red-400">*</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    placeholder="e.g. Acme Corporation"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="brief" className="block text-sm font-medium text-zinc-300">
                    Brief / Tagline <span className="text-xs text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <span className="text-xs text-zinc-500">
                    {formData.brief?.length || 0}/255
                  </span>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    name="brief"
                    id="brief"
                    maxLength={255}
                    value={formData.brief || ""}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    placeholder="e.g. Next-gen AI video conferencing for fast-moving engineering teams"
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  A concise one-liner intro that appears on your workspace cards and previews.
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
                  Organization Description <span className="text-xs text-zinc-500 font-normal">(Optional)</span>
                </label>
                <div className="mt-2">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    placeholder="What does your organization or workspace do?"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="size" className="block text-sm font-medium text-zinc-300">
                  Organization Expected Size
                </label>
                <div className="mt-2">
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all [&>option]:bg-zinc-900"
                  >
                    <option value="">Select expected size bracket...</option>
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-500 employees">201-500 employees</option>
                    <option value="500+ employees">500+ employees</option>
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Active employee count will be automatically tracked in the database (initialized to 1).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Creator Information */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium leading-6 text-white flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-400" />
                Your Employment Profile
              </h2>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                You will be the OWNER (Employee #1)
              </span>
            </div>

            {/* Authenticated User Card */}
            <div className="flex items-center gap-x-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-200 flex items-center justify-center font-semibold text-lg border border-indigo-500/30">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={creatorName} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  creatorInitials
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-white truncate">{creatorName}</div>
                <div className="text-sm text-zinc-400 truncate">{creatorEmail}</div>
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-zinc-300">
                Your Position / Job Title <span className="text-red-400">*</span>
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="position"
                  id="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                  placeholder="e.g. Founder, CEO, Lead Researcher"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">
                Saved into the organization_employees table alongside your ownership role.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full px-6 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-sm hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Creating Organization..." : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOrganization;
