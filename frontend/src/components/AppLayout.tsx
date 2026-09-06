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
    <main className="flex min-h-screen flex-col bg-transparent text-[#1E293B]">
      <TopHeader />

      <section className="flex min-h-0 flex-1 gap-4 p-4 lg:p-5" aria-label="Workspace area">
        {leftRail && (
          <aside className="w-56 shrink-0 rounded-[8px] border border-[#E2E8F0] bg-white/90 backdrop-blur-sm p-3 text-[#1E293B] shadow-xs">
            {leftRail}
          </aside>
        )}

        <section
          className={
            contentClassName ??
            "min-w-0 flex-1 rounded-[8px] border border-[#E2E8F0] bg-white/95 backdrop-blur-sm p-6 text-[#1E293B] shadow-xs"
          }
        >
          {children}
        </section>

        {rightRail && (
          <aside className="w-80 shrink-0 rounded-[8px] border border-[#E2E8F0] bg-white/90 backdrop-blur-sm p-4 text-[#1E293B] shadow-xs">
            {rightRail}
          </aside>
        )}
      </section>
    </main>
  );
}

export default AppLayout;
