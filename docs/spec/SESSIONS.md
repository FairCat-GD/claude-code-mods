# The session plan: round 1, the repository setup

One chat per session. Never run two sessions in one chat: the point of the split is that no
session inherits stale context.

- **Scope** lives here, fixed in advance. The request and its resolved decisions are in `SPEC.md`
  beside this file, which is read-only; do not re-litigate them. If a session finds a block wrong,
  it amends the block and records the reason both in the block and in
  `docs/next-session-prompt.md`.
- **State** is `docs/next-session-prompt.md`: what the next session needs that the docs do not say.
  Every session rewrites it as its last act. The repo level keeps no changelog (decision 8); what
  shipped to cartoon-fx is in `mods/cartoon-fx/CHANGELOG.md`.
- **When this round closes,** Session 4 deletes this file and `SPEC.md`. Git history keeps them,
  and anything left open moves to `docs/BACKLOG.md`.

**Before starting**, confirm that the session's own paths are clean (decision 10) and that
`docs/next-session-prompt.md` names the session you are about to do. **Read order:** the `SPEC.md`
sections the block names, `CLAUDE.md`, then the prompt. **Then plan, in plan mode,** and ask the
block's *Ask at the start* questions before any edit.

**Every session ends the same way:**
1. `npm run verify` green (from Session 1 on), plus the hand checks the block names.
2. Every new check falsified, once. Checks that already existed are not falsified again.
3. A `CHANGELOG.md` entry for anything a mod's user would see, in that mod's changelog. No session
   in this round cuts a version.
4. The docs the block names kept true. Until Session 4 writes `docs/ARCHITECTURE.md`, the done-note
   carries what it will need: the deliberate decisions and the counts.
5. A done-note appended to the block, then the prompt rewritten, then a local commit.
6. The owner's `/code-review high`, then a review-fixes commit.
7. The next prompt printed as the chat's last message.

Never push without being asked.

| Session | Scope | Decisions | Version |
|---|---|---|---|
| 1 | Scaffold: the toolchain, `verify`, hygiene, the marketplace, the mod template | 3–10, 12, 14 | — |
| 2 | Import cartoon-fx: the files byte for byte, its workflow files, the gate green | 8–10, 12–14 | cartoon-fx stays **0.10.1** |
| 3 | cartoon-fx as an installed release, and its as-built docs | 11, 13, 14 | — |
| 4 | The repo's documentation pass; close the round | 2, 3, 15, 16 | — |

---

## 1: Scaffold

**Read:** `SPEC.md` §2 (decisions 3–10, 12, 14), §4, §5, §6, §7; `docs/DEVELOPMENT-WORKFLOW.md`
(*Day one*). Also krita-art-mcp's `scripts/hygiene.py` and `tests/test_hygiene.py`, in the owner's
checkout beside this one (`../krita-art-mcp`), read-only.

- **The toolchain** (decision 5).
  - `package.json`: `private`, `"type": "module"`, `engines.node` `>=26`, and exact pins for
    `typescript` (5.4 or newer) and `@biomejs/biome`. Commit `package-lock.json`.
  - A root `tsconfig.json` for the tooling: strict, `noEmit`, and `erasableSyntaxOnly`, so `tsc`
    refuses what Node's type stripping cannot run.
  - `biome.json`. Format settings match cartoon-fx's current style as closely as they can: its
    quotes, semicolons, indent and line width. Read its source at `~/.claude/mods/cartoon-fx`, and
    never edit it.
    - Run `biome format` on a scratch copy, and record in the done-note what Biome would still
      change. That is the input to Session 2's *Ask at the start*.
    - `docs/` and `.claude-plugin/types/` are left out.
- **`verify`** (decision 7).
  - A script under `scripts/` runs the stages of decision 7 by name, each failing on its own. Every
    command runs even after one fails. A summary follows, with each stage's time, and the exit code
    is 1 on any failure.
  - `npm run verify` runs everything, and `npm run verify -- <mod>` runs the repo stages and that
    mod's stages. Format and lint cover the tooling and the folders being verified; hygiene covers
    the whole tree.
  - A stage that cannot start fails, with a message naming the fix.
- **Hygiene** (decision 6, invariant 1).
  - A port of krita's `hygiene.py` into `scripts/`, with `scripts/hygiene_terms.txt` holding the
    seven hashes from the handoff.
  - Its tests port krita's `test_hygiene.py` case for case, using the same probe-term approach.
- **The marketplace and the mod checks** (decision 12, invariants 2–5).
  - `.claude-plugin/marketplace.json`: `name` `claude-code-mods`, `owner` `FairCat-GD`, and an
    empty `plugins` list (cartoon-fx joins in Session 2).
    - **Measure first** whether `claude plugin validate` accepts an empty `plugins` list.
    - If it does not, Session 1 commits no marketplace file. Its stage is tested against fixtures
      only, and treats "no marketplace file and no folders under `mods/`" as consistent. Session 2
      then writes the file with cartoon-fx's entry.
    - No placeholder entry is ever committed.
  - **The `marketplace` stage:**
    - every folder under `mods/` has exactly one entry, and every entry has its folder;
    - names agree with folders and `plugin.json`, and each source is `./mods/<name>`;
    - no entry carries a version;
    - each mod's `plugin.json` version is named by the newest entry of its `CHANGELOG.md`;
    - each `plugin.json` has the fields of SPEC §5;
    - no tracked path lies under `.claude-plugin/types/`.
  - **The import scan,** over a mod's or the template's sources:
    - every relative import resolves inside that folder;
    - every bare import names a module the engine declares. At intake those were `claude-code`,
      `claude-code/testing`, `claude-code-tools` and `claude-code-mcp`, plus the contract of each
      plugin under the mod's `dependencies`.
    - The scan reads that list from the laid declarations, not from a list kept in the script, so
      a new build's modules pass without an edit.
  - **Measure** whether `claude plugin validate .` at the root checks the marketplace file. If it
    does, add it to the stage.
- **The mod template** (decision 4). `templates/mod-template/` is a minimal working mod:
  - **The plugin:** a `plugin.json` with every field of SPEC §5, the name `mod-template` and
    version `0.1.0`; `hooks/hooks.json`; and a small hooks module (one fictional slash command
    that answers with text).
  - **Its gate:** one test of that command, written to SPEC §8's test practices, and its
    `tsconfig.json`.
  - **Its workflow files:** skeletons of `CLAUDE.md`, `CHANGELOG.md` (an empty `[Unreleased]` and
    `[0.1.0]`), `README.md` and `docs/`. The `docs/` skeleton has `BACKLOG.md` and a handoff
    saying the mod's next session is its intake.
  - The per-mod stages run on it. The marketplace stage does not list it, because it is not under
    `mods/`.
- **The API declarations for `tsc`.** See *Ask at the start*.
- **Fixtures.** `tests/fixtures/` holds the fictional inputs the tooling's tests need:
  - a well-formed mod, which may carry its own `*.test.ts` (`tooling-tests` never collects it);
  - a marketplace that disagrees with its folders;
  - a mod importing from outside itself;
  - a `README.md` saying that fixtures are fictional and that tests never read `docs/`.
- **Repository files.**
  - `LICENSE`: the MIT text, copyright `FairCat-GD`.
  - `README.md`: what the repository is, its layout, how to run `verify`, where the docs are, and
    a table of mods, empty until Session 2.
- **Docs.**
  - `CLAUDE.md`: the Commands table filled in, with what a session would otherwise learn the hard
    way about running each command.
  - README: written.
- **Ask at the start of 1: how the API declarations reach a fresh checkout for `tsc`.**
  - Measure the options in plan mode before proposing one:
    - whether an interactive `claude --plugin-dir <folder>` terminal session lays
      `.claude-plugin/types/` in that folder;
    - whether the declarations the plugin-authoring skill writes beside itself can be used through
      a `tsconfig` kept outside the mod folder;
    - whether any `claude plugin` command writes them.
  - The desktop app watches a folder only with `CLAUDE_CODE_PLUGIN_DIR_WATCH=1`, which is a change
    to the owner's settings. Ask before trying it.
  - Then propose how `verify` finds them, and the one documented step a fresh clone needs.

**Gates:**
- `npm run verify` green, with these tests:
  - every ported hygiene case;
  - the marketplace stage: a missing entry, an extra entry, a mismatched name, a version in an
    entry, a `plugin.json` missing a field, a changelog that does not name the version, and a
    tracked file under `.claude-plugin/types/`;
  - the import scan: a relative import that leaves the folder, one that stays inside, a bare
    import of `claude-code-tools` (passes), and a bare import of an unknown module (fails);
  - `tooling-tests` collects nothing under `tests/fixtures/`, even where a fixture holds a
    `*.test.ts`;
  - `verify -- <mod>` scoping: a mod's stages run only for the mod named.
- Each stage falsified once, failing at its own step and nowhere else:
  - a misformatted line, and a lint error;
  - a type error in the tooling, and one in the template;
  - a failing tooling test, and a failing template test;
  - a `validate` error in the template;
  - a private term, using a throwaway word and its hash;
  - a bad marketplace entry;
  - an import that leaves the template's folder.

  Each new test falsified once.

**Watch for:**
- **The CLI and the desktop engine are different builds** (2.1.296 and 2.1.308 at intake).
  `validate` and `test` run the CLI on PATH. Record its version in the done-note.
- **`node --test` with no arguments finds every `*.test.ts` in the tree.** That includes the mods',
  the template's and any fixture mod's, which import `claude-code/testing` and fail in Node.
  - Give it the top level of `tests/` only (a pattern like `tests/*.test.ts`, never
    `tests/**`).
  - The mods' tests run under `claude plugin test`, in the engine's environment, not in Node.
- **Node strips types, and only erasable syntax survives.** No enums, namespaces or parameter
  properties. Relative imports name their `.ts` extension.
- **A mod's `tsconfig.json` extends `./.claude-plugin/types/tsconfig.json`,** which the engine
  writes and a fresh clone lacks.
- **Hygiene must not flag itself.** Assemble its attribution patterns from pieces, as krita does,
  and keep the hashes in one data file.
- **A mod's sources use JSX compiled against the global `h`.** Configure Biome's JSX handling for
  that, not React's.
- **Loading the plugin-authoring skill starts the engine's watch on this session's mods folder**
  (`~/.claude/dev-mods/<session id>/`). The first file written there asks the owner whether to turn
  on hot-reloaded mods. Write nothing there.
- **The owner's setup is live** (invariant 7). cartoon-fx runs in every session from
  `~/.claude/mods/cartoon-fx`; read it, never change it.
- **If `validate` warns about something a mod cannot fix,** stop and ask before loosening the stage
  to warnings.
- **Don't add a dependency before it is used.**

---

## 2: Import cartoon-fx

**Read:** `SPEC.md` §2 (decisions 8–10, 12–14), §4, §5, §6, §8; `CLAUDE.md`;
`templates/mod-template/`.

- **The copy** (decision 13).
  - Copy `~/.claude/mods/cartoon-fx/` into `mods/cartoon-fx/` byte for byte. At intake it held
    eight files:
    - `.claude-plugin/plugin.json`;
    - `hooks/hooks.json`, `hooks/register.tsx`, `hooks/detect.ts` and `hooks/fx.ts`;
    - `types/index.d.ts`;
    - `tests/cartoon-fx.test.tsx`;
    - `tsconfig.json`.

    Leave out `.claude-plugin/types/` if it has appeared.
  - Run the hygiene stage over the copy before anything else reads it.
  - Compare with `diff -r` after the copy. The source folder stays untouched.
- **`plugin.json`** (decision 12). Add `author` and `license`, and nothing else; the version stays
  `0.10.1`. `validate`'s warnings go from one to none.
- **The shared files** (decision 10): cartoon-fx's entry in `.claude-plugin/marketplace.json`, and
  its row in the root `README.md`. If Session 1 could not commit an empty marketplace, this session
  writes the file, with this entry as its first.
- **The mod's workflow files,** from the template.
  - **`mods/cartoon-fx/CLAUDE.md`:**
    - what the mod is;
    - its machine identifiers: `cartoon-fx`, `/fx`, its `$.state` keys, and its `$.store` keys;
    - its commands (`npm run verify -- cartoon-fx`);
    - its read order.
  - **`CHANGELOG.md`.** One `[0.10.1]` entry, with the lead paragraph decision 13 describes. Under
    *Added* it lists what the mod does at 0.10.1, written for the person using it.
    - Its link reference points at this session's import commit, the first that holds the
      manifest at 0.10.1 (decision 8).
    - The import commit is not final until committed, so the review commit adds the link. Without
      a review commit, the next commit adds it.
  - **`README.md`:** what it does, the install lines, and `/fx`.
  - **`docs/BACKLOG.md`**, and **`docs/next-session-prompt.md`** from the between-rounds template.
    The handoff says no round is in progress, and that the next cartoon-fx session is the round 2
    intake.
  - `ARCHITECTURE.md` and `USER-GUIDE.md` are Session 3's.
- **The gate.** `npm run verify -- cartoon-fx` is green, using Session 1's way of providing the API
  declarations.
- **Docs.**
  - The root README: its table of mods.
  - cartoon-fx's files, above.
- **Ask at the start of 2:**
  - **Formatting.** Would Biome change any line of the copied code? Show the owner the diff.
    Changing the config is preferred over reformatting the mod.
  - **Type errors.** Does `tsc` report any errors in cartoon-fx? A fix changes the mod's code and
    would be a 0.10.2 release, so it is the owner's call.

**Gates:**
- `npm run verify` green:
  - cartoon-fx's `validate` passes with no warnings, and its hook list matches the one recorded at
    intake;
  - 28 tests pass in one file, unmoved;
  - `tsc` is clean.
- `diff -r` against `~/.claude/mods/cartoon-fx` shows only the two new `plugin.json` fields, plus
  the new files.
- The marketplace stage falsified against the real entry, once: remove the entry, watch the stage
  fail, and restore it.

**Watch for:**
- **cartoon-fx is running in the owner's sessions** from `~/.claude/mods/cartoon-fx`, through
  `CLAUDE_CODE_PLUGIN_DIRS`. Leave both alone; Session 3 switches it over.
- **Byte for byte means no "while I'm here" fixes.** Whatever the session notices goes to
  cartoon-fx's `docs/BACKLOG.md`.
- **Don't load the repo copy beside the live one.** No `--plugin-dir` session on `mods/cartoon-fx`
  while the live copy runs under the same name. This session needs no live run.
- **Session 3 installs from GitHub,** so it needs this session's work pushed. Ask for the push
  approval at the end, after the review. If the owner declines, the handoff says so, and names the
  choice Session 3 then starts with.

---

## 3: cartoon-fx as an installed release, and its as-built docs

**Read:** `SPEC.md` §2 (decisions 11, 13, 14), §6 (invariant 7), §7, §8;
`mods/cartoon-fx/CLAUDE.md`; cartoon-fx's sources.

- **The switch to the installed release** (decision 11). The owner is at the keyboard, and every
  step that changes their setup waits for their OK.
  1. **Record what the owner has now,** before anything changes. The owner runs `/fx commit` in a
     current session. The done-note keeps two things:
     - the take number its row shows (`(take N)`, from `$.store` key `fxTakes`);
     - where it played: in the conversation, or in the strip above the prompt (the stored
       `placement`).
  2. **Measure how `$.store` values are keyed,** from the declarations: by the plugin's name, or by
     its id, which differs between a folder copy and `cartoon-fx@claude-code-mods`. If they are
     keyed by id, stop and ask the owner before installing: the stored values would not carry
     over, and decision 14 needs an amendment.
  3. `gh auth status`. A private repository installs only where git holds a credential for
     github.com; whether to run `gh auth setup-git` is the owner's call.
  4. The owner installs cartoon-fx at user scope:
     `claude plugin install cartoon-fx --marketplace FairCat-GD/claude-code-mods`.
  5. **Remove the old entry.** With the owner's OK, remove the `CLAUDE_CODE_PLUGIN_DIRS` entry
     that names `~/.claude/mods/cartoon-fx` from `~/.claude/settings.json`, so that one copy loads.
     - Show the exact edit first, and keep the removed line in the done-note, so it can be put
       back.
     - Steps 4 and 5 run back to back, before any new session starts, so that no session loads two
       copies.
  6. **Checked by hand.** The owner starts a new session, in the desktop app and in a terminal,
     and runs `/fx all`. Each outcome goes in the done-note:
     - every effect plays;
     - it plays where step 1's did, and its take number follows step 1's.

     If the stored values did not carry over, stop. The owner chooses: set the placement again with
     `/fx place`, or put the removed line back and uninstall.
  7. **Measure what the installed copy holds.** List the install path that `claude plugin list`
     shows, and record which of the mod's files it holds. Correct SPEC §4's "How a mod reaches the
     owner" by amendment if it differs.
  8. **Measure the unpushed-build path** of decision 11. What does a
     `claude --plugin-dir mods/cartoon-fx` terminal session do beside the installed copy: load
     both, replace it, or refuse? Record the answer in the root `CLAUDE.md`, in cartoon-fx's
     `CLAUDE.md` and in the done-note.
  9. `~/.claude/mods/cartoon-fx` stays. The done-note says the owner may remove it.
- **The as-built docs.**
  - **`mods/cartoon-fx/docs/ARCHITECTURE.md`**, from the template:
    - the overview, and each hook and what it reacts to;
    - the detection rules, the drawings, and placement with its fallback to the strip;
    - its `$.state` and `$.store` values;
    - its invariants, and its testing strategy with what the kit cannot see;
    - deliberate decisions and known debt;
    - a baseline table: tests, plus `validate`'s counts of hooks, gating hooks and state keys.
  - **`mods/cartoon-fx/docs/USER-GUIDE.md`:**
    - what plays when;
    - `/fx` and its arguments;
    - placement;
    - how the terminal and the desktop app differ.
  - **`mods/cartoon-fx/docs/BACKLOG.md`:** the note's ideas under *Directions*, its debt under
    *Deferred*, and what nobody checked under *Not yet checked by hand*.
  - The mod's `CLAUDE.md` gets the ARCHITECTURE read paragraph, and the README stays true.
- **No code changes, and no version.** cartoon-fx stays at 0.10.1.
- **Ask at the start of 3:**
  - **The note.** The owner pastes the note from cartoon-fx's original chat. Without one, the docs
    come from the code alone, and the done-note says so.
  - **If Session 2's work is not on `origin/main`,** the switch cannot run. The owner chooses: push
    now, or run the docs half alone and move the switch to a session inserted after it. Either way
    the choice is logged as an amendment.

**Gates:**
- `npm run verify` green, with cartoon-fx's counts unmoved.
- The hand checks of step 6, recorded, against the values recorded in step 1.

**Watch for:**
- **`~/.claude/settings.json` belongs to the owner.** Change only the one entry, and only after
  showing the edit.
- **Plugins load when a session starts.** Checking the installed copy takes a new session; this
  chat keeps whatever it started with.
- **The install never prompts for a credential.** A private repository with no git credential
  fails with a missing-marketplace message.
- **Don't copy the note's private details.** It may name people, chats or the owner's projects.
  The docs keep the reasons and drop the names.
- **Docs describe the code as it is.** Where the note and the code disagree, the code wins, and the
  done-note records the difference.

---

## 4: The repo's documentation pass; close the round

**Read:** `SPEC.md` in full; `CLAUDE.md`; every done-note in this file;
`mods/cartoon-fx/docs/ARCHITECTURE.md`.

- **`docs/ARCHITECTURE.md`**, from the template:
  - the overview, the two levels and who edits what;
  - the invariants, and how each is enforced;
  - the gate's stages, hygiene, the marketplace, the import scan and the template;
  - how the API declarations are provided;
  - the testing strategy and what each layer cannot see;
  - distribution: install, update, and the unpushed-build path;
  - deliberate decisions and known debt;
  - a baseline table: stages, tooling tests, the template's counts, and each mod's counts.
- **`docs/USER-GUIDE.md`**, for the owner:
  - installing, updating and trying out a mod;
  - starting a new mod, from copying the template to opening its intake;
  - running parallel sessions in one checkout.
- **`docs/MOD-KICKOFF.md`.** The workflow kit's `KICKOFF.md`, adapted to a mod in this repository:
  - the mod's files live under `mods/<name>/`;
  - its Session 1 starts from the template;
  - this repository's rules and SPEC §8's practices bind it;
  - the PDD is optional (decision 2);
  - its commits are scoped and its tags namespaced.
- **`README.md`** made truthful: what the repository is, its mods, installing, developing, and the
  docs.
- **`CLAUDE.md`.** The "Read `docs/spec/SPEC.md`" paragraph is replaced by the ARCHITECTURE one,
  and anything in SPEC §8 a session needs every time moves into the rules. The template's
  `CLAUDE.md` gets the same change.
- **`docs/BACKLOG.md`:** everything still open in round 1.
- **The close.** The session's commit carries the last done-note. Then a separate
  `docs: close round 1` commit deletes `docs/spec/` and rewrites the handoff from the between-rounds
  template: no round is in progress, and the next repo-level session is an intake.

**Gates:**
- `npm run verify` green, with every count matching the new baseline table.
- Every path and command the new docs name is checked to exist or to run.

**Watch for:**
- **The baseline is measured, not copied** from the done-notes.
- **The repo-level docs never describe a mod's internals.** They point at the mod's own
  `ARCHITECTURE.md`.
- **The review follows the close,** as the workflow says. `SESSIONS.md` is gone by then, so the
  review's findings go in the review commit's message and in the handoff.
