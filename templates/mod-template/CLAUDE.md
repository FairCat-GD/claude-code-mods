# mod-template

<What this mod does, in two sentences, for a session that has never seen it.>

Every mod starts as the repository's template, made into its own by
`npm run new-mod -- <name> "<description>"` from the repository's root. The root `CLAUDE.md`
holds the rules every mod follows, and `docs/spec/SPEC.md` §8 the practices. This file adds only
what is this mod's own.

## Machine identifiers

These keep their spelling, because installs and stored data live under them:
- the mod's name, `mod-template`: its folder, its `plugin.json` `name` and its install id,
  `mod-template@claude-code-mods`;
- its slash command, `/hello`;
- <its `$.state` keys and its `$.store` keys, once it has any>.

## Read order

A session on this mod reads in the order the root `CLAUDE.md` gives a mod session; its handoff's
first line copies it.

## Commands

| Command | Does |
|---|---|
| `npm run verify -- mod-template` | The repo stages, then this mod's: `validate`, `types`, `tests` and `imports`. Run from the repository's root. |
| `npm run types` | Lays the API declarations `tsc` types this mod against; after a clone or a CLI update. |

## Watch for

<This mod's standing traps, once it has any, a line or two each: the trap, then what to do
instead. The root `CLAUDE.md`'s hold for every mod.>
