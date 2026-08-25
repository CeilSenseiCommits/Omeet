interface JoinMeetingModalProps { isOpen: boolean; onClose: () => void; }

function JoinMeetingModal({ isOpen, onClose }: JoinMeetingModalProps) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4"><div className="w-full max-w-md rounded-[32px] border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"><p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Join meeting</p><h3 className="mt-1 text-xl font-semibold text-white">Join an organization meeting</h3><label className="mt-6 block text-sm text-zinc-300">Meeting code<input className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400" placeholder="e.g. ORG-483-TEAM" /></label><p className="mt-3 text-sm leading-6 text-zinc-500">Only meetings available to this organization can be joined with this code.</p><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-2xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200">Cancel</button><button type="button" onClick={onClose} className="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-medium text-zinc-950">Join meeting</button></div></div></div>;
}

export default JoinMeetingModal;
