# Fixtures

The tooling's tests read only what is here. Everything in this folder is fictional: no real
person, project or content. Tests never read `docs/`, so a document can always be changed or
deleted without breaking one.

- `well-formed/`: a repository root whose marketplace agrees with its one mod, `alpha`. Its mod
  carries a test file of its own, which `node --test` never collects.
- `disagreeing/`: a marketplace listing `alpha` and `beta` beside folders `alpha` and `gamma`.
- `leaky-mod/`: a mod importing from outside its folder, and a module no declaration declares.
- `hygiene-terms.txt`: the hygiene tests' term list, two made-up words, one in Latin letters and
  one in Cyrillic. The tests never read the owner's own list.
- `declarations/`: stand-ins for the API declarations the engine lays in a mod's
  `.claude-plugin/types/`, which git ignores at every depth.
