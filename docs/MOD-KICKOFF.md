# Kickoff: a new mod's intake (its Session 0)

This is the guide for the intake of a new mod's round 1, adapted for this repository from the
workflow kit's kickoff. Read `docs/DEVELOPMENT-WORKFLOW.md` first, templates included, then the
owner's request: what the mod should do, or a design draft if they wrote one. This chat is the
mod's **Session 0**. It writes documents and no product code, and its output is:
- a mod folder in which Session 1 can start cold;
- the mod's spec, architecture, session plan and rules file;
- the prompt that opens Session 1.

**Where it starts.** The owner has run `npm run new-mod -- <name> "<description>"` and the steps
it prints (`docs/USER-GUIDE.md`, *Starting a new mod*). So `mods/<name>/` holds the template,
renamed and at 0.1.0, beside its marketplace entry and README row, all uncommitted: that is this
session's entry state, and this session commits them. Check `git status` shows nothing else of
this mod's. If the name turns out wrong, stop: a rename later loses installs and stored values,
and starting over is `docs/USER-GUIDE.md`'s, before this commit.

**What the repository settles** is not asked again: the stack and its pins, the gate, hygiene and
the term list, the marketplace and how the owner installs, the layout every mod shares, the
licence, the git identity and the remote. They are in the root `CLAUDE.md` and
`docs/ARCHITECTURE.md`, and the made `docs/ARCHITECTURE.md` has filled them in. The root
`CLAUDE.md`'s *What every mod follows* binds the mod.

## Step 1: intake (a conversation, not a guess)

Before writing anything, list what the request leaves underdetermined, including at least:
- **What v1 is.** The smallest version worth using, and what is explicitly not v1.
- **The engine.** Which events the mod hooks and which surfaces it draws on (the terminal, the
  desktop app, or both); which hooks gate; what crosses each way; and what it must never assume
  about the engine: a hook's order, a row's shape, a surface. Read the laid declarations for the
  names, never memory.
- **Its values.** Each `$.state` key, live for a session, and each `$.store` key, the owner's data
  across sessions, read forward-only. Each is a machine identifier.
- **Its reach.** Any network, process or file access, only where the mod's purpose needs it.
- **Its own invariants.** What must never happen (refusing a call it should only react to, losing
  a stored value…), beyond the ones every mod shares.
- **How it is verified.** What its tests cover, what the engine's kit cannot see, and what the
  owner checks by hand in the app.
- **Versions.** Each session is a release: Session 1 releases 0.1.0, and round 1's last session,
  its documentation pass, releases 1.0.0. Which versions are milestones that get a tag
  (`<name>-v<x.y.z>`).
- **Names.** The mod's slash commands, and its state and store keys, which must never change once
  data exists under them. The mod's own name was chosen at `new-mod`.
- **Privacy.** Anything private beyond the term list, such as people or projects the request
  names; a private word goes on the term list with the owner's yes.
- **A review of the plan.** Offer an adversarial review only if the plan is among the riskiest:
  it gates calls, stores data that cannot be rebuilt, or adds a noun to `$` that another mod
  would depend on. Say that it is costly.

Ask the owner in small batches. For every question, give your recommended answer and one line on
why. Where a design draft marks an answer as decided, list it to confirm instead of asking it.
Where the request contradicts itself, ask which part wins. Do not move to step 2 until every open
item is answered or explicitly deferred.

## Step 2: write the round-1 documents

Propose the documents below as your plan, in plan mode, and write them when the owner approves
it. Use the workflow's templates for every file that has one, and the one at the end of this
file. Every path is inside `mods/<name>/`.

1. **`docs/spec/PDD.md`,** only if the owner wrote a design draft: the draft frozen as given, with
   private details replaced by roles and lines crediting or addressing an AI tool removed.
2. **`docs/spec/SPEC.md`,** the contract for v1, from the template below.
3. **`docs/ARCHITECTURE.md`,** the made one completed. Its shared parts stay; every intake answer
   about how the mod is built goes into a Decided part, and each Built part the round will build
   says "Not yet: Session <id>". Keep every section, writing "None" where one has nothing. The
   baseline is left for Session 1.
4. **`docs/spec/SESSIONS.md`,** the plan for round 1, from the workflow's template: the header, the
   table of sessions with their versions, and one block per session with **Read**, **Scope**,
   **Docs**, **Gates**, **Confirms** and **Watch for**.
   - Session ids are numbers; this chat is Session 0 and has no block.
   - **Session 1 starts from the made mod and releases 0.1.0.** It replaces `/hello` and its test
     with the walking skeleton (a thin slice through every hook the mod needs, on every surface
     it draws on), rewrites the 0.1.0 changelog entry, which no one has installed, fills in the
     README and the baseline, and confirms the Decided parts it builds on.
   - Each later session is a release, its version in the table.
   - **The last session is the documentation pass,** releasing 1.0.0. Its Read line is
     everything: `docs/ARCHITECTURE.md` read cold against the code, every Built part true and the
     baseline current; `docs/USER-GUIDE.md`; the README; the mod's `CLAUDE.md` pointing at them;
     anything still open moved to `docs/BACKLOG.md`; then, after its review, the separate
     `docs(<name>): close round 1` commit.
5. **`CLAUDE.md`,** the made one filled in: what the mod is, in two sentences; its machine
   identifiers; its commands; and its *Watch for*, with the traps the intake already knows. Rules
   every mod shares stay in the root's.
6. **`docs/BACKLOG.md`:** what the request or draft holds that is not v1, under Deferred,
   Directions and Decided against. *Not yet checked by hand* starts empty.
7. **`docs/next-session-prompt.md`:** the prompt for Session 1, from the workflow's mid-round
   template, its first line copying the root `CLAUDE.md`'s read order for a mod session. Its
   state is what the intake decided that the spec and the architecture do not say.

No copy of the workflow, and no hygiene design: both are the repository's, built once for every
mod. `docs/USER-GUIDE.md` keeps the made placeholder until a session gives the mod behaviour.

## Step 3: close Session 0

- Check every file you wrote against the term list by running the gate below: hygiene reads the
  draft and every uncommitted file.
- As the last act before the commit, write its message into
  `"$(git rev-parse --git-dir)/COMMIT_DRAFT"`, run
  `npm run verify -- <name> --message "$(git rev-parse --git-dir)/COMMIT_DRAFT"`, and commit with
  `git commit -F` from it, staging explicit paths: `mods/<name>/`, its marketplace entry and its
  README row. The subject is `docs(<name>): open round 1 — <theme>`. Delete the draft.
- The owner runs `/code-review high` on the commit: the spec, the architecture and the plan for
  contradictions, gaps and sessions too big for one chat, and every Read line against what its
  session needs. Report what it found and ask which findings to fix. Commit the fixes as
  `review(<name>): <the findings, in plain words>, and <n> smaller`.
- Print the opener as the last message, ready to paste, and stop:
  `Read mods/<name>/docs/next-session-prompt.md and do the session it names: Session 1, <one line>, release 0.1.0.`
  Never print the handoff itself. A push waits for the owner's approval, like any other.

---

## `docs/spec/SPEC.md` template, for a mod

Fill every `<…>`. Keep every section, writing "None" where one has nothing: the sessions' Read
lines point at sections and decisions by number. §4 and §5 are for a round with a design draft;
without one, each says "None: no design draft".

````markdown
# <name> — the round 1 contract

Read-only from the first line of Session 1. Session 0 derived it on <YYYY-MM-DD> from <the owner's
request, quoted in §1 | `docs/spec/PDD.md` (<its version>, frozen)>. How the mod is built is in
`docs/ARCHITECTURE.md`, which Session 0 completed beside it and which outlasts the round.

## 1. The request, verbatim (<YYYY-MM-DD>)

> <The owner's words, private details replaced by roles. With a draft, one line pointing at it.>

## 2. Resolved decisions (<YYYY-MM-DD>, at intake)

Decisions <n–m> were answered by the owner at intake. Decisions <n–m> were proposed by the
intake and approved with the Session 0 plan. None is re-litigated by an implementing session; a
change is added beside the decision as an **Amended <YYYY-MM-DD> by the owner** note. An answer
about how the mod is built is in `ARCHITECTURE.md`, not here.

1. **<The decision, in one sentence>.** <The detail a session needs, and the why where it changes
   the action.>
2. **<n> sessions** (`SESSIONS.md`), releasing 0.1.0 to 1.0.0.
3. **Versions.** Each session a release, in `plugin.json`; tags <none | `<name>-v<x.y.z>` at
   <milestones>>.
<n>. **Out of v1** (each in `docs/BACKLOG.md`): <…>.

## 3. What v1 is, and is not

**v1 is** <what the owner sees it do, on which surfaces>.

**v1 is not:** <the non-goals, a clause each>.

## 4. PDD amendments

| PDD place | PDD says | Now | Where decided |
|---|---|---|---|

## 5. Traceability

| Requirement | Session |
|---|---|

## 6. Definition of done for v1

1. Every block in `SESSIONS.md` has its done-note with its Review section.
2. <What the mod does, and what passes>.
3. `npm run verify -- <name>` is green, with the counts in `ARCHITECTURE.md`'s baseline.
4. The owner has checked it by hand from the installed 1.0.0, in the desktop app and the terminal
   where it draws on both.
5. `docs/ARCHITECTURE.md`'s Built parts describe the mod as built; `docs/USER-GUIDE.md` and a
   truthful README exist; `CLAUDE.md` points at them.
6. Everything still open is in `docs/BACKLOG.md`, and `docs(<name>): close round 1` has emptied
   `docs/spec/`.
````
