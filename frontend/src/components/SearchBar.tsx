import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import UserAvatar from "./UserAvatar";

interface SearchUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  initials: string;
  organization?: string;
  position?: string;
  bio?: string;
}

function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch users live from PostgreSQL database table
  useEffect(() => {
    const trimmed = query.trim().replace(/^@/, "");

    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    const abortController = new AbortController();
    setIsSearching(true);
    setIsOpen(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(trimmed)}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to search users from database");
        }

        const data = await response.json();
        setResults(data.users || []);
        setActiveIndex(-1);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Database user search error:", err);
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query]);

  const handleSelectUser = (user: SearchUser) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    navigate(`/profile/${user.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelectUser(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const hasResults = results.length > 0;

  return (
    <div ref={containerRef} className="relative w-72 lg:w-80">
      <label className="flex items-center rounded-[5px] border border-[#D8D4CB] bg-[#EDE9DF] px-3 py-1.5 transition-colors focus-within:border-[#4963C8] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#4963C8]/40">
        <span className="sr-only">Search registered people by name or username</span>
        <Search className="mr-2 h-3.5 w-3.5 text-[#7E7C77] shrink-0" />
        <input
          ref={inputRef}
          className="w-full bg-transparent text-xs text-[#242427] outline-none placeholder:text-[#7E7C77]"
          type="search"
          placeholder="Search registered people..."
          value={query}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="ml-1 text-[#7E7C77] hover:text-[#242427]"
          >
            <span className="sr-only">Clear search</span>
            <X className="h-3 w-3" />
          </button>
        )}
      </label>

      {isOpen && (query.trim() || isSearching) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[6px] border border-[#D8D4CB] bg-[#FAF9F6] p-2 shadow-xl">
          {isSearching && (
            <div className="flex items-center gap-2 px-2 py-2.5 text-xs text-[#7E7C77]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4963C8]" />
              <span>Querying directory…</span>
            </div>
          )}

          {!isSearching && !hasResults && query.trim() && (
            <div className="px-2 py-3 text-center">
              <p className="text-xs text-[#242427]">No registered member matches "{query.trim()}"</p>
              <p className="mt-0.5 text-[11px] text-[#7E7C77]">
                Try searching by full name or @username.
              </p>
            </div>
          )}

          {!isSearching && hasResults && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7C77]">
                  Directory Members ({results.length})
                </p>
                <span className="text-[10px] font-semibold text-[#4963C8]">Live</span>
              </div>
              <ul className="space-y-1 max-h-[300px] overflow-y-auto pr-0.5">
                {results.map((user, idx) => {
                  const isHighlighted = idx === activeIndex;
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`group flex w-full items-center gap-2.5 rounded-[5px] border px-2.5 py-2 text-left transition-colors ${
                          isHighlighted
                            ? "border-[#4963C8] bg-[#EDE9DF]"
                            : "border-transparent hover:border-[#D8D4CB] hover:bg-[#EDE9DF]"
                        }`}
                      >
                        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-1">
                            <span className="block truncate text-xs font-semibold text-[#242427]">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-[#4963C8] shrink-0 font-mono">
                              @{user.username}
                            </span>
                          </span>
                          <span className="block truncate text-[11px] text-[#7E7C77]">
                            {user.organization || "OMeet"} · {user.position || "Member"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
