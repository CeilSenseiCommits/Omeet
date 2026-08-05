import { API } from "../lib/api";

function MeetSection() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Meet</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Launch a space for collaboration</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            ✦
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">Create Meeting</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            Start a personal meeting that is not tied to any organization yet.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-zinc-500">
            Future contract: {API.createMeeting}
          </p>
          <button
            type="button"
            className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-700"
            onClick={() => undefined}
          >
            Create meeting
          </button>
        </article>

        <article className="rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
            ↗
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">Join Meeting</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            Join a meeting using a code or invite link without leaving the dashboard.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-zinc-500">
            Future contract: {API.joinMeeting}
          </p>
          <button
            type="button"
            className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-700"
            onClick={() => undefined}
          >
            Join meeting
          </button>
        </article>
      </div>
    </section>
  );
}

export default MeetSection;
