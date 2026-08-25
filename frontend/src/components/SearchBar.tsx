import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsersByNamePrefix } from "../lib/mockData";

function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([] as ReturnType<typeof searchUsersByNamePrefix>);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      setResults(searchUsersByNamePrefix(trimmed));
      setIsSearching(false);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const hasResults = useMemo(() => results.length > 0, [results.length]);

  return (
    <div className="relative w-[22rem]">
      <label className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
        <span className="sr-only">Search people by name</span>
        <input
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-400"
          type="search"
          placeholder="Search people"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {(query.trim() || isSearching) && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-2xl">
          {isSearching && <p className="text-sm text-zinc-400">Searching…</p>}

          {!isSearching && !hasResults && query.trim() && (
            <p className="text-sm text-zinc-400">No matching people found yet.</p>
          )}

          {!isSearching && hasResults && (
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  People
                </p>
                <ul className="mt-2 space-y-2">
                  {results.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-left transition hover:bg-zinc-800"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold text-white">
                          {user.initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
                          <span className="block truncate text-[11px] text-zinc-500">@{user.username}</span>
                          <span className="block truncate text-[11px] text-zinc-400">
                            {user.organization} · {user.position}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
