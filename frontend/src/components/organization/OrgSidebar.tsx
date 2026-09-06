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

  // All org members search when typing
  const matchedOrgMembers = useMemo(() => {
    if (!searchQueries.dms.trim()) return [];
    const lower = searchQueries.dms.toLowerCase().trim();
    return (allMembers || []).filter(
      (m) =>
        m.name?.toLowerCase().includes(lower) ||
        m.username?.toLowerCase().includes(lower) ||
        m.position?.toLowerCase().includes(lower) ||
        m.department?.toLowerCase().includes(lower)
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
    <aside className="flex h-full w-full flex-col bg-[#FAF9F6] text-[#242427]">
      <div className="flex flex-col h-full gap-2 p-2">
        {/* 1. Direct Messages Section (Top) */}
        <div className={`flex flex-col rounded-[6px] border transition-colors ${expandedSection === "dms" ? "flex-1 overflow-hidden border-[#D8D4CB] bg-white shadow-xs" : "border-transparent"}`}>
          <div
            className={`flex items-center justify-between px-2.5 py-2 rounded-[5px] cursor-pointer transition-colors ${expandedSection === "dms" ? "" : "hover:bg-[#EDE9DF]"}`}
            onClick={() => setExpandedSection("dms")}
          >
            <div className="flex items-center gap-2">
              <Users className={`h-3.5 w-3.5 ${expandedSection === "dms" ? "text-[#4963C8]" : "text-[#7E7C77]"}`} />
              <h2 className={`text-xs font-semibold ${expandedSection === "dms" ? "text-[#242427]" : "text-[#585754]"}`}>Direct Messages</h2>
            </div>
            <button
              type="button"
              onClick={(e) => handleToggleSearch("dms", e)}
              className={`p-1 rounded-[4px] transition-colors ${expandedSection === "dms" ? "text-[#585754] hover:bg-[#EDE9DF]" : "text-[#7E7C77] hover:text-[#242427]"}`}
              aria-label="Search direct messages"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          {expandedSection === "dms" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-2.5 pb-2">
                <input
                  type="text"
                  placeholder="Search colleagues..."
                  value={searchQueries.dms}
                  onChange={(e) => handleSearchChange("dms", e)}
                  className="w-full bg-[#EDE9DF] border border-[#D8D4CB] rounded-[5px] px-2.5 py-1 text-xs text-[#242427] outline-none placeholder:text-[#7E7C77] focus:border-[#4963C8] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-1.5 pb-1.5 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {/* When query is empty: show recent conversations */}
                {!searchQueries.dms.trim() ? (
                  filteredDms.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#7E7C77]">
                      No recent conversations.
                      <p className="mt-0.5 text-[11px] text-[#7E7C77]">Search colleagues above to chat.</p>
                    </div>
                  ) : (
                    filteredDms.map((dm) => {
                      const isActive = selectedConversationId === dm.id;
                      return (
                        <button
                          key={dm.id}
                          onClick={() => onSelectConversation(selectedConversationId === dm.id ? "" : dm.id)}
                          className={`flex w-full items-center justify-between rounded-[5px] px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isActive
                              ? "bg-[#EDE9DF] border border-[#4963C8] text-[#242427] font-semibold"
                              : "border border-transparent text-[#585754] hover:border-[#D8D4CB] hover:bg-[#EDE9DF] hover:text-[#242427]"
                          }`}
                        >
                          <span className="flex items-center gap-2 overflow-hidden">
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-semibold border ${
                              isActive ? "bg-[#4963C8] text-white border-[#4963C8]" : "bg-[#EDE9DF] text-[#242427] border-[#D8D4CB]"
                            }`}>
                              {getInitials(dm.name)}
                            </div>
                            <span className="flex flex-col truncate">
                              <span className="truncate font-medium">{dm.name}</span>
                              <span className="text-[10px] text-[#7E7C77] truncate">{dm.role}</span>
                            </span>
                          </span>
                          {dm.unreadCount > 0 && (
                            <span className="flex h-4 min-w-[16px] px-1 shrink-0 items-center justify-center rounded-[3px] bg-[#4963C8] text-[9px] font-bold text-white">
                              {dm.unreadCount > 99 ? "99+" : dm.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )
                ) : (
                  /* When searching: show all matching colleagues from the organization with matching prefix */
                  matchedOrgMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#7E7C77]">
                      No colleagues found matching "{searchQueries.dms}"
                    </div>
                  ) : (
                    matchedOrgMembers.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          if (onSelectColleague) {
                            onSelectColleague(emp);
                          } else {
                            onSelectConversation(emp.id);
                          }
                          // Clear DM search to return to conversation view
                          setSearchQueries((prev) => ({ ...prev, dms: "" }));
                          setSearchModes((prev) => ({ ...prev, dms: false }));
                        }}
                        className="flex w-full items-center justify-between rounded-[6px] px-2.5 py-2 text-left text-xs text-[#475569] hover:bg-[#F0FDFA] hover:text-[#0D9488] transition-colors cursor-pointer group"
                      >
                        <span className="flex items-center gap-2.5 overflow-hidden">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[#F8FAFC] text-[10px] font-semibold text-[#1E293B] border border-[#E2E8F0] shadow-2xs group-hover:border-[#0D9488]/40">
                            {getInitials(emp.name)}
                          </div>
                          <span className="flex flex-col truncate">
                            <span className="truncate font-semibold text-[#1E293B] group-hover:text-[#0D9488]">{emp.name}</span>
                            <span className="text-[10px] text-[#64748B] truncate">
                              {emp.position || "Member"} {emp.username ? `· @${emp.username}` : ""}
                            </span>
                          </span>
                        </span>
                        <span className="text-[10px] font-medium text-[#0D9488] opacity-0 group-hover:opacity-100 transition-opacity">
                          Chat →
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
        <div className={`flex flex-col rounded-[6px] border transition-colors ${expandedSection === "groups" ? "flex-1 overflow-hidden border-[#D8D4CB] bg-white shadow-xs" : "border-transparent"}`}>
          <div
            className={`flex items-center justify-between px-2.5 py-2 rounded-[5px] cursor-pointer transition-colors ${expandedSection === "groups" ? "" : "hover:bg-[#EDE9DF]"}`}
            onClick={() => setExpandedSection("groups")}
          >
            <div className="flex items-center gap-2">
              <UserPlus className={`h-3.5 w-3.5 ${expandedSection === "groups" ? "text-[#4963C8]" : "text-[#7E7C77]"}`} />
              <h2 className={`text-xs font-semibold ${expandedSection === "groups" ? "text-[#242427]" : "text-[#585754]"}`}>Groups</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCreateGroup?.();
                }}
                className="p-1 rounded-[4px] text-[#7E7C77] hover:text-[#242427] hover:bg-[#EDE9DF] transition"
                title="Create Team Group"
                aria-label="Create group"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => handleToggleSearch("groups", e)}
                className={`p-1 rounded-[4px] transition-colors ${expandedSection === "groups" ? "text-[#585754] hover:bg-[#EDE9DF]" : "text-[#7E7C77] hover:text-[#242427]"}`}
                aria-label="Search groups"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {expandedSection === "groups" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-2.5 pb-2">
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQueries.groups}
                  onChange={(e) => handleSearchChange("groups", e)}
                  className="w-full bg-[#EDE9DF] border border-[#D8D4CB] rounded-[5px] px-2.5 py-1 text-xs text-[#242427] outline-none placeholder:text-[#7E7C77] focus:border-[#4963C8] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-1.5 pb-1.5 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {filteredGroups.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#7E7C77]">
                    No groups created yet.
                    <button
                      type="button"
                      onClick={onOpenCreateGroup}
                      className="mt-1.5 block w-full text-center text-xs text-[#4963C8] hover:underline"
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
                        onClick={() => onSelectConversation(selectedConversationId === group.id ? "" : group.id)}
                        className={`flex w-full items-center justify-between rounded-[5px] px-2.5 py-1.5 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-[#EDE9DF] border border-[#4963C8] text-[#242427] font-semibold"
                            : "border border-transparent text-[#585754] hover:border-[#D8D4CB] hover:bg-[#EDE9DF] hover:text-[#242427]"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-semibold border ${
                            isActive ? "bg-[#4963C8] text-white border-[#4963C8]" : "bg-[#EDE9DF] text-[#242427] border-[#D8D4CB]"
                          }`}>
                            {getInitials(group.name)}
                          </div>
                          <span className="truncate font-medium">{group.name}</span>
                        </span>
                        {group.unreadCount > 0 && (
                          <span className="flex h-4 min-w-[16px] px-1 shrink-0 items-center justify-center rounded-[3px] bg-[#4963C8] text-[9px] font-bold text-white">
                            {group.unreadCount > 99 ? "99+" : group.unreadCount}
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
        <div className={`flex flex-col rounded-[6px] border transition-colors ${expandedSection === "rooms" ? "flex-1 overflow-hidden border-[#D8D4CB] bg-white shadow-xs" : "border-transparent"}`}>
          <div
            className={`flex items-center justify-between px-2.5 py-2 rounded-[5px] cursor-pointer transition-colors ${expandedSection === "rooms" ? "" : "hover:bg-[#EDE9DF]"}`}
            onClick={() => setExpandedSection("rooms")}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className={`h-3.5 w-3.5 ${expandedSection === "rooms" ? "text-[#4963C8]" : "text-[#7E7C77]"}`} />
              <h2 className={`text-xs font-semibold ${expandedSection === "rooms" ? "text-[#242427]" : "text-[#585754]"}`}>Chat Rooms</h2>
            </div>
            <button
              type="button"
              onClick={(e) => handleToggleSearch("rooms", e)}
              className={`p-1 rounded-[4px] transition-colors ${expandedSection === "rooms" ? "text-[#585754] hover:bg-[#EDE9DF]" : "text-[#7E7C77] hover:text-[#242427]"}`}
              aria-label="Search chat rooms"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          {expandedSection === "rooms" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-2.5 pb-2">
                <input
                  type="text"
                  placeholder="Search chat rooms..."
                  value={searchQueries.rooms}
                  onChange={(e) => handleSearchChange("rooms", e)}
                  className="w-full bg-[#EDE9DF] border border-[#D8D4CB] rounded-[5px] px-2.5 py-1 text-xs text-[#242427] outline-none placeholder:text-[#7E7C77] focus:border-[#4963C8] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-1.5 pb-1.5 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {filteredRooms.map((room) => {
                  const isActive = selectedConversationId === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => onSelectConversation(selectedConversationId === room.id ? "" : room.id)}
                      className={`flex w-full items-center justify-between rounded-[5px] px-2.5 py-1.5 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-[#EDE9DF] border border-[#4963C8] text-[#242427] font-semibold"
                          : "border border-transparent text-[#585754] hover:border-[#D8D4CB] hover:bg-[#EDE9DF] hover:text-[#242427]"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className={`font-mono text-xs ${isActive ? "text-[#4963C8]" : "text-[#7E7C77]"}`}>#</span>
                        <span className="truncate">{room.name}</span>
                      </span>
                      {room.unreadCount > 0 && (
                        <span className="flex h-4 min-w-[16px] px-1 shrink-0 items-center justify-center rounded-[3px] bg-[#4963C8] text-[9px] font-bold text-white">
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
