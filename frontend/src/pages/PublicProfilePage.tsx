import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import SidebarNav from "../components/SidebarNav";
import { users } from "../lib/mockData";

function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const profile = users.find((user) => user.id === userId) ?? users[0];

  const primaryNavItems = [
    { id: "dashboard", label: "Dashboard", icon: "◉" },
    { id: "organizations", label: "Organizations", icon: "◌" },
    { id: "meetings", label: "Meetings", icon: "◌" },
    { id: "people", label: "People", icon: "◌" },
    { id: "notifications", label: "Notifications", icon: "◌" },
  ];

  return (
    <AppLayout
      leftRail={
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Primary</p>
            <div className="mt-3">
              <SidebarNav items={primaryNavItems} title="Primary navigation" />
            </div>
          </div>
        </div>
      }
      rightRail={
        <div className="space-y-4">
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Public profile</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Directory</h2>
              </div>
              <span className="rounded-full border border-emerald-400/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Public
              </span>
            </div>
          </div>
          
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Actions</p>
            <button
              type="button"
              onClick={() => navigate(`/invitation/${profile.id}`)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white shadow-sm"
            >
              Invite to Organization
            </button>
          </div>
        </div>
      }
    >
      <section className="space-y-6">
        <div className="rounded-[34px] border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-center gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-3xl font-bold text-white">
              {profile.initials}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Public Profile</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{profile.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-sm text-zinc-400">@{profile.username}</span>
                <span className="text-zinc-700">•</span>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  {profile.position}
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Organization</p>
                <p className="mt-2 text-lg font-semibold text-white">{profile.organization}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Location</p>
                <p className="mt-2 text-sm text-zinc-300">{profile.location}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Position</p>
                <p className="mt-2 text-sm text-zinc-300">{profile.position}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">About</p>
              <p className="mt-3 leading-7 text-zinc-400">{profile.about}</p>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-medium text-zinc-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Organizations</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Current access</h2>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {profile.organizations.map((organization) => (
              <div key={organization} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                {organization}
              </div>
            ))}
          </div>
        </section>
      </section>
    </AppLayout>
  );
}

export default PublicProfilePage;
