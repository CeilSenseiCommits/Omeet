import SearchBar from "./SearchBar";

const user = {
  name: "Suryansh",
  // A backend response will eventually replace this mock value.
  avatarUrl: null as string | null,
};

/**
 * The persistent header owns global identity and search controls. Keeping it separate
 * means every future page can reuse one consistent header rather than copying its markup.
 */
function TopHeader() {
  // `??` uses the fallback only for null or undefined. An empty string is kept as a
  // deliberate backend value, unlike `||`, which would treat it as missing.
  const avatar =
    user.avatarUrl ??
    "https://ui-avatars.com/api/?name=Suryansh&background=111827&color=ffffff";

  return (
    <header className="flex h-24 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-8">
      <div className="flex items-center gap-4">
        <img
          className="size-12 rounded-full border border-zinc-800 object-cover"
          src={avatar}
          alt={`${user.name}'s profile`}
        />
        <div>
          <p className="text-lg font-semibold text-white">Good morning, {user.name}</p>
          <p className="mt-1 text-sm text-zinc-400">Hope you have a productive day.</p>
        </div>
      </div>

      <SearchBar />
    </header>
  );
}

export default TopHeader;
