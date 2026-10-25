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

A session on this mod reads:
1. the spec file(s) its block names, in `docs/spec/`;
2. the root `CLAUDE.md`;
3. this file;
4. `docs/ARCHITECTURE.md`;
5. `docs/next-session-prompt.md`.

## Commands

| Command | Does |
|---|---|
| `npm run verify -- cartoon-fx` | The repo stages, then this mod's: `validate`, `types`, `tests` and `imports`. Run from the repository's root. |
| `npm run types` | Lays the API declarations `tsc` types this mod against; after a clone or a CLI update. Its session runs this mod's `session.start` as `cartoon-fx@inline`, which reads that copy's stored `placement`, not the release's; type only `/exit` there. |
