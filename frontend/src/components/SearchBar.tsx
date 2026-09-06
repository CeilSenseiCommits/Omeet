import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div ref={containerRef} className="relative w-[22rem]">
      <label className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 shadow-inner transition-all focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
        <span className="sr-only">Search registered people by name or username</span>
        <svg
          className="mr-2.5 h-4 w-4 text-zinc-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
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
            className="ml-1.5 text-zinc-500 hover:text-zinc-300"
          >
            <span className="sr-only">Clear search</span>
            ✕
          </button>
        )}
      </label>

      {isOpen && (query.trim() || isSearching) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl">
          {isSearching && (
            <div className="flex items-center gap-2.5 px-2 py-3 text-xs text-zinc-400">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <span>Querying database users…</span>
            </div>
          )}

          {!isSearching && !hasResults && query.trim() && (
            <div className="px-2 py-3 text-center">
              <p className="text-sm text-zinc-400">No registered user matches "{query.trim()}"</p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Try searching by exact full name or @username.
              </p>
            </div>
          )}

          {!isSearching && hasResults && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Registered Members ({results.length})
                </p>
                <span className="text-[10px] text-cyan-400/80">Neon DB</span>
              </div>
              <ul className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
                {results.map((user, idx) => {
                  const isHighlighted = idx === activeIndex;
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all ${
                          isHighlighted
                            ? "border-cyan-500/40 bg-zinc-900 shadow-md ring-1 ring-cyan-500/20"
                            : "border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
                        }`}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-700 shrink-0"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-gradient-to-br from-cyan-950 to-zinc-900 text-xs font-bold text-cyan-200">
                            {user.initials}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-1">
                            <span className="block truncate text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 shrink-0">
                              @{user.username}
                            </span>
                          </span>
                          <span className="block truncate text-[11px] text-zinc-400">
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
