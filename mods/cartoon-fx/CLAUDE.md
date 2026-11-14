# cartoon-fx

cartoon-fx plays a short cartoon animation when something worth marking happens in a session: an
accepted plan, a commit, a push, a passing test run, a finished code review and its fixes, a
compaction, subagents starting, and the context window reaching its yellow and red zones. The
desktop app draws each one as SVG under the conversation row that set it off, or in the strip
above the prompt; the terminal draws a row of coloured glyphs in that strip. `/fx` replays them.

The root `CLAUDE.md` holds the rules every mod follows, and the root's `docs/spec/SPEC.md` §8 the
practices. This file adds only what is this mod's own.

**Read `docs/ARCHITECTURE.md` before changing code.** It is the mod as built: its hooks, detection,
drawings, placement, values, invariants, deliberate decisions, known debt and baseline.
`docs/USER-GUIDE.md` is its behaviour from the user's side.

## Machine identifiers

These keep their spelling, because installs and stored data live under them:
- the mod's name, `cartoon-fx`: its folder, its `plugin.json` `name` and its install id,
  `cartoon-fx@claude-code-mods`;
- its slash command, `/fx`;
- its `$.state` keys, declared in `types/index.d.ts` under `PluginState['cartoon-fx']`: `shown`,
  `isYellow`, `isRed` and `placement`;
- its `$.store` keys, `placement` and `fxTakes`. They hold the owner's data, across sessions:
  where effects play, and the number of the last `/fx` take. They live under the plugin id
  (`docs/ARCHITECTURE.md`, *Values*), so a new name or marketplace starts with none.

## Trying an unpushed build

The owner runs the installed release, `cartoon-fx@claude-code-mods`. A terminal session started
with `claude --plugin-dir mods/cartoon-fx` from the repository's root replaces it for that session,
as `cartoon-fx@inline` with its own store (`docs/ARCHITECTURE.md`, *Packaging*).

## Read order

A session on this mod reads in the order the root `CLAUDE.md` gives a mod session. Where the
handoff's first line names another order, the root's wins, and the next rewrite copies it.

## Commands

| Command | Does |
|---|---|
| `npm run verify -- cartoon-fx` | The repo stages, then this mod's: `validate`, `types`, `tests` and `imports`. Run from the repository's root. |
| `npm run types` | Lays the API declarations `tsc` types this mod against; after a clone or a CLI update. Its session runs this mod's `session.start` as `cartoon-fx@inline`, which reads that copy's stored `placement`, not the release's; type only `/exit` there. |

## Watch for

This mod's own standing traps, a line or two each; the root `CLAUDE.md`'s hold for every mod. A
handoff carries only its session's own.

- **Biome formats every file in this folder,** and there is no folder `biome.json`: run
  `npx biome format --write mods/cartoon-fx` before the gate.
- **`placement` and `fxTakes` are the owner's data** in `$.store` (`docs/ARCHITECTURE.md`,
  *Values*). Read them forward-only, and never drop one without a changelog line.
- **A new `$.state` or `$.store` key is a machine identifier,** named once, with the owner.
- **The owner's update path is `claude plugin update cartoon-fx`,** which installs only a new
  `plugin.json` version: every change meant for the owner cuts one.
- **Effects take turns** (`docs/ARCHITECTURE.md`, *Playing and placement*). A test that plays two
  effects without moving the pinned clock a turn (`slot`) reads the first while the second waits.
- **A live terminal check reads the strip between effects.** Each lasts about three seconds and
  `read_terminal` returns on the first change, so read in a quick series, and run again for one
  that played between reads.
