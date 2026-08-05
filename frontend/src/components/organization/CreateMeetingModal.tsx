interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateMeetingModal({ isOpen, onClose }: CreateMeetingModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xl rounded-[32px] border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.26em] text-zinc-500">Create meeting</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Schedule an organization meeting</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-white">
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Meeting title</span>
            <input className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Strategy sync" />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Hierarchy mode</p>
            <div className="flex gap-3">
              <button className="rounded-2xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">OFF</button>
              <button className="rounded-2xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-400">ON</button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Scope</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Entire Organization</span>
              <span className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Department</span>
              <span className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Custom Selection</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white">
            Cancel
          </button>
          <button type="button" className="rounded-2xl border border-zinc-700 bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-300">
            Start Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMeetingModal;
