# Backlog

Work that has been named but belongs to no session. Each item needs its own intake before it runs
(a `docs/spec/FEATURE-*.md` with the request verbatim and the decisions resolved, then a block
in `docs/spec/SESSIONS.md`; see `docs/DEVELOPMENT-WORKFLOW.md`). When an item is picked up, it
moves out of this file.

This is the repo level's backlog. Each mod keeps its own in `mods/<name>/docs/BACKLOG.md`, and work
on a mod goes there.

## Deferred

- **New mods.** Left out at the round 1 intake. Each new mod starts with its own intake in
  `mods/<name>/`, once round 1 has built the template and `docs/MOD-KICKOFF.md`.
- **The gate's `claude` stages run in the owner's config.** `claude plugin validate` writes
  `.claude.json` and a backup into its config folder (measured in Session 3c's review, CLI
  2.1.325), so `verify` touches `~/.claude` on every run. The tooling tests run the CLI with a
  scratch `HOME` and `CLAUDE_CONFIG_DIR`; whether the gate should too, given invariant 7, is the
  owner's call.
- **CI.** Left out at the round 1 intake. The workflow holds the gate in the session, and the
  owner's review and push approval stand behind it.
- **Going public.** Left out at the round 1 intake. Making the repository public is the owner's
  call. Before it happens, run hygiene over the whole history once more, and check that the
  install lines work for an account with no access to the private repository. `claude plugin
  validate` already reports what Anthropic's plugin directory would refuse a submission for (its
  `directory.findings`: a README, a LICENSE and an icon per plugin), which the gate does not
  judge.
  - **History holds what the updated rules keep out** (found by the 2026-11-14 review, F3 and
    F12). Every commit up to Session 3a holds `scripts/hygiene_terms.txt`, hashes a dictionary
    of names can reverse, and `docs/spec/SPEC.md` names the project hygiene was ported from.
    Rewriting history or accepting both is the owner's call, before going public.
- **Sharing mods with anyone but the owner.** Left out at the round 1 intake. The install lines for
  other people, and what a private repository asks of them, wait until the repository goes
  public.

## Not yet checked by hand

Checks that need a person at the machine. Each has an automated check covering most of it;
these are the parts only a person can see.

## Directions

- **Shared test helpers for mods.** If two mods grow the same test scaffolding, such as
  cartoon-fx's stand-in for the engine, its home is the template. Each mod gets a copy, because a
  mod cannot import from outside its folder.
- **A mod that depends on another.** A mod that adds a noun to `$` ships its types as a contract,
  and a mod that uses the noun lists it under `dependencies` in its `plugin.json`. The marketplace
  stage would then also check that every dependency is listed.

## Decided against

- **Runtime code shared between mods.** Each mod installs alone (invariant 2).
- **A copy of the workflow per mod.** There is one copy, at the root.
- **Committing Claude Code's API declarations.** They are regenerated for every build, and they
  are not this repository's to publish.
- **Running mods live from the repository in everyday sessions.** The owner runs installed
  releases (decision 11), so unfinished work never reaches their sessions.
