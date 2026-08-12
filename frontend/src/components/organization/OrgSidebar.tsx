import type { ChangeEvent } from "react";
import type { DirectMessage, OrganizationChatRoom, OrganizationGroup } from "../../types/organization";

interface OrgSidebarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  chatRooms: OrganizationChatRoom[];
  directMessages: DirectMessage[];
  groups: OrganizationGroup[];
}

function OrgSidebar({ searchValue, onSearchChange, chatRooms, directMessages, groups }: OrgSidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Organization chat</p>
        <div className="mt-4 space-y-3 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4">
          <label className="block text-sm font-medium text-zinc-400" htmlFor="org-search">
            Search people
          </label>
          <input
            id="org-search"
            type="search"
            value={searchValue}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
            placeholder="Search people"
            className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/20"
          />
          <button
            type="button"
            className="mt-4 w-full rounded-2xl border border-fuchsia-600 bg-fuchsia-600/10 px-4 py-2 text-sm font-medium text-fuchsia-200 transition hover:bg-fuchsia-600/20"
          >
            + Create Group
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Chat Rooms</p>
        <div className="mt-3 space-y-2 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-3">
          {chatRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition ${
                room.active ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-300 hover:bg-zinc-900/80"
              }`}
            >
              <span>{room.name}</span>
              {room.unreadCount > 0 ? (
                <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {room.unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Direct Messages</p>
        <div className="mt-3 space-y-2 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-3">
          {directMessages.map((message) => (
            <button
              key={message.id}
              type="button"
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition ${
                message.active ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-300 hover:bg-zinc-900/80"
              }`}
            >
              <span>
                <span className="block font-medium text-white">{message.name}</span>
                <span className="block text-[11px] text-zinc-500">{message.role}</span>
              </span>
              {message.unreadCount > 0 ? (
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-black">
                  {message.unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Groups</p>
        <div className="mt-3 space-y-2 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-3">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition ${
                group.active ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-300 hover:bg-zinc-900/80"
              }`}
            >
              <span>{group.name}</span>
              {group.unreadCount > 0 ? (
                <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[11px] font-semibold text-black">
                  {group.unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrgSidebar;
