import type { ReactNode } from "react";
import TopHeader from "./TopHeader";

interface AppLayoutProps {
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  contentClassName?: string;
}

function AppLayout({ children, leftRail, rightRail, contentClassName }: AppLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <TopHeader />

      <section className="flex min-h-0 flex-1 gap-5 p-6" aria-label="Workspace area">
        <aside className="w-52 shrink-0 rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-4">
          {leftRail}
        </aside>

        <section className={contentClassName ?? "min-w-0 flex-1 rounded-4xl border border-zinc-800 bg-zinc-900/90 p-6"}>
          {children}
        </section>

        <aside className="w-72 shrink-0 rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-4">
          {rightRail}
        </aside>
      </section>
    </main>
  );
}

export default AppLayout;
