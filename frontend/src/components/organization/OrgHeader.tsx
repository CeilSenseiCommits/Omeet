import { ArrowLeft, Video, LogIn, Menu } from "lucide-react";
import type { OrganizationDetails } from "../../types/organization";

interface OrgHeaderProps {
  organization: OrganizationDetails;
  onBack: () => void;
  onCreateMeeting: () => void;
  onJoinMeeting: () => void;
  onToggleRightPanel: () => void;
  rightPanelCollapsed: boolean;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function OrgHeader({
  organization,
  onBack,
  onCreateMeeting,
  onJoinMeeting,
  onToggleRightPanel,
}: OrgHeaderProps) {
  return (
    <header className="flex w-full items-center justify-between">
      {/* Left Block: Back Button aligned with Left Sidebar (280px) */}
      <div className="w-[280px] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center gap-2 rounded-xl border border-zinc-800/60 bg-[#111113] px-4 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Middle Block: Organization Info */}
      <div className="flex flex-1 items-center gap-4 px-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-950 border border-fuchsia-900 text-lg font-bold text-fuchsia-200">
          {getInitials(organization.name)}
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">{organization.name}</h1>
          <p className="mt-0.5 text-xs text-zinc-400">{organization.description}</p>
        </div>
      </div>

      {/* Right Block: Actions aligned with Right Sidebar */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onCreateMeeting}
          className="flex h-11 items-center gap-2 rounded-xl bg-fuchsia-900 border border-fuchsia-800 px-4 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
        >
          <Video className="h-4 w-4" />
          Create Meeting
        </button>
        
        <button
          type="button"
          onClick={onJoinMeeting}
          className="flex h-11 items-center gap-2 rounded-xl border border-zinc-800/60 bg-[#111113] px-4 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800/50 hover:text-white"
        >
          <LogIn className="h-4 w-4" />
          Join Meeting
        </button>

        <button
          type="button"
          onClick={onToggleRightPanel}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800/60 bg-[#111113] text-zinc-400 transition hover:bg-zinc-800/50 hover:text-white"
          aria-label="Toggle right panel"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export default OrgHeader;
