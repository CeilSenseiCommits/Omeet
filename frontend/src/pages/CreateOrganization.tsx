import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { currentUser } from "../lib/mockData";
import { createOrganizationAPI, CreateOrganizationRequest } from "../lib/mockApi";

function CreateOrganization() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: "",
    description: "",
    industry: "",
    size: "",
    position: "",
    department: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      // Call our mock API
      const response = await createOrganizationAPI(formData);
      
      // On success, redirect to the new organization workspace or dashboard
      // For now, redirecting to the new organization's workspace
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
            onClick={() => navigate(-1)}
            className="group flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">Create Organization</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Set up a new workspace for your team to collaborate and hold meetings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Organization Information */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <h3 className="text-lg font-medium leading-6 text-white mb-6">Organization Information</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
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
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
                  Organization Description
                </label>
                <div className="mt-2">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    placeholder="What does your organization do?"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-zinc-300">
                  Industry / Organization Type
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="industry"
                    id="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    placeholder="e.g. Technology"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="size" className="block text-sm font-medium text-zinc-300">
                  Organization Size
                </label>
                <div className="mt-2">
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all [&>option]:bg-zinc-900"
                  >
                    <option value="">Select size...</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Creator Information */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium leading-6 text-white">Your Profile in Organization</h3>
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                You will be the OWNER
              </span>
            </div>
            
            <div className="flex items-center gap-x-4 mb-8 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-200 flex items-center justify-center font-semibold text-lg border border-indigo-500/30">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-12 w-12 rounded-full" />
                ) : (
                  currentUser.initials
                )}
              </div>
              <div>
                <div className="font-medium text-white">{currentUser.name}</div>
                <div className="text-sm text-zinc-400">{currentUser.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-zinc-300">
                  Position / Job Title <span className="text-red-400">*</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="position"
                    id="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    placeholder="e.g. Founder, CEO"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-zinc-300">
                  Department / Team
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="department"
                    id="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-0 bg-white/5 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 transition-all"
                    placeholder="e.g. Executive"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-400">{error}</h3>
                </div>
              </div>
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
              {isSubmitting ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOrganization;
