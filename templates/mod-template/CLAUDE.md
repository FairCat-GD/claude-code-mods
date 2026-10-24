# mod-template

<What this mod does, in two sentences, for a session that has never seen it.>

This is where a new mod starts. Copy this folder to `mods/<name>/`, then rename `mod-template`
to `<name>` everywhere in it: the folder, `plugin.json`'s `name`, this file, the README and the
changelog. The root `CLAUDE.md` holds the rules every mod follows, and `docs/spec/SPEC.md` §8
the practices. This file adds only what is this mod's own.

## Machine identifiers

These keep their spelling, because installs and stored data live under them:
- the mod's name, `mod-template`: its folder, its `plugin.json` `name` and its install id,
  `mod-template@claude-code-mods`;
- its slash command, `/hello`;
- <its `$.state` keys and its `$.store` keys, once it has any>.

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
| `npm run verify -- mod-template` | The repo stages, then this mod's: `validate`, `types`, `tests` and `imports`. Run from the repository's root. |
| `npm run types` | Lays the API declarations `tsc` types this mod against; after a clone or a CLI update. |
