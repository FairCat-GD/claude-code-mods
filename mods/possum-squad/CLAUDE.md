# possum-squad

A side pane that lists the main session and every subagent with live numbers and state, each
drawn on the desktop app as a small animated pixel opossum dressed for its role. It only
watches: it changes no event, registers no tool and adds nothing to any request.

Every mod starts as the repository's template, made into its own by
`npm run new-mod -- <name> "<description>"` from the repository's root. The root `CLAUDE.md`
holds the rules and practices every mod follows; this file adds only what is this mod's own.

**Read `docs/ARCHITECTURE.md`'s overview, invariants and baseline, and the sections your block
names, before changing code.** It keeps what is **Decided**, which changes only with the owner,
apart from what is **Built**, which every session keeps true. `docs/USER-GUIDE.md` is the mod's
behaviour from the user's side.

## Machine identifiers

These keep their spelling, because installs and stored data live under them:
- the mod's name, `possum-squad`: its folder, its `plugin.json` `name` and its install id,
  `possum-squad@claude-code-mods`;
- its slash command, `/possums`, with the words `open`, `set`, `settings` (built) and `roles`
  (to come); its pane id, `possum-squad`;
- its settings and their values, its set ids, role ids and state ids (`docs/ARCHITECTURE.md`,
  *Values*);
- its `$.state` keys, `runs`, `lead`, `view`, declared in `types/index.d.ts` as each is built
  (`view` so far, under the shape tag `view-1`, which changes with its fields);
  its `$.store` keys, `prefs` (built) and `role:<agent type>`;
- reserved for a later round: the tools `step` and `plan`, the setting `stepReports`, the state
  key `planned`.

## Trying an unpushed build

`claude --plugin-dir mods/possum-squad` in a terminal, from the repository's root. It runs as
`possum-squad@inline`, with its own stored values, and shows the terminal's text rows only: the
desktop app runs the installed release, so sprites are seen only after a push.

## Read order

A session on this mod reads in the order the root `CLAUDE.md` gives a mod session; its handoff's
first line copies it.

## Commands

| Command | Does |
|---|---|
| `npm run verify -- possum-squad` | The repo stages, then this mod's: `validate`, `types`, `tests` and `imports`. Run from the repository's root. |
| `npm run types` | Lays the API declarations `tsc` types this mod against; after a clone or a CLI update. |

## Watch for

- **The installed release runs in every session the owner starts,** these included. A hook that
  changes an event, or throws into `turn.step`'s stream, breaks the owner's work, not just the
  panel. Disabling the plugin is the kill switch, and it is the owner's to do.
- **Hooking `tool.call` or `tool.run` changes how tools run,** even as a pass-through: it turns
  off a tool's move to the background and its live output. Hook neither without the owner's
  OK; a test fails if either comes back.
- **A test plugin closes over nothing of its test file.** To draw the module's builders in a
  test, use the test's own `ui.render` hook, matched with `{ plugin: '*' }`.
- **The engine loads no JSON.** The role corpus is a `.ts` fixture; the art reaches the hooks only
  through the generated `hooks/sprites/data.ts`.
- **`docs/spec/research/` is input** for round 1: copy from it, never edit it. Its corpus labels
  are fixed, and the role table is never tuned on `holdout`.
