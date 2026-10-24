# cartoon-fx

cartoon-fx plays a short cartoon animation when something worth marking happens in a session: an
accepted plan, a commit, a push, a passing test run, a finished code review and its fixes, a
compaction, subagents starting, and the context window reaching its yellow and red zones. The
desktop app draws each one as SVG under the conversation row that set it off, or in the strip
above the prompt; the terminal draws a row of coloured glyphs in that strip. `/fx` replays them.

The root `CLAUDE.md` holds the rules every mod follows, and the root's `docs/spec/SPEC.md` §8 the
practices. This file adds only what is this mod's own.

## Machine identifiers

These keep their spelling, because installs and stored data live under them:
- the mod's name, `cartoon-fx`: its folder, its `plugin.json` `name` and its install id,
  `cartoon-fx@claude-code-mods`;
- its slash command, `/fx`;
- its `$.state` keys, declared in `types/index.d.ts` under `PluginState['cartoon-fx']`: `shown`,
  `isYellow`, `isRed` and `placement`;
- its `$.store` keys, `placement` and `fxTakes`. They hold the owner's data, across sessions:
  where effects play, and the number of the last `/fx` take.

## Its own Biome settings

`biome.json` in this folder turns off the formatter and `noUnusedFunctionParameters` here alone,
and extends the root's for everything else. The code came into the repository byte for byte, and
Biome's format and its `($, e, next)` catch handlers disagreed with it. Reformatting it and
deleting this file is in `docs/BACKLOG.md`. Until then, `npx biome format mods/cartoon-fx` on
its own reports that no files were processed; `verify` passes it with the tooling's paths.

## Read order

A session on this mod reads:
1. the spec file(s) its block names, in `docs/spec/`;
2. the root `CLAUDE.md`;
3. this file;
4. `docs/ARCHITECTURE.md`, once it exists;
5. `docs/next-session-prompt.md`.

## Commands

| Command | Does |
|---|---|
| `npm run verify -- cartoon-fx` | The repo stages, then this mod's: `validate`, `types`, `tests` and `imports`. Run from the repository's root. |
| `npm run types` | Lays the API declarations `tsc` types this mod against; after a clone or a CLI update. Its session runs this mod's `session.start`, which reads the stored `placement`; type only `/exit` there. |
