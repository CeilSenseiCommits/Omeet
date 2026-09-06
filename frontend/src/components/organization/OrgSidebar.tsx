import { useState, useMemo } from "react";
import type { ChangeEvent } from "react";
import { MessageSquare, Users, UserPlus, Search, Plus } from "lucide-react";
import type { DirectMessage, OrganizationChatRoom, OrganizationGroup } from "../../types/organization";

interface OrgSidebarProps {
  chatRooms: OrganizationChatRoom[];
  directMessages: DirectMessage[];
  groups: OrganizationGroup[];
  allMembers?: any[];
  selectedConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onOpenCreateGroup?: () => void;
  onSelectColleague?: (colleague: any) => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function OrgSidebar({
  chatRooms,
  directMessages,
  groups,
  allMembers = [],
  selectedConversationId,
  onSelectConversation,
  onOpenCreateGroup,
  onSelectColleague,
}: OrgSidebarProps) {
  // Reordered: direct message on top, then groups, then chatrooms
  const [expandedSection, setExpandedSection] = useState<"dms" | "groups" | "rooms">("dms");
  const [searchModes, setSearchModes] = useState({ rooms: false, dms: false, groups: false });
  const [searchQueries, setSearchQueries] = useState({ rooms: "", dms: "", groups: "" });

  const handleToggleSearch = (section: "rooms" | "dms" | "groups", event: React.MouseEvent) => {
    event.stopPropagation();
    setSearchModes((prev) => ({ ...prev, [section]: !prev[section] }));
    if (searchModes[section]) {
      setSearchQueries((prev) => ({ ...prev, [section]: "" }));
    } else {
      setExpandedSection(section);
    }
  };

  const handleSearchChange = (section: "rooms" | "dms" | "groups", e: ChangeEvent<HTMLInputElement>) => {
    setSearchQueries((prev) => ({ ...prev, [section]: e.target.value }));
  };

  // Recent DMs filter
  const filteredDms = useMemo(() => {
    if (!searchQueries.dms) return directMessages;
    const lower = searchQueries.dms.toLowerCase();
    return directMessages
      .filter((m) => m.name.toLowerCase().startsWith(lower))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [directMessages, searchQueries.dms]);

  // All org members prefix search when typing
  const matchedOrgMembers = useMemo(() => {
    if (!searchQueries.dms.trim()) return [];
    const lower = searchQueries.dms.toLowerCase();
    return (allMembers || []).filter(
      (m) =>
        m.name?.toLowerCase().startsWith(lower) ||
        m.username?.toLowerCase().startsWith(lower) ||
        m.position?.toLowerCase().startsWith(lower)
    );
  }, [allMembers, searchQueries.dms]);

  const filteredGroups = useMemo(() => {
    if (!searchQueries.groups) return groups;
    const lower = searchQueries.groups.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().startsWith(lower)).sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, searchQueries.groups]);

  const filteredRooms = useMemo(() => {
    if (!searchQueries.rooms) return chatRooms;
    const lower = searchQueries.rooms.toLowerCase();
    return chatRooms.filter((r) => r.name.toLowerCase().startsWith(lower)).sort((a, b) => a.name.localeCompare(b.name));
  }, [chatRooms, searchQueries.rooms]);

  return (
    <aside className="flex h-full w-full flex-col">
      <div className="flex flex-col h-full gap-2 p-3">
        {/* 1. Direct Messages Section (Top) */}
        <div className={`flex flex-col rounded-xl border transition-colors ${expandedSection === "dms" ? "flex-1 overflow-hidden border-fuchsia-900 bg-fuchsia-950/10" : "border-transparent"}`}>
          <div
            className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors ${expandedSection === "dms" ? "" : "hover:bg-zinc-800/40"}`}
            onClick={() => setExpandedSection("dms")}
          >
            <div className="flex items-center gap-3">
              <Users className={`h-4 w-4 ${expandedSection === "dms" ? "text-fuchsia-400" : "text-zinc-500"}`} />
              <h2 className={`text-sm font-semibold ${expandedSection === "dms" ? "text-fuchsia-100" : "text-zinc-300"}`}>Direct Messages</h2>
            </div>
            <button
              type="button"
              onClick={(e) => handleToggleSearch("dms", e)}
              className={`p-1 rounded-md transition-colors ${expandedSection === "dms" ? "text-fuchsia-300 hover:bg-fuchsia-900/50" : "text-zinc-500 hover:text-white"}`}
              aria-label="Search direct messages"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {expandedSection === "dms" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-3 pb-3">
                <input
                  type="text"
                  placeholder="Search colleagues..."
                  value={searchQueries.dms}
                  onChange={(e) => handleSearchChange("dms", e)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-700 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {/* When query is empty: show recent conversations */}
                {!searchQueries.dms.trim() ? (
                  filteredDms.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500">
                      No recent conversations.
                      <p className="mt-1 text-[11px] text-zinc-600">Search colleagues above to chat.</p>
                    </div>
                  ) : (
                    filteredDms.map((dm) => {
                      const isActive = selectedConversationId === dm.id;
                      return (
                        <button
                          key={dm.id}
                          onClick={() => onSelectConversation(dm.id)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-fuchsia-950/70 border border-fuchsia-800/60 text-white shadow-sm"
                              : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-3 overflow-hidden">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white border ${
                              isActive ? "bg-fuchsia-700 border-fuchsia-500" : "bg-zinc-800 border-zinc-700"
                            }`}>
                              {getInitials(dm.name)}
                            </div>
                            <span className="flex flex-col truncate">
                              <span className="truncate font-medium">{dm.name}</span>
                              <span className="text-[11px] text-zinc-500 truncate">{dm.role}</span>
                            </span>
                          </span>
                          {dm.unreadCount > 0 && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                              {dm.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )
                ) : (
                  /* When searching: show all matching colleagues from the organization with matching prefix */
                  matchedOrgMembers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500">
                      No colleagues found matching "{searchQueries.dms}"
                    </div>
                  ) : (
                    matchedOrgMembers.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => {
                          if (onSelectColleague) {
                            onSelectColleague(emp);
                          } else {
                            onSelectConversation(emp.id);
                          }
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-3 overflow-hidden">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fuchsia-950 text-[10px] font-bold text-fuchsia-300 border border-fuchsia-800/50">
                            {getInitials(emp.name)}
                          </div>
                          <span className="flex flex-col truncate">
                            <span className="truncate font-medium">{emp.name}</span>
                            <span className="text-[11px] text-zinc-500 truncate">
                              {emp.position || "Member"} {emp.username ? `· @${emp.username}` : ""}
                            </span>
                          </span>
                        </span>
                      </button>
                    ))
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Groups Section (Middle) with + button */}
        <div className={`flex flex-col rounded-xl border transition-colors ${expandedSection === "groups" ? "flex-1 overflow-hidden border-fuchsia-900 bg-fuchsia-950/10" : "border-transparent"}`}>
          <div
            className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors ${expandedSection === "groups" ? "" : "hover:bg-zinc-800/40"}`}
            onClick={() => setExpandedSection("groups")}
          >
            <div className="flex items-center gap-3">
              <UserPlus className={`h-4 w-4 ${expandedSection === "groups" ? "text-fuchsia-400" : "text-zinc-500"}`} />
              <h2 className={`text-sm font-semibold ${expandedSection === "groups" ? "text-fuchsia-100" : "text-zinc-300"}`}>Groups</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCreateGroup?.();
                }}
                className="p-1 rounded-md text-zinc-400 hover:text-fuchsia-300 hover:bg-zinc-800/60 transition"
                title="Create Team Group"
                aria-label="Create group"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleToggleSearch("groups", e)}
                className={`p-1 rounded-md transition-colors ${expandedSection === "groups" ? "text-fuchsia-300 hover:bg-fuchsia-900/50" : "text-zinc-500 hover:text-white"}`}
                aria-label="Search groups"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {expandedSection === "groups" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-3 pb-3">
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQueries.groups}
                  onChange={(e) => handleSearchChange("groups", e)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-700 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {filteredGroups.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    No groups created yet.
                    <button
                      type="button"
                      onClick={onOpenCreateGroup}
                      className="mt-2 block w-full text-center text-xs text-fuchsia-400 hover:underline"
                    >
                      + Create first group
                    </button>
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const isActive = selectedConversationId === group.id;
                    return (
                      <button
                        key={group.id}
                        onClick={() => onSelectConversation(group.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-fuchsia-950/70 border border-fuchsia-800/60 text-white shadow-sm"
                            : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-3 truncate">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white border ${
                            isActive ? "bg-fuchsia-700 border-fuchsia-500" : "bg-zinc-800 border-zinc-700"
                          }`}>
                            {getInitials(group.name)}
                          </div>
                          <span className="truncate font-medium">{group.name}</span>
                        </span>
                        {group.unreadCount > 0 && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                            {group.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Chat Rooms Section (Bottom) */}
        <div className={`flex flex-col rounded-xl border transition-colors ${expandedSection === "rooms" ? "flex-1 overflow-hidden border-fuchsia-900 bg-fuchsia-950/10" : "border-transparent"}`}>
          <div
            className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors ${expandedSection === "rooms" ? "" : "hover:bg-zinc-800/40"}`}
            onClick={() => setExpandedSection("rooms")}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className={`h-4 w-4 ${expandedSection === "rooms" ? "text-fuchsia-400" : "text-zinc-500"}`} />
              <h2 className={`text-sm font-semibold ${expandedSection === "rooms" ? "text-fuchsia-100" : "text-zinc-300"}`}>Chat Rooms</h2>
            </div>
            <button
              type="button"
              onClick={(e) => handleToggleSearch("rooms", e)}
              className={`p-1 rounded-md transition-colors ${expandedSection === "rooms" ? "text-fuchsia-300 hover:bg-fuchsia-900/50" : "text-zinc-500 hover:text-white"}`}
              aria-label="Search chat rooms"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {expandedSection === "rooms" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-3 pb-3">
                <input
                  type="text"
                  placeholder="Search chat rooms..."
                  value={searchQueries.rooms}
                  onChange={(e) => handleSearchChange("rooms", e)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-700 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {filteredRooms.map((room) => {
                  const isActive = selectedConversationId === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => onSelectConversation(room.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-fuchsia-950/70 border border-fuchsia-800/60 text-white shadow-sm"
                          : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className={`font-mono ${isActive ? "text-fuchsia-400" : "text-zinc-500"}`}>#</span>
                        <span className="truncate">{room.name}</span>
                      </span>
                      {room.unreadCount > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-600 text-[10px] font-bold text-white">
                          {room.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default OrgSidebar;
