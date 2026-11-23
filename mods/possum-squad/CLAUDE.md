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
- its slash command, `/possums`, with the words `open`, `set`, `settings` and `roles`; its pane
  id, `possum-squad`;
- its settings and their values, its set ids, role ids and state ids (`docs/ARCHITECTURE.md`,
  *Values*);
- its `$.state` keys, `runs`, `lead`, `view`, declared in `types/index.d.ts` (`view` under the
  shape tag `view-2`, `runs` under `runs-4` and `lead` under `lead-1`, each changing with its
  fields);
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
| `node mods/possum-squad/tools/art.ts` | The converter: reads `art/` and writes `hooks/sprites/data.ts`. Run it after any change to `art/`, from anywhere; its spec fails while the committed `data.ts` differs from what `art/` converts to. |
| `node --test "mods/possum-squad/tools/*.spec.ts"` | The converter's and the PNG reader's specs alone; `verify`'s `tests` runs them too. |

## Watch for

- **The installed release runs in every session the owner starts,** these included. A hook that
  changes an event, or throws into `turn.step`'s stream, breaks the owner's work, not just the
  panel. Disabling the plugin is the kill switch, and it is the owner's to do.
- **Hooking `tool.call` or `tool.run` changes how tools run,** the declarations say, even as a
  pass-through: a tool's move to the background, a served call's live output. A Bash command
  still moved to the background with one hooked (CLI 2.1.329), but the other cases were not
  seen. Hook neither without the owner's OK; a test fails if either comes back. A call's start
  comes from its step's `toolUses`.
- **A subagent's `turn.start` comes before its spawn's result** (2.1.329), so its first events
  wait as a pending entry until the re-key. Keep that path, not the rare one.
- **A test plugin closes over nothing of its test file.** To draw the module's builders in a
  test, use the test's own `ui.render` hook, matched with `{ plugin: '*' }`.
- **A state write's redraw lands at the redraw rate, on the kit's mocked clock.** Move the clock
  a little (`advance(100)`) before reading or unmounting a drawing a write changed; an
  invalidation's redraw needs no move. State versions are numbered across the test file, so a
  test checks a write as a version above 0, never as 1.
- **The engine loads no JSON.** The role corpus is a `.ts` fixture; the art reaches the hooks only
  through the generated `hooks/sprites/data.ts`, which is never edited by hand: change `art/`
  and run the converter.
- **The kit's terminal answers `Svg` with an empty `Box`,** so a test looking for `Svg` there
  finds none even when one is drawn. Count the empty `Box`es too, as `pane-sprites.test.ts`
  does.
- **A subagent may not `sleep` in the foreground:** it moves the sleep to the background and
  ends its turn, which reads as its end. For a long call in a hand check, use
  `ping -c <seconds> 127.0.0.1`, which stays in the foreground (CLI 2.1.330).
- **A hand check can be driven without the user:** start `screen -U -dmS <name> claude
  --plugin-dir mods/possum-squad` from the repository's root (GNU `screen` 4.0.3; tmux is not
  installed), attach it in a Terminal-panel tab with `screen -U -r <name>`, type with
  `screen -S <name> -X stuff`, and read the tab. The tab's width docks the pane. Detached alone,
  `-X hardcopy` came back empty or stale after a `width` command (CLI 2.1.330), and without
  `-U` the drawing is garbled. `/exit` ends it; check no `claude --plugin-dir` is left.
- **`docs/spec/research/` is input** for round 1: copy from it, never edit it. Its corpus labels
  are fixed, and the role table is never tuned on `holdout`.
