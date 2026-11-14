Read this mod's `docs/spec/FEATURE-fun.md` (decisions 1 and 2) and `docs/spec/REVIEW-2026-11-14.md`
(F2–F7, F13–F15), the root CLAUDE.md, this mod's CLAUDE.md, `docs/ARCHITECTURE.md`, then this
file, and do Session A1 of this mod's `docs/spec/SESSIONS.md`: the drawings' faults fixed, the
helpers and the smoke redone, and checks that can fail when a drawing is wrong. Release 0.11.0.

## State you need that is not in the specs

- **Round 3 is fun, a queue, new moments and controls:** A1, D1, Q1, T1, T2, C1 and A2, all
  remaining. Its intake was the same chat as the repository's 2026-11-14 review, by the owner's
  choice: the root's `docs/spec/REVIEW-2026-11-14.md` is the other half, and the root's
  sessions 3a–3c run beside this round.
- **How the review saw the drawings.** It imported `hooks/fx.ts` into a plain Node script
  (`node --input-type=module`, which runs TypeScript as is), called `drawFx` for each `/fx`
  sample with seed 1000, and served a page that paused every SVG at a set time
  (`svg.pauseAnimations(); svg.setCurrentTime(t)`). Nothing of it was committed. A1's first ask
  is where its own frames are made.
- **Push status.** `origin/main` holds everything through
  `review(cartoon-fx): desktop checks wait for the push, and 7 smaller`, the intake's last
  commit, pushed with the owner's approval on 2026-11-14. Nothing is local. No version moved,
  so `claude plugin update cartoon-fx` still finds 0.10.3.
- **The intake's review** (the owner's `/code-review high`, 9 findings, all fixed) settled two
  decisions with the owner: every new moment gets a drawing of its own, and `medium` is the
  default size, with today's as `large` (decisions 6 and 7). It also moved every desktop hand
  check to after the push (the plan's header), and made T1 ask before anything is created on
  GitHub. List `origin/main..HEAD` before any push: parallel sessions share this
  checkout.
- **0.10.3 is the installed release** (2026-10-28, CLI 2.1.310). Nobody has checked it by hand in
  a live session yet; `docs/BACKLOG.md` says what to look at.
- **The owner's stored placement is `conversation`.**
- **The CLI on PATH is 2.1.325.** It moved from 2.1.323 during the intake's `npm run types`,
  which then ran twice. Run it whenever the `types` stage asks.
- **2.1.325 added `isCollapsed` to the strip's props,** which turned the gate red until the test
  file's strip fixture (`BAND`) got `isCollapsed: false`: a test-only commit,
  `fix(cartoon-fx): the tests' strip has the engine's new isCollapsed prop`, with no version.
  What a collapsed strip should do to an effect is Q1's (the review's F17).
- **Repo Session 3b will re-copy the root workflow** from the updated workflow kit and touch this
  mod's `CLAUDE.md` in a scoped commit. A session of this round that finds the root's
  `docs/DEVELOPMENT-WORKFLOW.md` changed follows it as it stands.
- **Repo Session 3b or 4** repoints this mod's `CLAUDE.md` (lines 9–10) and
  `docs/ARCHITECTURE.md` (*Testing strategy*) away from the root `docs/spec/SPEC.md`, in a
  `docs(cartoon-fx):` commit of its own. Leave those lines to it.
- **Baseline** (`docs/ARCHITECTURE.md`, v0.10.3, measured again at the intake on CLI 2.1.325):
  - 36 tests in `tests/cartoon-fx.test.tsx`;
  - `validate`: 13 hooks, 5 gating (each with a `.catch`), 4 state keys, and no warning but the
    allowed `CLAUDE.md` one;
  - `tsc` and the import scan are clean.

  `docs/ARCHITECTURE.md`'s baseline says "Measured on CLI 2.1.310"; A1 updates it with its own
  counts.

## Watch for

- **The standing traps:**
  - **Never `git checkout <path>`.** Falsify by copying the file aside and back.
  - **Stage explicit paths.** Parallel sessions share this checkout.
  - **Give stdin-reading commands `< /dev/null`.** A bare `cat > file` with no heredoc hangs.
  - **The CLI and the desktop engine are different builds,** and the CLI updates itself. Record
    the version each check ran on, and run `npm run types` again when the `types` stage asks.
- **The installed release runs in every session the owner starts,** this mod's own development
  sessions included. So a commit stamps, and `npm run verify` shows the checkmark.
- **A `--plugin-dir mods/cartoon-fx` session replaces the release** for that session
  (`docs/ARCHITECTURE.md`, *Packaging*). Type it as a shell command in a terminal, from the
  repository's root.
- **Biome formats every file in this folder.** There is no folder `biome.json`.
- **`placement` and `fxTakes` are the owner's data** in `$.store` (`docs/ARCHITECTURE.md`,
  *Values*). Read them forward-only, and never drop one without a changelog line.
- **The owner's update path is `claude plugin update cartoon-fx`,** and it installs only a new
  `plugin.json` version.
- **A drawing's design is the owner's,** settled from rendered frames (decision 2).
- **Comments state the present.** No session ids, no "used to", no review stories.
- **Every push needs its own approval.** List `origin/main..HEAD` first.
