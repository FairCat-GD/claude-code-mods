# Backlog

Work that has been named but belongs to no session. Each item needs its own intake before it runs
(a `docs/spec/FEATURE-*.md` with the request verbatim and the decisions resolved, then a block
in `docs/spec/SESSIONS.md`; see the root `docs/DEVELOPMENT-WORKFLOW.md`). When an item is picked
up, it moves out of this file.

## Deferred

- **Reformat the code with Biome, and delete this folder's `biome.json`.** Left out at the
  import, which copied the code byte for byte. At width 160, Biome changes 139 lines in
  `detect.ts`, `fx.ts`, `register.tsx` and the test file, the four files whose formatting the
  folder's `biome.json` turns off. Lint wants the five
  `.catch(($, e, next) => next(e))` handlers to name their unused `$` as `_$`. Nobody using the
  mod sees either change, so it cuts no version.

## Not yet checked by hand

Checks that need a person at the machine. Each has an automated check covering most of it;
these are the parts only a person can see.

## Directions

## Decided against
