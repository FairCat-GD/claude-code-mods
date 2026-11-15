No round is in progress for mod-template. Read the root CLAUDE.md, the root
`docs/MOD-KICKOFF.md`, this mod's CLAUDE.md, then this file. The next session is this mod's
**intake**: write the owner's request down verbatim, ask what it leaves open, and plan round 1 in
this mod's `docs/spec/`, as `docs/MOD-KICKOFF.md` describes.

## State you need that is not in the docs

- **The mod is the repository's template, made by `npm run new-mod`:** `/hello`, its one test, and
  these workflow files, at 0.1.0. Nothing is committed, pushed or installed yet: the intake
  commits the made files, its marketplace entry and its README row with its own docs.
- **Session 1 releases 0.1.0.** It replaces `/hello` with the mod's first slice and rewrites the
  0.1.0 changelog entry, which no one has installed.
- **`docs/ARCHITECTURE.md` has what every mod shares filled in.** Session 0 writes the rest from
  the intake, keeping every section; `docs/USER-GUIDE.md` is the user's side of the same.
- **Open items live in `docs/BACKLOG.md`**, which is empty.

## Watch for

- **The standing traps** are in the root `CLAUDE.md`'s *Watch for*; this mod's own go in its
  `CLAUDE.md`.
- **The name is for good.** `mod-template` is the install id and the key the engine keeps its
  stored values under; a rename loses them.
