# claude-code-mods

The owner's Claude Code mods: plugins that change Claude Code's own interface or behaviour through
its function-hooks API. Each mod is an independent plugin in `mods/<name>/`, with its own tests,
docs and versions. The repository is also the plugin marketplace the mods install from, and its
tooling holds every mod to the same rules.

## Mods

| Mod | What it does |
|---|---|
| [cartoon-fx](mods/cartoon-fx/) | Cartoon animations for accepted plans, commits, cherry-picks, pushes, merges, passing tests, code reviews and their fixes, compaction, subagents, and a context window filling up; `/fx` replays them. |

## Installing a mod

```bash
claude plugin install <mod> --marketplace FairCat-GD/claude-code-mods
```

In the desktop app: + beside the prompt, then Plugins, then Add marketplace. Updating, and trying
an unpushed build, are in `docs/USER-GUIDE.md`.

## Developing

Node 26 and Claude Code's CLI (`claude`) are the only prerequisites.

```bash
npm ci
```

```bash
npm run types
```

`npm run types` starts an interactive Claude Code session that loads every mod and the template,
so the engine lays the plugin API's declarations beside each one for `tsc`. Type `/exit` once its
prompt shows. Run it again after a Claude Code update or a new mod; `verify` says when.

```bash
npm run verify
```

`verify` is the gate: format, lint, types and the tooling's tests, the marketplace and hygiene
checks, then `claude plugin validate`, `tsc`, `claude plugin test` and the import scan for each mod
and the template. `npm run verify -- <name> ...` runs only the stages or mods it names. Every
command is in `CLAUDE.md`'s Commands table.

```bash
npm run new-mod -- <name> "<description>"
```

`new-mod` makes a mod from the template and adds its marketplace entry; it prints what is left.
Starting a mod, from choosing its name to its intake, is in `docs/USER-GUIDE.md`.

## Layout

```
.claude-plugin/marketplace.json   the marketplace: one entry per mod (from the first mod on)
mods/<name>/                      one mod: the whole plugin, and its own workflow files
templates/mod-template/           where a new mod starts; checked by the gate like a mod
scripts/                          verify, hygiene, the marketplace check, the import scan, types,
                                  validate, new-mod, and repo (what they share)
tests/                            the tooling's tests; tests/fixtures/ is fictional
docs/                             the repository's own workflow files
```

## Docs

- `CLAUDE.md`: the rules every session follows, the practices every mod follows, the commands and
  the standing traps.
- `docs/ARCHITECTURE.md`: how the repository is built, its invariants and its baseline.
- `docs/USER-GUIDE.md`: using a mod, working in the repository, and starting a new mod.
- `docs/MOD-KICKOFF.md`: the guide for a new mod's intake.
- `docs/DEVELOPMENT-WORKFLOW.md`: the session-based workflow, at the repository's level and at each
  mod's.
- `docs/spec/`: the round in progress, when there is one. `docs/BACKLOG.md`: what is named but not
  planned.
- Each mod's `README.md`, `CHANGELOG.md` and `docs/`.

## License

MIT, in `LICENSE`.
