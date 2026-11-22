# FEATURE: tools (round 2)

## The request, verbatim (2026-11-22)

> The gate must take a mod's `tools/` folder: Node scripts run by hand, never loaded by the
> engine. The import scan should allow `node:` imports there and refuse any import of
> `tools/` from `hooks/` or `tests/`; `tools/` should be type-checked against Node's types;
> and the round should say how a tool's own behaviour is tested. possum-squad's sprite
> converter is the first user.

The request came from possum-squad's round 1, whose Session 6 needs a sprite converter in its
`tools/` and found the gate could not take one. The intake asked five questions, and the owner
took the recommended answer to each:
- `tools/` is typed with the tooling's own compiler options;
- a tool's behaviour is tested by Node tests named `*.spec.ts`;
- the import scan walls `tools/` off both ways;
- the template gets no `tools/`;
- a tool's spec may read its own mod's source and committed output, read-only.

Those answers are about how the repository is built, so they are in `docs/ARCHITECTURE.md`
(decision 3). Before approval the plan had one adversarial review, on the owner's word, and its
eleven findings were folded in.

## Resolved decisions (2026-11-22, at intake)

An answer about how the system is built is not here: it is in `docs/ARCHITECTURE.md`, in the
section it belongs to.

1. **One session, G1, builds the round and closes it.** The repo level cuts no version. The work
   is one vertical slice through the gate and its docs: the import scan, the type check and the
   tests for `tools/`.
2. **The round touches no mod.**
   - possum-squad's converter is the first user. Its Session 6 runs after this round's close,
     not after this intake's commit: until G1 lands, the gate still refuses `tools/`. The
     handoffs and the openers say so.
   - The rows of possum-squad's `docs/ARCHITECTURE.md` that wait on this round are its own
     sessions' to update.
3. **How it is built** is decided in `docs/ARCHITECTURE.md`, each with a *Decision log* line
   dated 2026-11-22:
   - invariants 2 and 6;
   - *Stack and pins*, *Layout and boundaries*, *What a mod is* and *The gate*;
   - *`validate` and the import scan*, *The template and `new-mod`*, *Packaging* and *Testing
     strategy*.
4. **Out of this round:** nothing was declined.
