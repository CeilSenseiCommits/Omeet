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
      {/* Flex aligns the avatar and two greeting lines horizontally as one small unit. */}
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

      {/* 22rem = 352px: inside the requested 320–360px range without competing with the greeting. */}
      <label className="flex w-[22rem] items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
        <span className="sr-only">Search organizations or people</span>
        <input
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-400"
          type="search"
          placeholder="Search organizations or people"
        />
      </label>
    </header>
  );
}

export default TopHeader;
