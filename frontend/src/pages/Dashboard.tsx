import TopHeader from "../components/TopHeader";

/**
 * A page combines reusable components into a route-sized screen. Dashboard owns the
 * workspace proportions for now; separate rail components would be premature until
 * they contain real navigation or utility behavior.
 */
function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <TopHeader />

      {/*
       * This is a one-dimensional left-to-right relationship, so flex is simpler than
       * grid. Fixed rail widths preserve their utility roles while `flex-1` lets the
       * center absorb all remaining desktop space.
       */}
      <section className="flex min-h-0 flex-1 gap-5 p-6" aria-label="Workspace area">
        <aside className="w-52 shrink-0 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm font-medium text-zinc-400">Left rail</p>
        </aside>

        <section className="min-w-0 flex-1 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm font-medium text-zinc-400">Center content</p>
        </section>

        <aside className="w-72 shrink-0 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm font-medium text-zinc-400">Right rail</p>
        </aside>
      </section>
    </main>
  );
}

export default Dashboard;
