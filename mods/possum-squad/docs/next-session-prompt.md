Read what Session 1's **Read** line in mods/possum-squad/docs/spec/SESSIONS.md names, the root
CLAUDE.md, then mods/possum-squad/CLAUDE.md, *The session cycle* in docs/DEVELOPMENT-WORKFLOW.md,
mods/possum-squad/docs/ARCHITECTURE.md's overview, invariants and baseline, the header of
mods/possum-squad/docs/spec/SESSIONS.md and Session 1's block, then this file, and do
Session 1: the skeleton. 1 covers:
- `/possums` toggling the pane `possum-squad`, with the empty panel, on both surfaces;
- `types/index.d.ts` with `view`, and the pass-through hooks Session 2's spike reads;
- the README, the 0.1.0 changelog entry and the baseline.

Release 0.1.0.

## State you need that is not in the specs

- **Round 1 is the agents panel:** Session 0 (the intake) is done; Sessions 1–13 remain.
- **Nothing of this mod is pushed.** The intake's commit is local; `origin/main` holds
  everything through the repository's round 1 close.
- **What the intake left that Session 1 builds on:**
  - `mods/possum-squad/` is the template renamed at 0.1.0: `hooks/register.ts` with `/hello`, its
    one test, and the made workflow files, now filled in. The marketplace entry and the README
    row exist.
  - The declarations are laid from CLI 2.1.326; the intake read 2.1.325's and 2.1.326's, and
    every engine fact in `SPEC.md` decision 12 held in both.
- **Decisions written down nowhere else:**
  - The owner took the words for the mod's animal off the hygiene term list at this intake, so
    the name and the docs pass hygiene; the rescan found nothing else.
  - The PNG layers in `docs/spec/research/art/` hold pixel data only (no text chunks), checked
    at intake, since hygiene cannot read binaries.
- **The repo-level round for `tools/`** (`SPEC.md` decision 9) is the owner's to open, in its
  own chat, before Session 6. It must let the import scan pass Node imports under a mod's
  `tools/`, keep `hooks/` and `tests/` from importing it, and say how the converter is checked.
- **Baseline:** the made mod's, the template's row in the root `docs/ARCHITECTURE.md`: 1 test,
  2 hooks, 0 gating, `$.command.register`. Session 1 writes the mod's own table.

## Watch for

- **0.1.0 installed runs its hooks in every session the owner starts.** Each pass-through
  returns exactly what `next` gave, and `turn.step` yields every chunk unchanged.
- **The desktop app shows nothing of 0.1.0 until it is pushed and installed;** the terminal
  check is `claude --plugin-dir mods/possum-squad`, run by the owner.
