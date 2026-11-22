# Fixtures

The tooling's tests read only what is here. Everything in this folder is fictional: no real
person, project or content. Tests never read `docs/`, so a document can always be changed or
deleted without breaking one.

- `well-formed/`: a repository root whose marketplace agrees with its one mod, `alpha`. Its mod
  carries a test file of its own, which `node --test` never collects.
- `disagreeing/`: a marketplace listing `alpha` and `beta` beside folders `alpha` and `gamma`.
- `leaky-mod/`: a mod importing from outside its folder, and a module no declaration declares.
- `tooled-mod/`: a mod with a tool and its spec, which reads `tools/fixtures/words.json`. Its
  `tools/fixtures/never.spec.ts` has a type error and a failing test, so it shows if the type
  check or the spec run reads `tools/fixtures/`.
- `walled-mod/`: every breach of the wall around `tools/`: its hooks, a test and its `types/`
  importing the tool; the hooks importing `node:fs`; the tool importing `hooks/` and `left-pad`,
  under a `/// <reference types>`; and a `.mjs` source.
- `mistyped-mod/`: a tool with a type error.
- `failing-spec-mod/`: a tool whose spec fails.
- `unspecced-mod/`: a tool with no spec.
- `declarations-only-mod/`: a `tools/` holding only a `.d.ts`.
- `hygiene-terms.txt`: the hygiene tests' term list, two made-up words, one in Latin letters and
  one in Cyrillic. The tests never read the owner's own list.
- `declarations/`: stand-ins for the API declarations the engine lays in a mod's
  `.claude-plugin/types/`, which git ignores at every depth.

The tools' fixtures are here, under the repository's `package.json`, so the tools' type check
reads them as ES modules, as it reads a mod's. A temporary folder would be CommonJS to it.
