# claude-code-mods — user guide

How the owner uses this repository: running its mods, working in it with sessions, and starting
a new mod. Each mod's own behaviour is in its `docs/USER-GUIDE.md`.

## Using a mod

- **Install it once,** at user scope. In a terminal:

  ```bash
  claude plugin install <mod> --marketplace FairCat-GD/claude-code-mods
  ```

  In the desktop app: + beside the prompt, then Plugins, then Add marketplace. The installed
  release then runs in every session you start, in the desktop app and the terminal alike.
- **Update it** with `claude plugin update <mod>`, then start a new session. It installs a new
  version only when a pushed `plugin.json` has one; a push that keeps the version changes nothing
  you run. Stored values carry over.
- **Try an unpushed build** in a terminal, from the repository's root:

  ```bash
  claude --plugin-dir mods/<mod>
  ```

  For that session it replaces the installed copy, and runs as `<mod>@inline` with stored values
  of its own, so the release's are left alone. `npm run types` runs the same way, which is why
  its session reads the `@inline` values.

## Working in the repository

- **One session per chat, in plan mode.** Paste the one-line opener the last session printed; it
  points at the handoff, which the session reads from the repository:
  - the repo level's is `docs/next-session-prompt.md`;
  - a mod's is `mods/<name>/docs/next-session-prompt.md`.
- **Each session plans with you before any edit,** stops to ask rather than guess, and ends with a
  local commit. Run `/code-review high` on it in the same chat; the session reports what it found
  and asks which findings to fix.
- **Pushes and tags wait for your approval,** one at a time. Before a push the session lists
  `git log origin/main..HEAD` and names any commit that is not its own.
- **Run a mod's tool** from the repository's root, with what the mod's docs say it takes:

  ```bash
  node mods/<name>/tools/<tool>.ts
  ```

  A tool is a script for you or a session to run by hand, on the repository's Node, such as a
  converter that writes a module the mod then imports. The installed mod never runs it. `verify`
  types it and runs its specs, the `*.spec.ts` beside it.
- **After a Claude Code update,** run `npm run types` in a terminal and type `/exit` once its
  prompt shows. `verify` says when it is needed: a folder's `types` stage names both versions.
  The CLI can update itself during the run, and then it asks for another.

## Starting a new mod

1. **Choose the name.** It is the mod's folder, its install id (`<name>@claude-code-mods`), the
   key its stored values live under and the prefix of its tags, for good: lowercase kebab-case,
   not `mod-template` and not a `verify` stage's name.
2. **Make it from the template,** from the repository's root:

   ```bash
   npm run new-mod -- <name> "<what it does, in one line>"
   ```

   It writes `mods/<name>/` and its marketplace entry, and nothing else, then prints what is left.
3. **Add the README row it printed** to the table of mods, in name order.
4. **Run `npm run types`** in a terminal, so the engine lays the API declarations beside the new
   mod; type `/exit` once its prompt shows.
5. **Run `npm run verify -- <name>`.** The made mod is the template renamed, so it is green.
6. **Open its intake** in a new chat, in plan mode, with the opener and your request:

   ```
   Read mods/<name>/docs/next-session-prompt.md: no round is in progress, so the next session is an intake.
   ```

   followed by what the mod should do, or a design draft if you wrote one. The intake follows
   `docs/MOD-KICKOFF.md`: it asks what the request leaves open, writes the mod's round 1 plan,
   and commits the made mod with it.
7. **Its Session 1 releases 0.1.0,** replacing `/hello` with the mod's first slice, and its round 1
   ends at 1.0.0.

**To start over** before the intake commits, delete `mods/<name>/`, remove its entry from
`.claude-plugin/marketplace.json` and its README row, and run `new-mod` again.

## Running sessions side by side

Sessions at different levels, or on different mods, can run at once in this one checkout:
- **Each owns its paths.** A mod session owns its folder, its marketplace entry and its README
  row; a repo session owns everything else. A session never stages, edits or reverts another's
  changes.
- **A session starts on a clean tree of its own paths.** Another session's uncommitted work
  elsewhere does not stop it. A new mod's intake is the one that starts with uncommitted files of
  its own: the ones `new-mod` made. Until it commits them, its marketplace entry and README row
  are its own too, so another session leaves them alone.
- **Another session's uncommitted work can turn the full gate red** for that session's folder, so
  a session runs `npm run verify -- <its mod>` for its own commit. The full `npm run verify` runs
  before any push, once the other session has committed.
- **Two sessions never work on the same mod,** or both at the repo level, at once.

## The term list

Hygiene reads the private words it bans from `~/.config/hygiene/terms.txt`, one word per line,
shared by all your projects. Add a word there yourself, or say it is private in a session, which
adds it with your yes. The next `verify` in each repository then scans everything again. A
missing file fails the gate; an empty one is fine.
