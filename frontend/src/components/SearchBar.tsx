import { useEffect, useMemo, useState } from "react";
import { searchMockData } from "../lib/mockData";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ organizations: [] as string[], people: [] as string[] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults({ organizations: [], people: [] });
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      setResults(searchMockData(trimmed));
      setIsSearching(false);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const hasResults = useMemo(
    () => results.organizations.length > 0 || results.people.length > 0,
    [results.organizations.length, results.people.length],
  );

  return (
    <div className="relative w-[22rem]">
      <label className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
        <span className="sr-only">Search organizations or people</span>
        <input
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-400"
          type="search"
          placeholder="Search organizations or people"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {(query.trim() || isSearching) && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-2xl">
          {isSearching && <p className="text-sm text-zinc-400">Searching…</p>}

          {!isSearching && !hasResults && query.trim() && (
            <p className="text-sm text-zinc-400">No results yet. The backend search endpoint will power this later.</p>
          )}

          {!isSearching && hasResults && (
            <div className="space-y-2">
              {results.organizations.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    Organizations
                  </p>
                  <ul className="mt-2 space-y-1">
                    {results.organizations.map((item) => (
                      <li key={item} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.people.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    People
                  </p>
                  <ul className="mt-2 space-y-1">
                    {results.people.map((item) => (
                      <li key={item} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
