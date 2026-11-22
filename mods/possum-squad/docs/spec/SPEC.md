# possum-squad — the round 1 contract

Read-only from the first line of Session 1. Session 0 derived it on 2026-11-16 from
`docs/spec/PDD.md` (version 0.9, frozen). How the mod is built is in `docs/ARCHITECTURE.md`,
which Session 0 completed beside it and which outlasts the round.

## 1. The request, verbatim (2026-11-16)

> Read the docs, and let's kick-off new plugin development

The owner gave the build kit with it: the design draft, frozen as `docs/spec/PDD.md` (every
mention of another mod it was compared with removed, at the owner's word, and three lines that
credited a tool as the builder made neutral), and its inputs, frozen in `docs/spec/research/`:
- `art/`: the first-pass sprite layers (`base.png`, `extras/`, `palette.json`, `manifest.json`,
  and `sets/<set>/outfits/` and `sets/<set>/props/` for `classic`, `steampunk`, `horror` and
  `prehistoric`);
- `sprites/`: the Python scripts that drew them, the reference for each recipe in the manifest;
- `roles/`: `role_engine_reference.py`, the role detection reference, and `role-corpus.json`,
  its 144 labelled cases (`dev` 102, `holdout` 42).

The PDD's paths `research/…` are relative to this folder. `research/` is input: sessions copy
from it and never edit it.

## 2. Resolved decisions (2026-11-16, at intake)

Decisions 1–11 were answered by the owner at intake. Decisions 12–23 were proposed by the intake
and approved with the Session 0 plan, after one adversarial review of that plan. None is
re-litigated by an implementing session; a change is added beside the decision as an **Amended
<YYYY-MM-DD> by the owner** note. An answer about how the mod is built is in `ARCHITECTURE.md`,
not here.

1. **Round 1 is the PDD's version 1, plus nested helpers (F-24), minus step reports,** in 14
   sessions (`SESSIONS.md`: 1–13 and 7a, split from 7 at the intake's review), releasing 0.1.0
   to 1.0.0.
2. **No step reports in v1.** The `step` tool (F-17), the nudge (F-18) and the `plan` tool (F-19)
   go to `docs/BACKLOG.md` as one later round. Their names (`step`, `plan`, the setting
   `stepReports`, the state key `planned`) stay reserved, and so does role rule 1 ("stated"),
   which has no source in v1. The mod registers no tool at all, so N-01 holds by construction.
3. **Versions.** Each session a release, in `plugin.json`; one tag, `possum-squad-v1.0.0`, at the
   end of the round.
4. **English only.** F-25 and the `language` setting are dropped; the strings live in one
   English table. Ukrainian is under *Decided against* in `docs/BACKLOG.md`.
5. **All four sets ship in v1:** `classic`, `steampunk`, `horror`, `prehistoric`. If the art
   review after Session 7a finds one not ready, the whole set is cut, never a single role.
6. **Settings live in the store,** under `prefs`, changed with `/possums set`. The manifest
   declares no settings.
7. **The mod names no other mod,** in its docs, its README or its code. Nothing credits one.
8. **The kit's inputs are frozen in `docs/spec/research/`,** listed in §1. Sheets, preview GIFs,
   the API notes and the kit's archive stay outside the repository. The round's close deletes
   `research/` with the rest of `docs/spec/`; by then `art/`, `hooks/roles/` and the corpus
   fixture hold what the mod needs.
9. **The sprite converter lives in the mod's `tools/`.** The gate cannot take it today: its import
   scan refuses Node imports in any `.ts` file of a mod, and no type check reads `tools/`. Teaching
   the gate that folder is a repo-level round, which the owner opens in its own chat before
   Session 6.
10. **The skeleton and the spikes are two sessions,** 1 and 2.
11. **The Session 0 plan had one adversarial review,** on the owner's word.
12. **Engine facts, read from the 2.1.325 and 2.1.326 declarations, replace the PDD's Assumed
    rows:**
    - `agent.spawn` carries `prompt` (the brief), `description`, `subagentType`, `parentAgentId`
      and `tool_use_id`, and `model` only as the caller gave it. The agent id and the resolved
      model arrive in its result. Effort and the model in use come from `turn.step`.
    - `turn.step` is a streaming hook, raised for every model request, the main session's
      included. The mod yields the engine's stream through untouched and reads the result
      after it.
    - An `Svg` needs `alt`, takes `width` and `height` in CSS pixels, and runs SMIL only with
      `isInteractive`, which draws it in a sandboxed frame of its own. Without it, it is an image.
    - The kit raises `agent.spawn`, `turn.start`, `turn.step`, `turn.complete`, `tool.call` and
      `tool.check`.
13. **How a run ends (F-11):** an answer with text is Finished; `aborted` is Stopped; `error`,
    `refusal`, and `answer` with empty text are Failed.
14. **How events join to rows:**
    - a spawn opens its row under its `tool_use_id` and re-keys it to the agent id when the
      spawn's result gives one;
    - an event from a loop no row knows (the engine's own forks) is ignored;
    - a resumed agent returns to its row;
    - a teammate's row goes back to working on its next turn;
    - a workflow's agents are ordinary rows.
15. **Motion and the light theme are provisional.** The API reads neither a reduced-motion
    preference nor the app's light or dark theme. Session 2 tries CSS media queries inside the
    SVG for both; the owner decides at the start of Session 3. Until then motion is the `motion`
    setting alone (`auto` animates, `off` is still).
16. **"Needs you" (F-12) depends on Session 2's spike.** No event says a prompt is waiting. The
    candidates are `tool.check` answering `ask` and `classic.PermissionRequest`. F-12 is dropped
    from v1 if neither gives a reliable start and end.
17. **Sprites draw wherever `Svg` resolves;** text rows elsewhere. Only the desktop app and the
    terminal are checked by hand.
18. **A minimized pane (the desktop's `widget` seat) draws the collapsed view** (F-16).
19. **What the two values hold.** `prefs` (store) is one object with the settings and the two
    panel preferences (collapsed, Finished open). `view` (state) holds the session's flags:
    whether the person closed the pane, which row's Peek is open, whether the gallery is open.
20. **The role corpus becomes a `.ts` module** in `tests/fixtures/`, its items copied unchanged:
    the engine loads no JSON. Its labels are fixed, and the rule table is never tuned on
    `holdout`; the build may add cases to `dev`.
21. **The first session releases 0.1.0,** not the PDD's spike build "0.0.1".
22. **Everything else the PDD marks Decided stands as written:** the name and the machine names
    of Part 6, `autoOpen` defaulting to `first`, subscription numbers first with `cost` off by
    default, MIT, seventeen roles, the `classic` outfits and the three other sets.
23. **Out of v1** (each in `docs/BACKLOG.md`): step reports, the nudge and the `plan` tool;
    submission to Anthropic's plugin directory; sets made by other people; sprites in the
    terminal; the `modern` set; a finish sound; a preview GIF for the README.

## 3. What v1 is, and is not

**v1 is** one pane, `possum-squad`, opened by `/possums` or by itself when a session's first
agent starts. It lists the main session as the Lead and every subagent as a row, in the sections
Lead, Needs you, Running, Finished. A row carries the agent's description, its role, model and
effort, its activity, a bar of context fill, its tokens and its time, live. On the desktop app
each agent is an animated pixel opossum in its role's outfit, from one of four sets; elsewhere
the same rows are text. Agents nested under their parent, Peek, a collapsed view, toasts while
the pane is closed, a role picker, the plan-limit percent, an optional cost estimate and a
gallery of every role and state complete it. Watching costs no tokens and changes nothing Claude
does.

**v1 is not:** step reports or a planned list (decision 2); a translation (decision 4); an
orchestrator that starts, stops or plans work; billing; sprites in the terminal; a band above
the prompt; anything stored from a session's content.

## 4. PDD amendments

| PDD place | PDD says | Now | Where decided |
|---|---|---|---|
| Throughout (Parts 2, 5, 7, 8, 10, 12, 13, Appendices B–E) | Mentions of another mod | Removed before freezing; rewritten as "other panels" where the reasoning needed a comparison | Decision 7 |
| Part 13 *Scope statement*, *Team & roles*; Appendix C item 4 | Three lines naming a tool or an agent as the builder | Neutral wording | The intake, by the repository's rule against attribution |
| Part 1 *Platforms* | Nothing is drawn in the VS Code extension | Sprites wherever `Svg` resolves, text elsewhere; only desktop and terminal checked | Decision 17 |
| Part 5 F-17, F-18, F-19; Part 6 *Names* (`stepReports`, `planned`); Part 8 allow-list (`$.tool.register`) | Should, Could, Could; in v1 | Out of v1; names reserved; no tool registered | Decision 2 |
| Part 5 F-24; Part 13 *Scope cuts* | Could; stretch after 1.0.0 | In v1, Session 12 | Decision 1 |
| Part 5 F-25; Part 6 *Names* (`language`); Part 10; Appendix C item 3 | English and Ukrainian | English only; no `language` setting | Decision 4 |
| Part 5 F-11 | Failed "otherwise" | The four turn endings mapped | Decision 13 |
| Part 5 F-21 | The system signal "if spike A finds one" | Provisional; media queries tried in Session 2 | Decision 15 |
| Part 5 *Constraints & assumptions*, Assumed rows | The spawn event carries type, model, effort and brief | Type, brief and the caller's model; resolved model in the result; effort from `turn.step` | Decision 12 |
| Part 8 *Stack & architecture*, Drawing | One `Svg` string per sprite animated with SMIL | Needs `isInteractive` and `alt`; the `widget` seat draws the collapsed view | Decisions 12, 18 |
| Part 6 *Names that never change*, state keys | `runs`, `lead`, `planned`, `view` | `planned` reserved; what `prefs` and `view` hold is set | Decisions 2, 19 |
| Part 13 *Milestones* M0–M7 | Eight milestones, 0.0.1 first | 14 sessions, 0.1.0 to 1.0.0 | Decisions 1, 10, 21 |
| Part 8 Art tool; Appendix C item 8 | The converter in the mod's `tools/` | Kept; the gate learns `tools/` in a repo-level round first | Decision 9 |
| Appendix C item 10; the kit's README | Only the PDD enters; the art and corpus at M3 and M4 | The inputs frozen in `docs/spec/research/`; the corpus as a `.ts` fixture | Decisions 8, 20 |
| Part 5 F-27; Appendix C item 12 | Proposed: all four sets ship | Decided | Decision 5 |
| Appendix C item 11 | Settings in the store, revisited after M0 | Decided | Decision 6 |
| Appendix C item 5 | Submit to the plugin directory | Backlog | Decision 23 |
| Part 13 M7; Part 12 *Release gate* | Ukrainian strings and a preview GIF | Neither | Decisions 4, 23 |
| Part 5 F-06; Part 6 *Role detection*, rule 7 | Helper at T-04 with no rule fired | Also Helper at a run's end with no rule fired, except a teammate's; T-04 holds whether or not the pane is open | **Amended 2026-11-22 by the owner,** at Session 8's plan; and not at the end of a turn that left work in the background, at its review |

## 5. Traceability

Standing gates, each from the session that adds its test, then in every session that touches
what it guards: N-01, I-01, I-02 and I-05 from Session 1; I-03 and I-04 from Session 3; I-06 from
Session 4. N-07 and I-08 are review rules in every session.

| Requirement | Session |
|---|---|
| F-01 rows within one redraw | 4 |
| F-02 row numbers, live | 4 (tokens, model, effort, context; T-11's window table), 5 (time) |
| F-03 header totals | 5 |
| F-04 section order | 5 |
| F-05 role rules and the corpus | 8 |
| F-06 plain until settled; Helper at T-04 | 8 |
| F-07 role picker, memory for custom types | 9 |
| F-08 every state's pose or animation | 6 (still poses), 7a (animations), 9 (wired to runs) |
| F-09 the Lead | 5 |
| F-10 auto-open | 9 |
| F-11 endings | 4 |
| F-12 Needs you | 2 (the spike), 10 (if kept, decision 16) |
| F-13 Peek | 11 |
| F-14 toasts | 10 |
| F-15 gone quiet | 10 |
| F-16 collapsed view; the `widget` seat | 11 |
| F-17, F-18, F-19 | Out of v1 (decision 2) |
| F-20 plan-limit percent, cost estimate | 12 |
| F-21 motion off | 6, 7a |
| F-22 terminal text rows | 3 (the row), 5 (complete) |
| F-23 survives reload, resets on clear | 4 |
| F-24 nested helpers | 12 |
| F-25 | Out of v1 (decision 4) |
| F-26 the gallery | 7 |
| F-27 sets and `theme` | 6 (the set format, `classic`), 7 (the other three, switching) |
| N-01 zero tokens | 1, standing |
| N-02 sprite size | 6, 7, 7a |
| N-03 no idle timers | 5, standing after |
| N-04 no redraws for animation | 7a |
| N-05 tree time for 20 rows | 7 (timed by hand) |
| N-06 contrast on both themes | 6 (the approach chosen at 3) |
| N-07 hook time | Every session (review rule) |
| N-08 supported versions | 13 |
| I-01, I-02, I-05 | 1, standing |
| I-03, I-04 | 3, standing |
| I-06 | 4, standing |
| I-07 the outfit never changes | 8 |
| I-08 nothing from another mod or character | Every session (review rule) |
| H1 role accuracy | The owner's week of use after Session 8's release. **Amended 2026-11-22 by the owner:** after Session 9's release, whose picker counts each miss |
| H2 a pane animates a dozen sprites | 2 |
| H4 a permission wait is visible | 2 |
| H6 outfits distinct at panel size | The art review after Session 7a |

## 6. Definition of done for v1

1. Every block in `SESSIONS.md` has its done-note with its Review section.
2. The panel shows the Lead and every subagent with live numbers and the right ending, in four
   sets of animated outfits on the desktop app and as text rows in the terminal; roles are
   detected and correctable; attention states, Peek, the collapsed view, nested helpers, the
   plan-limit percent and the gallery work; the role corpus passes (`dev` all, `holdout` at
   least 90%).
3. `npm run verify -- possum-squad` is green, with the counts in `ARCHITECTURE.md`'s baseline,
   and `claude plugin validate` lists only the calls `ARCHITECTURE.md`'s *Reach* allows.
4. The owner has checked it by hand from the installed 1.0.0, in the desktop app and the
   terminal.
5. `docs/ARCHITECTURE.md`'s Built parts describe the mod as built; `docs/USER-GUIDE.md` and a
   truthful README exist; `CLAUDE.md` points at them.
6. Everything still open is in `docs/BACKLOG.md`, and `docs(possum-squad): close round 1` has
   emptied `docs/spec/`.
