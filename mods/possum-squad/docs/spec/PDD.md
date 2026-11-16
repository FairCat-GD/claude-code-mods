# Product Design Document: Possum Squad

> **Decisions are marked.** **Decided** means the owner settled it, directly or by delegating the choice. **Proposed** means a recommendation waiting for the owner. Unmarked text is intent. Open items live in Appendix C. Unless a line says Decided, every choice in this draft is **Proposed**.
>
> **One home per fact.** Rules are stated once under an ID (F-, N-, I-, T-) and referenced elsewhere.
>
> **Evidence.** *Verified* means read in the Claude Code mods documentation on 2026-11-14. *Measured* means measured on the first-pass sprites in `research/sprites/` or on the role corpus in `research/roles/`, both of which ship with this document. *Verified in the repository* means read from, or measured by hand by, another mod in the repository this one will live in, on the versions named. *Assumed* means not yet checked in a running session; every assumption names the milestone that checks it. Nothing in this draft has been run inside Claude Code.

---

## Part 0: Document Control

| Field | Value |
|---|---|
| **Product name** | Possum Squad. **Decided** (owner), with the machine names in Part 6 |
| **Document owner** | The owner |
| **Version** | 0.9 |
| **Status** | Design |
| **Current focus** | Parts 4, 5, 7, 8, 13 |
| **Last updated** | 2026-11-15 |
| **Private names** | None |

**Changelog**

| Version | Date | Author | Change |
|---|---|---|---|
| 0.9 | 2026-11-15 | For the owner | Three sprites redrawn at the owner's request: the steampunk Planner, the horror Artist and the prehistoric Analyst, which is now a stegosaurus costume |
| 0.8 | 2026-11-15 | For the owner | Refinement pass on `steampunk`, `horror` and `prehistoric` at the owner's request: clearer silhouettes, larger props, several costumes redrawn (the table of the other sets). `classic` unchanged. N-02 measured again |
| 0.7 | 2026-11-15 | For the owner | Three more sets planned with the owner and drawn in full: `steampunk`, `horror`, `prehistoric`. The setting that picks a set is named `theme`. Each set gives every role a costume name, shown in the gallery |
| 0.6 | 2026-11-15 | For the owner | Owner art review: the Guard is an agent in a black suit, not a knight. Every other outfit of `classic` accepted |
| 0.5 | 2026-11-15 | For the owner | Owner art review of the `modern` redraw: not kept. The first set is the earlier one, now named `classic`, with a king as the Lead. Sets stay (F-27); the `modern` drawings are parked as a later set |
| 0.4 | 2026-11-15 | For the owner | Name decided. Fitted to the repository it will live in: `mods/possum-squad/`, that repository's layout, gate, workflow and release path; Node replaces Python for the sprite converter; settings move to the store; the tape mod is dropped. Animation by SMIL inside each sprite, already proven on the desktop app in that repository. Outfits redrawn as one theme, `modern`, and sets added (F-27). Gallery promoted to Should (F-26). Lead is a coach; Guard, Writer, Scout, Analyst, Pilot, Operator and Planner redrawn to fit |
| 0.3 | 2026-11-14 | For the owner | Second read before the build. Role memory limited to custom agent types (it would otherwise dress every generic agent alike). Description rule reworked around the leading verb and measured on a labelled corpus. "Any other shell command" no longer settles a role. Outfits reduced to two layers and exported as PNG layers with a manifest. Keyboard shortcuts in the pane removed as unverified. T-04 raised to 60 s. The superseded draft is no longer referenced |
| 0.2 | 2026-11-14 | For the owner | Owner art review of the second sprite pass: all outfits accepted except the Reviewer. Reviewer redrawn as a critic (top hat, monocle, checklist); the judge's wig and gavel are dropped |
| 0.1 | 2026-11-14 | For the owner | Initial PDD from the same-day draft. Owner decisions recorded: panel plus opt-in step reports and no flow skill; public and open source; subscription numbers lead; panel opens by itself; text fallback in the terminal; MIT; roster and sprite size delegated; outfits to be distinctive |

---

## Part 1: Vision (The One-Pager)

**Elevator pitch**

Possum Squad is a side panel for the Claude Code desktop app that shows every agent as a tiny animated opossum dressed for its job, so one glance says who is working, on what, and who needs you.

**Problem statement**

People who let Claude Code run several subagents at once see them as a few lines in the transcript. They cannot tell at a glance which agent is doing what, which one has gone quiet, which one failed, or which one is waiting for them. They cope by scrolling, by expanding tool rows, or by waiting until everything stops. The cost is attention spent on finding out, and agents left waiting on a permission prompt nobody noticed.

**Product pillars** (ranked; the higher one wins a conflict)

1. **One glance answers "who needs me?"** States that call for the user outrank everything else in order, colour and motion.
2. **Free to run.** Watching costs zero tokens and changes nothing Claude does. Anything that spends tokens or changes a prompt is opt-in and says so.
3. **Charm that carries information.** Every outfit maps to a role and every animation to a state. No motion that means nothing.
4. **Boring permissions.** No network, no processes, no files. What the mod is allowed to call fits in one line of a README.

**Non-goals**

- Not an orchestrator. It never plans, delegates, stops or restarts work.
- Not billing. Dollar figures, when shown at all, are labelled estimates.
- Not a terminal showpiece. The terminal gets correct text rows, not sprites, in version 1.

**Target user**

A person who uses Claude Code in the desktop app's Code tab on a subscription plan and regularly has two or more subagents running. Today they use the transcript and the app's own spinner.

**Value proposition & the hook**

The role and the state of every agent, readable without reading. The 15-second demo: a prompt fans out to three agents; three opossums walk in plain, then hop and land dressed as a builder, a researcher and an artist; one holds up a "?" sign and hops to the top; another flops on its back, tongue out.

**Category**

Developer utility: a Claude Code mod (a plugin with a hooks module).

**Platforms**

**Decided:** the Claude Code desktop app, Code tab, first and in full. **Decided:** the Claude Code terminal gets the same panel as text rows with block bars and no sprites (F-22). Nothing is drawn in the VS Code extension, in `claude -p`, or in cloud sessions, because Claude Code draws no mod interface there (*Verified*).

**Usage shape**

Opens by itself when the first agent of a session starts and stays beside the conversation. Glanced at for a second or two, dozens of times in a working session; clicked a few times a day. Typical load 1 to 5 agents at once, designed for 20.

---

## Part 2: Market & Competitive Positioning

**Market context**

Claude Code mods are new (autumn 2026) and can draw a pane beside the conversation. Agent panels were among the first mods published. Mods are free and open source by norm, installed from plugin marketplaces. The mods API is new and can change between releases.

**Direct competitors & substitutes**

| Competitor / substitute | Strengths | Weaknesses | Takeaway for us |
|---|---|---|---|
| Other agent panels | Track any subagent from engine events at no token cost; live cost, context and time; an animated character per agent | Step bars and a Planned list need a companion flow skill; costumes follow model tier, which the row already says in text; totals leave out the main session; helpers of a worker appear as flat rows; token totals include cache reads | Keep the free event tracking. Spend the costume on role. Put the main session on the panel |
| The app's own transcript and spinner | Always there, always correct | One line per agent, no overview, no state at a glance | The panel must never disagree with it |
| Watching nothing and waiting | Free | Blocked agents sit unnoticed | The "Needs you" state is the feature that pays for the panel |

**Positioning statement**

For people who run several Claude Code subagents at once, Possum Squad is an agents panel that shows each agent's role and state at a glance, unlike tier-costumed panels, because the outfit says what kind of work is being done and the animation says whether it needs you.

**The gap we fill**

Role and attention. No published panel dresses agents by the kind of work they do or lifts the ones waiting on the user to the top.

---

## Part 3: Users & Jobs

**Personas** (ranked)

1. **The parallel worker.** Desktop app, subscription, fans work out to subagents daily. Wants to know when to look and where. Frustrated by scrolling the transcript to find the one agent that stalled.
2. **The workflow builder.** Runs a skill or workflow of their own that delegates in steps. Wants real progress bars and a planned list without writing a panel. Uses the report contract (F-17, F-19).
3. **The newcomer.** Installs it because it is cute. Learns what subagents are by watching them.

**Jobs to be done**

- When several agents are running, I want to see which one needs me, so I can unblock it and get back to my own work.
- When an agent finishes or fails, I want to know without reading the transcript, so I can decide whether to look.
- When I delegate work, I want to see that the right kind of agent picked it up, so I can trust the split.
- When I watch the panel, I want it to be a small pleasure, so that keeping it open costs nothing.

**User journey**

Find it in a marketplace or a shared GIF, install, forget about it, first agent starts and the panel opens, first "oh, that one is the tester", daily use, recommend. It is lost at install (trust: what can this mod do?) and at the first wrong outfit (does it mislead?).

**First-run experience**

Install the plugin. Nothing happens and nothing is asked. The next time Claude starts an agent the panel opens by itself with that agent's opossum walking in. Time to first value is the time to the first subagent. The user is never asked to configure anything, sign in, or pick a theme.

**Accessibility intent**

State is always also a word (I-06). Reduced motion gives one still pose per state (F-21). Colours are checked on the app's dark and light themes (N-06). Every control is one of the app's own buttons, so keyboard reach is whatever the app gives buttons in a pane; the mod adds no shortcuts of its own. Screen reader behaviour of mod panes is unknown; the text labels are the provision for it.

---

## Part 4: Core Experience

**Core loop**

Agent starts, row appears, user glances, agent ends, row settles under Finished. Per glance: one to two seconds. Per session: dozens of glances, a few clicks.

**Primary user flows**

- **Watch.** An agent starts. If it is the first of the session the panel opens (F-10). An opossum arrives plain, gets its outfit when the role settles (F-06), works, and ends asleep or playing dead.
- **Respond.** An agent's tool call waits on a permission prompt. Its row moves to Needs you and it holds up a "?" sign (F-12). If the panel is closed, a toast says so (F-14). The user answers the app's own prompt; the row returns to Running.
- **Inspect.** Click a row. Peek opens under it: the brief, the last actions, files touched, and the answer when done (F-13). Click again to close.
- **Correct an outfit.** Click the sprite, pick a role. It applies to that run, and is remembered when the agent is a custom type (F-07).
- **Turn on step reports.** `/possums set stepReports tool` (or `nudge`) (F-17, F-18).
- **Open and close.** `/possums` toggles the panel. Closing it by hand keeps it closed for the rest of the session (F-10).

**Worked examples**

Invented data only.

| Case | Input | Expected |
|---|---|---|
| One explorer | The explore-type agent starts with the description "Find where reports are built" | A Scout row at once (type rule). Grey bar showing context fill. On finish: asleep under Finished, tokens and time frozen |
| Three generic agents | Three agents of the generic type: "Research competitor launches", "Design the launch graphics", "Build the landing page" | Researcher, Artist, Builder, from the description (F-05, Part 6) |
| The verb decides | "Document the test setup", "Research testing frameworks", "Review the migration plan" | Writer, Researcher, Reviewer: the leading verb outranks the nouns after it |
| Design a look, design a system | "Design onboarding screens", "Design database schema" | Artist, Planner |
| No clue in the words | Generic agent, description "Take care of it". Tool calls: Read, Grep, Grep, Edit | Arrives plain. Reads and searches are weak evidence and do not settle it. The Edit is decisive: Builder at the fourth call |
| Only ever reads | Generic agent, description "Check the thing". Six reads and searches, nothing else | Scout after the sixth weak call (T-03) |
| A shell command is no clue | Generic agent, description "Do task 3". Calls: a directory listing in the shell, then one Read | Still plain; Helper at T-04 |
| One correction, not a rule | The user reassigns one generic-type agent to Tester | That run becomes a Tester. The next generic-type agent is detected as usual |
| Stopped is not failed | The user interrupts while an agent runs | Stopped (startled, then sits), never playing dead (F-11) |
| Ended with nothing | An agent's turn ends without an answer and was not interrupted | Failed: plays dead, row keeps its last five actions |
| Bad step report | A step report says done 7 of 5, label of 400 characters | Bar reads 5/5; label cut to fit one line; nothing breaks (F-17) |
| Same task twice | A second agent starts with the same description as a finished one | A new row marked "round 2" |
| Clear mid-run | `/clear` while two agents run | The list empties with the session; no ghost rows afterwards (F-23) |
| Reload mid-run | The mod reloads while two agents run | Both rows are still there with their totals (F-23) |

**Feature set**

- **Panel and rows.** Sections in fixed order: Lead, Needs you, Running, Finished (collapsed by default), Planned (only when reported). F-01 to F-04.
- **Roles and outfits.** Seventeen roles (Part 6). The role is settled once and the outfit never changes afterwards (I-07). F-05 to F-07. Outfits come in sets, picked with `/possums set theme <set>`; four are drawn: `classic`, `steampunk`, `horror`, `prehistoric` (F-27).
- **States and animation.** Part 7 motion table. F-08, F-11, F-12, F-15.
- **The Lead.** The main session as an opossum with its own context fill; in the collapsed view it carries one joey per running agent. F-09, F-16.
- **Peek.** F-13.
- **Numbers.** Plan-limit percent, context, tokens, time; an optional dollar estimate. F-02, F-03, F-20.
- **Step reports.** Off by default. F-17 to F-19.
- **Terminal fallback.** F-22.

**Information architecture**

One pane with the id `possum-squad`. Header: the Lead row, then one line of session numbers. Then the sections. A row is: sprite; line 1 task description; line 2 role, model, effort; line 3 activity; line 4 bar with step count or context fill, then context percent, tokens, time. Peek expands inside the row. The only other views are the gallery (F-26) and the settings list. Settings are changed by command and kept in the store (Part 6).

**States & edge cases**

| State | Behaviour |
|---|---|
| No agents yet this session | Empty panel: the squad asleep, one line of text: "No agents yet. They show up here when Claude starts one." |
| Panel closed | Events are still collected. No timer runs (N-03). A toast for Needs you and for long runs that finish (F-14) |
| More than 20 agents | All running rows are drawn; Finished keeps the latest T-06 rows; the pane scrolls |
| Very long description or label | Cut to one line with an ellipsis; full text in Peek |
| Unknown model | Context window falls back to the default in T-11; the row shows the model name as given |
| Spawn seen, then no event at all | Row stays in Starting; after T-05 it shows as gone quiet |
| Helper of a helper | Nested under its parent when the parent is known (F-24); otherwise a normal row |
| Two sessions open | Each session has its own list. Only the role map and panel preferences are shared (Part 6) |
| Light theme | Sprites get a one-pixel dark outline (N-06) |
| Reduced motion | Still poses (F-21) |
| Narrow terminal | The terminal only places a self-opened pane from 144 columns (*Verified*); `/possums` opens it at any width |
| Cloud session, `claude -p`, VS Code panel | Hooks run, nothing is drawn; the mod does nothing visible and never errors |
| An event shape the adapter does not recognise | The event passes through untouched; the row keeps its last good data (I-05) |

**Input & interaction model**

| Input | Action |
|---|---|
| `/possums` | Toggle the panel |
| `/possums open` | Open it or bring it forward, never close |
| `/possums set <name> <value>` | Change a setting (Part 6) |
| `/possums settings` | List the settings and their values |
| `/possums roles` | The gallery: every role and state (F-26) |
| Click a row | Toggle Peek |
| Click a sprite | Role picker for that agent |
| The collapse button in the header | Collapse or expand the panel (collapsed view, F-16) |
| The show button on Finished | Show or hide Finished |
| Keyboard | Whatever focus and activation the app gives buttons in a pane; no shortcuts of the mod's own |

---

## Part 5: Requirements

**Functional requirements**

| ID | Requirement | Priority | Check | Notes |
|---|---|---|---|---|
| F-01 | Every subagent that starts gets a row within one redraw of its spawn event | Must | Kit test: raising a spawn event then mounting the pane finds a row with that description | |
| F-02 | Each row shows description, role, model, effort when an event carries it, context percent, tokens and elapsed time, updated as events arrive; time ticks once a second while running | Must | Kit test with a mock clock: after two model requests the row's tokens equal the sum of the stubbed usage; after 3 s the time reads 0:03 | Fresh tokens (in and out) are counted apart from cache reads |
| F-03 | The header totals tokens and time over the main session and all agents | Must | Kit test: header total equals Lead plus rows | Other panels leave the main session out |
| F-04 | Sections appear in the fixed order Lead, Needs you, Running, Finished, Planned; empty sections other than Running are not drawn | Must | Kit test on a fixture with one agent in each state | |
| F-05 | A role is chosen for every agent by the ordered rules in Part 6 (stated, remembered, type, name, description, first tool calls, Helper) | Must | Table test on `research/roles/role-corpus.json`, copied into the tests unchanged: every item of the `dev` set and at least 90% of the `holdout` set get the labelled role | *Measured* on the reference engine: dev 102 of 102, holdout 39 of 42. Labels are fixed outside the build; the holdout set is never used to tune the table. Real-session accuracy is hypothesis H1 |
| F-06 | An agent whose role is not settled at spawn shows the plain opossum in the Starting state and gets its outfit when a rule fires, or Helper after T-04 | Must | Kit test: description "Take care of it", then an Edit call, then mount: role is Builder; with no calls and the clock advanced past T-04: Helper | |
| F-07 | Clicking a sprite offers the roles; the choice applies to that run at once. For a custom agent type it is also remembered across sessions; for the generic and built-in types it is not | Should | Kit test: press, select "tester", then a new spawn of the same custom type is a Tester; the same steps on the generic type leave the next spawn to normal detection | Stored under `role:<agent type>`. Remembering a choice for the generic type would dress every later agent the same |
| F-08 | Each state in the Part 7 motion table draws its pose or animation | Must | Kit test: for each state the mounted row contains the sprite frame id for that state; manual check of each animation in the desktop app | |
| F-09 | The main session is the Lead row, with its own context percent | Must | Kit test: with no agents the pane shows the Lead row and a context figure from stubbed session usage | |
| F-10 | With `autoOpen` at `first` the panel opens when the first agent of a session starts; `always` reopens on every new agent; `never` leaves it to `/possums`. A panel the user closed stays closed for the rest of the session | Must | Kit test: spawn opens the pane once; a close event with a person as origin followed by a spawn opens nothing | **Decided:** default `first` |
| F-11 | A run that ends is Finished when it has an answer, Stopped when it was interrupted, Failed otherwise | Must | Kit test with three stubbed turn endings | Failed plays dead |
| F-12 | An agent whose tool call is waiting on a permission prompt moves to Needs you until the prompt is answered | Should | Kit test, written after spike C fixes the signal | Dropped from version 1 if spike C finds no signal |
| F-13 | Peek shows the brief, the last T-07 actions, the files touched and the first T-09 characters of the answer | Should | Kit test: after seven tool calls Peek lists the last five | Brief shown only if the declarations show it on the spawn event |
| F-14 | With the panel closed, a toast appears when an agent needs the user and when an agent that ran longer than T-10 ends | Should | Kit test: stubbed toast receives one message per case | |
| F-15 | An agent with no event for T-05 and no tool call in flight is shown as gone quiet | Should | Kit test with a mock clock: quiet after T-05; not quiet while a tool call is pending | |
| F-16 | The collapsed view shows only the Lead with one joey per running agent up to T-14, the count as a numeral, and a mark when anyone needs the user | Should | Kit test: four running agents give three joeys and the text "4" | |
| F-17 | With `stepReports` at `tool` or `nudge`, a tool named `step` accepts done, total, an optional label and an optional role; the calling agent's bar shows them. Values are clamped and labels cut | Should | Kit test: a call with done 2, total 5, label "Hero copy" gives a bar reading "2/5 Hero copy"; done 7 of 5 gives 5/5 | The caller is known from the agent id on the tool call |
| F-18 | With `stepReports` at `nudge`, one fixed sentence asking for 3 to 8 step reports is added to each subagent brief | Could | Kit test: the agent tool call passed on carries the sentence once; with `tool` or `off` it is unchanged | Needs spike D. May not ship (Appendix C item 6) |
| F-19 | A tool named `plan`, deferred, lets the main session declare planned tasks (title, optional role, optional "after"); they appear under Planned and leave it when an agent starts with the same title | Could | Kit test: two planned tasks, one spawn with a matching description leaves one | |
| F-20 | The header shows plan-limit percent from session usage. With `cost` at `estimate` rows and header also show a dollar estimate labelled "est." | Should | Kit test: stubbed usage with a 40% limit shows "40%"; with `cost` off no currency sign appears anywhere | **Decided:** subscription numbers lead; `cost` defaults to off |
| F-21 | With reduced motion (the `motion` setting off, or the system signal if spike A finds one) every sprite is drawn as a still pose, with no animation elements in its SVG | Must | Kit test: with `motion` off no mounted `Svg` string contains an animation element | |
| F-22 | In the terminal the panel draws the same sections and numbers as text rows with a coloured mark per state and block-character bars, and no element the terminal cannot draw | Must | Kit test: mounting with the terminal surface validates and contains no `Svg` | **Decided** |
| F-23 | The run list survives a mod reload and resets with the session on clear, resume or branch | Must | Kit test: state persists across a reload; after a clear-type session start the list is empty | |
| F-24 | An agent started by another agent is nested under it and its totals roll up into the parent | Could | Kit test: a spawn carrying a parent agent id is drawn under that run, and the parent's totals include it | |
| F-25 | The interface is available in English and Ukrainian; `language` at `auto` follows Claude Code's language, then the system locale, then English | Should | Kit test: with `language` `uk` no English string from the string table is drawn | Appendix C item 3 |
| F-26 | `/possums roles` opens a gallery of every role and every state of the current set, each with its role name and its costume name | Should | Kit test: the gallery holds 17 roles and 8 states on both surfaces | The legend for users, and the harness for checking sprites by hand on an installed release (Part 8) |
| F-27 | Outfits come from a set. The `theme` setting picks it and the panel redraws at once. Four sets are drawn: `classic` (the default), `steampunk`, `horror`, `prehistoric`. A set is a folder of layers and one manifest entry, with no code change; a role a set lacks falls back to `classic`. Role names never change with the set; each set adds a costume name per role | Must | Unit tests: every set has 17 outfits, 17 props and 17 costume names; switching `theme` changes every sprite and no role name; a fictional set of two roles falls back to `classic` for the other fifteen | **Decided** (owner): the three extra sets, so the switching can be tested on real art. **Proposed:** all four ship in version 1 (Appendix C item 12) |

**Non-functional requirements**

| ID | Requirement | Target | How verified |
|---|---|---|---|
| N-01 | Tokens added to any request with default settings | 0 | `claude plugin validate` lists no tool registration and no prompt hooks reachable with `stepReports` off; kit test that session start registers only the command |
| N-02 | Size of one sprite as an SVG string, animation included | Under 16,000 characters (the element limit is 131,072, *Verified*) | Unit test over every role and state. *Measured* on the first pass, one still frame, all four sets, one rectangle per run of same-coloured pixels in a row: 3,762 to 8,726 characters, 65 to 153 rectangles |
| N-03 | Timers while the panel is closed, or open with nothing running | 0. The only timer the mod ever sets is the one-second clock for elapsed time | Kit test with a mock clock |
| N-04 | Redraws spent on animation | 0. Sprites animate inside their own SVG; the pane redraws on events and once a second for elapsed time | Kit test: with three agents working, at most one invalidation per mock second |
| N-05 | Time to build the pane tree for 20 rows | Under 10 ms on the owner's Mac | Timed in the M3 manual check |
| N-06 | Sprites and text readable on the app's dark and light themes | Every palette colour used on a sprite edge has a contrast of at least 3:1 against its theme background, or the one-pixel outline is drawn | Unit test over palette and backgrounds; manual look on both themes |
| N-07 | Hook time per event | The mod's own work under 5 ms; it never waits on anything but `next` | Code review rule; no awaited call other than `next`, state and store in event hooks |
| N-08 | Supported Claude Code | The version pinned at M1 or later; the README names the tested version | Release checklist |

**Invariants**

| ID | Never | Enforced by |
|---|---|---|
| I-01 | An engine event is changed, denied or answered by the mod. The only exceptions are its own command, its own tools, and the brief sentence when `stepReports` is `nudge` | Kit test: for each hooked event the result equals what the stub returned |
| I-02 | The mod calls anything outside the allow-list in Part 8 (no network, process, file, model, prompt-submit, MCP or cross-session call) | The gate's validate stage prints the calls the mod makes. The mod's architecture document lists the allowed ones, and a change to that line is the owner's decision, recorded in the session's done-note |
| I-03 | Text from briefs, answers, file paths or tool arguments is written to the store or to a log | All store writes go through one function whose payload type holds only role names, agent type names and panel flags; unit test |
| I-04 | Agent-supplied text is drawn through anything but a plain text element (never SVG, never Markdown) | Unit test on the view builders; sprites are built from the mod's own data only |
| I-05 | A fault in the mod blocks or alters a turn | Every event hook body is wrapped; on error it passes the event on. Kit test with a deliberately malformed event |
| I-06 | A state is shown by colour or sprite alone | Kit test: each row contains its state word |
| I-07 | An outfit changes after the role is settled, except by the user's own reassignment | Unit test on the role engine |
| I-08 | Art or code from another mod, or any likeness of another party's mascot or of a film, game or cartoon character, enters the repository | Review rule; all sprites originate from `art/` in this repository |

**Tunables**

| ID | Name | Default | Range | Set in |
|---|---|---|---|---|
| T-01 | Animation step (the duration of one frame of a SMIL loop) | 200 ms | 100-500 ms | `hooks/config.ts` |
| T-02 | Sprite scale on desktop | 2 (64 px) | 1-4 | `hooks/config.ts` |
| T-03 | Weak tool calls (reads, searches) before a role settles as Scout | 6 | 3-12 | `hooks/config.ts` |
| T-04 | Time without a settling rule before a role settles as Helper | 60 s | 10-300 s | `hooks/config.ts` |
| T-05 | Gone quiet after | 90 s | 30-600 s | `hooks/config.ts` |
| T-06 | Finished rows kept | 30 | 10-200 | `hooks/config.ts` |
| T-07 | Actions kept for Peek | 5 | 3-20 | `hooks/config.ts` |
| T-08 | Context badge from | 80% | 50-95% | `hooks/config.ts` |
| T-09 | Answer preview length | 600 characters | 200-2000 | `hooks/config.ts` |
| T-10 | Finish toast only for runs longer than | 60 s | 10-600 s | `hooks/config.ts` |
| T-11 | Context window per model, with a default | dated table | - | `hooks/data/models.ts` |
| T-12 | Price per model for the estimate | dated table | - | `hooks/data/prices.ts` |
| T-13 | Pane width requested | 46 columns | 36-70 | `hooks/config.ts` |
| T-14 | Joeys drawn before the numeral takes over | 3 | 1-5 | `hooks/config.ts` |

**Constraints & assumptions**

| Item | Status | Verify by |
|---|---|---|
| Mods run and draw in the desktop app's Code tab and in the terminal | Verified, mods overview, 2026-11-14 | done |
| The desktop app draws `Svg` and has no raster or image element; the terminal has no `Svg` | Verified, mods reference, 2026-11-14 | done |
| A visible pane redraws at most 30 times a second | Verified, mods reference, 2026-11-14 | done |
| Model request and turn-end events carry an agent id for subagents and per-request token usage | Verified, events guide, 2026-11-14 | done |
| Tool-call events fire for subagent calls | Verified, events guide, 2026-11-14 | done |
| Tool-call events carry an optional agent id, absent for the main conversation | Verified in the repository (code typed against the 2.1.310 declarations) | done |
| The spawn event carries a description, the tool-use id and a parent agent id | Verified in the repository (code typed against the 2.1.310 declarations) | done |
| The spawn event carries the agent type, the model, the effort and the brief | Assumed | M0, read from the declarations |
| A mod can tell that a subagent's call is waiting on a permission prompt | Assumed | M0, spike C |
| A hook on the agent tool's call can add text to the brief | Assumed (hooks may pass changed arguments on, *Verified* in general) | M0, spike D |
| Session usage returns plan limits on a subscription | Shape verified; values assumed | M0, spike E |
| The desktop app runs SMIL animation inside an `Svg` | Verified in the repository: another mod there animates with SMIL alone, played by hand on desktop engines 2.1.308 and 2.1.325, in conversation rows and in the strip above the prompt | done |
| The same holds inside a pane, for a dozen sprites at once; and how a pane sizes an `Svg` | Assumed | M0, spike A |
| A reduced-motion signal is readable by a mod | Assumed | M0, spike A |
| An unpushed build is tried in a terminal session started with the mod's folder as a plugin directory; the desktop app runs only the installed release | Verified, the repository's rules, 2026-11-15 | done |
| The desktop app lets a user edit a plugin's manifest settings | Assumed not; settings are kept in the store instead (Part 6) | M0 |
| The API declarations of the running build are the authority over the documentation; they are laid beside the mod by the repository's `npm run types` | Verified, the repository's rules, 2026-11-15 | done |
| Only the hooks module file may use the mods API; it imports only its own files by relative path; no Node APIs or packages | Verified, create guide, 2026-11-14 | done |
| No other mod is called Possum Squad or uses `/possums` | Assumed (one web search, 2026-11-14) | M7 |

---

## Part 6: Data & Content Model

**Domain model**

- **Session.** One per Claude Code session: the Lead record (context tokens, window, percent; tokens; plan limits), the list of runs, the planned tasks, the view flags.
- **Run.** One per agent start: id (the agent id), parent id if known, agent type, description, brief if known, round, role, role source (stated, remembered, type, name, keywords, tools, fallback, manual), state, model, effort, start and end time, tokens (in, out, cache read, cache write), size of the last request, steps (done, total, label) if reported, activity (tool, one-line summary, time), last T-07 actions, files touched, answer preview, tool calls in flight.
- **Planned task.** Title, optional role, optional list of titles it waits for.
- **Role memory.** Custom agent type to role, set only by the user's reassignment (F-07). Never kept for the generic or built-in types.
- **Panel preferences.** Collapsed, Finished open.

A run moves: planned, starting, working, then back and forth through needs-you and quiet, and ends in finished, failed or stopped.

**Roles and outfits** (**Decided**, delegated: the roster of seventeen. **Decided**, owner: the outfits below, which are the `classic` set, as drawn in `research/sprites/`)

| Role id | The work | Outfit |
|---|---|---|
| `lead` | the main session | king: gold crown with jewels, red robe with an ermine collar and front, sceptre |
| `scout` | finding files, searching code | explorer: pith helmet, khaki vest, green neckerchief, flashlight with a beam |
| `planner` | plans, architecture | architect: plaid flat cap, pencil behind the ear, brown waistcoat, red bow tie, blueprint roll |
| `builder` | writing and editing code | yellow hard hat, orange hi-vis vest, tool belt, hammer |
| `tester` | writing and running tests | lab coat with pocket pens, goggles on the forehead, bubbling flask |
| `bugcatcher` | debugging, root cause | green bucket hat, khaki vest, butterfly net with a bug in it |
| `reviewer` | code review, critique | critic in evening dress: maroon top hat with a gold band, monocle on a chain, maroon coat with a dark bow tie, checklist board |
| `researcher` | web search, reading docs | mortarboard with a gold tassel, gold-rimmed glasses, green cardigan, maroon scarf, open book |
| `operator` | shell, builds, CI, setup | engineer: striped cap, denim overalls, big wrench |
| `courier` | commits, pull requests, releases, messages | blue postal cap with a red band, blue uniform, satchel, envelope |
| `writer` | docs, prose, summaries | bard: purple cap with a white plume, ruff collar, purple doublet, scroll |
| `artist` | UI, visuals, assets | red beret, striped shirt, red neckerchief, palette and brush |
| `analyst` | data, numbers, logs | bookkeeper: green eyeshade, brown waistcoat, red tie, bar chart on a board |
| `guard` | security review | agent in black: dark glasses, earpiece, black suit and tie, padlock |
| `janitor` | refactor, cleanup, format, migrate | polka-dot bandana, green apron, tall broom |
| `pilot` | driving a browser or the computer | aviator: leather flying cap with goggles, bomber jacket, red scarf, a mouse-pointer arrow |
| `helper` | anything unrecognised | orange bobble hat, backpack straps, red toolbox |

**The other sets** (**Decided**, owner: the three themes; costumes as drawn in `research/sprites/`). Each cell is the costume name, then the prop. Every one is the same opossum in a costume, so the body and the state poses are unchanged. All are generic types: no design is taken from a film, game or cartoon (I-08). In `prehistoric` the plain tunics are one-shoulder hides with a ragged hem, so the set reads as one wardrobe.

| Role id | `steampunk` | `horror` | `prehistoric` |
|---|---|---|---|
| `lead` | Inventor-in-chief: tall top hat with goggles and a brass cog, tailcoat, brass speaking trumpet | Vampire count: high-collared cape with red lining, medallion, goblet | Tribe chief: feather headdress, skull staff |
| `scout` | Aeronaut: goggled helmet, brass spyglass | Werewolf costume, lantern | Hunter: horned skull hat, cheek paint, flint spear |
| `planner` | Draughtsman: bowler with a brass band, handlebar moustache, open blueprint | Fortune teller: headscarf, crystal ball | Henge planner: two tall feathers, bone necklace, tablet with a henge diagram |
| `builder` | Boilermaker: leather apron, welding goggles, rivet hammer | Stitched creature: flat hair, neck bolts, patched jacket, big mallet | Mason: stone hard hat, stone hammer |
| `tester` | Chemist: brass goggles, bubbling retort on a stand | Mad scientist: wild grey hair, goggles, sparking flask | Wheel inventor: headband, square stone wheel |
| `bugcatcher` | Collector: boater, net with a clockwork beetle | Monster hunter: wide hat, net with a bat | Dragonfly catcher: leaf hat, vine net |
| `reviewer` | Inspector: deerstalker, magnifying glass | Grim reaper: hood, scythe | Elder: headband, long beard, tally tablet |
| `researcher` | Professor: smoking cap, spectacles, tome | Plague doctor: beak mask, grimoire | Fossil digger: shell hat, dinosaur egg |
| `operator` | Stoker: checked cap with goggles, overalls, steaming valve wheel | Lab assistant: hump, ragged cowl, squint, big lever | Firekeeper: antler headdress, campfire |
| `courier` | Rocket postman: postal cap, twin brass rockets, letter | Bat costume with wings, letter | Pterodactyl costume with wings, stone letter |
| `writer` | Typist: eyeshade, brass typewriter | Ghost writer: bedsheet ghost, quill | Carver: leaf wreath, glyph tablet and chisel |
| `artist` | Photographer: tam, smock, bellows camera on a tripod | Sugar skull: three-flower crown, marigold eye rings, skeleton suit, palette | Cave painter: ochre prints, painted slab |
| `analyst` | Clerk: green waistcoat, watch chain, eye loupe, adding machine with paper tape | Mummy: wraps, hieroglyph tablet | Stegosaurus costume with back plates, pebble abacus |
| `guard` | Diver: brass helmet with a porthole, giant key | Gargoyle costume: horns and wings, padlock | T-rex costume, bone club |
| `janitor` | Chimney sweep: sooty cap, scarf, round brush | Gravedigger: floppy hat, shovel | Sweeper: hide bandana, leafy-branch broom |
| `pilot` | Airship pilot: flying cap, scarf, ship's wheel | Witch: pointed hat, broomstick | Driver: bone goggles, stone steering wheel |
| `helper` | Tin wind-up: funnel hat, tin body with a gauge, wind-up key on the back, oil can | Pumpkin kid: pumpkin hat, candy bucket | Cave kid: bone in the hair, basket |

**Role detection** (F-05). Rules run in this order and stop at the first hit.

1. **Stated.** A role in a step report.
2. **Remembered.** The role the user picked for this agent type, for custom types only.
3. **Built-in type.** The explore type is `scout`; the plan type is `planner`.
4. **Custom agent name.** A custom type's own name, split into words and read by rule 5. The generic types (`general-purpose`, `claude`, `fork`) are skipped.
5. **Description.** Three passes over the task description:
   - a. *Security words anywhere* settle `guard`.
   - b. *The leading verb.* The first word settles the role when it is a strong verb (plan, review, test, debug, refactor, commit, research, analyze, document, deploy and their families). "Design" and its family are an artist's unless the object is a system (API, schema, architecture, database), which is a planner's.
   - c. *Keywords anywhere,* in a fixed order from the specific to the general, ending with `scout` words (find, search, locate) and then `builder` words (implement, add, fix).
6. **First tool calls.** A decisive tool settles the role at once: an edit or write is `builder`, a web search or fetch is `researcher`, a browser or computer-control tool is `pilot`, a shell command that runs a known test runner is `tester`, one that commits, pushes, tags or opens a pull request is `courier`. Reads and searches are weak evidence: T-03 of them with nothing decisive settle `scout`. Any other shell command is no evidence.
7. **`helper`,** at T-04 with no rule fired.

The word lists, their order and the matching rules (whole words, stems, phrases, case ignored) live in one place: `research/roles/role_engine_reference.py`, a dependency-free reference that the build ports to `hooks/roles/` without changing behaviour. The corpus beside it is the test.

Why the leading verb: task descriptions are three to five words and start with a verb. Matching keywords in a fixed order alone reads "Document the test setup" as a tester's job and "Research testing frameworks" likewise. Rejected: keyword order only (the starting design; it got those wrong), and a small-model call (decision 4).

**Sprites** (**Decided**, delegated: size; *Measured* figures from the first pass)

- Canvas 32 by 32 pixels, drawn at T-02 (64 px on desktop). The opossum body sits in a 24 by 24 region at offset (4, 7), which leaves seven rows above the ears for headgear and four columns each side for props.
- One body, shared by every set. Each role adds two layers from the current set: the outfit (everything worn) and the prop. The outfit moves with the body; the prop has its own per-frame offset.
- **Sets.** A set dresses all seventeen roles as one collection. It is a folder of 34 layers and one manifest entry holding its title and a costume name per role; the body, the state extras, the recipes, the role ids and the role names belong to no set. Four sets are drawn: `classic`, a storybook mix kept as the owner chose it, and three themed ones, `steampunk`, `horror` and `prehistoric`. More can follow as art only. A fifth, `modern`, is drawn and parked outside the build.
- Frames are composed by recipe, not drawn one by one: a recipe names a body transform (shift, flip), an eye variant, the prop offset and any state extra (sign, "z", "!"). All states in Part 7 are recipes.
- One shared palette, at most 40 colours. The first pass uses 32 across the four sets.
- A sprite is 65 to 153 rectangles and 3,762 to 8,726 characters as SVG, one rectangle per run of same-coloured pixels in a row.
- The first pass is already exported in the build's input format: `research/art/` holds `base.png`, `extras/`, `palette.json`, `sets/<set>/outfits/<role>.png`, `sets/<set>/props/<role>.png` and `manifest.json` (canvas, offsets, the sets and their layers, per-role prop movement, a recipe per state). All layers are 32 by 32 and already positioned; composing base, outfit and prop reproduces each drawn sprite exactly (*Measured*: 68 of 68).

**Names that never change**

Fixed before M1. Data, settings and other people's workflows will depend on them.

| Kind | Name |
|---|---|
| Plugin name | `possum-squad`: the folder `mods/possum-squad/`, the manifest name and the install id `possum-squad@claude-code-mods` |
| Command | `possums`, with the words `open`, `set`, `settings`, `roles` |
| Pane id | `possum-squad` |
| Tools and their fields | `step` (done, total, label, role); `plan` (tasks: title, role, after). Claude sees them as `mcp__possum-squad__step` and `mcp__possum-squad__plan` |
| Settings | `language` (auto, en, uk); `autoOpen` (never, first, always); `stepReports` (off, tool, nudge); `cost` (off, estimate); `motion` (auto, off); `theme` (classic, steampunk, horror, prehistoric). Kept in the store under `prefs`, changed with `/possums set` |
| Set ids | `classic`, `steampunk`, `horror`, `prehistoric` |
| State keys | `runs`, `lead`, `planned`, `view` |
| Store keys | `role:<agent type>` (custom types only), `prefs` |
| Role ids and state ids | as listed in this part and in Part 7 |

**Data lifecycle**

- Runs, the Lead record and planned tasks live in session state only. They end with the session and are never written anywhere (I-03).
- Role memory, settings and panel preferences live in the plugin's store on the user's machine, keyed by the plugin's install id, so a renamed plugin starts with none. Claude Code removes an unused store after its own cleanup period (*Verified*).
- Nothing is sent anywhere. There are no accounts and no third parties.

**Import / export & portability**

None. The only durable data is a handful of role choices.

**Content & defaults**

Four sets of seventeen outfits, two layers each, with a costume name per role per set; one body; four state extras (sign, "z", "!", joey); a recipe per state; a string table of roughly 140 strings per language, 68 of them costume names; the keyword table; the model window table; the price table.

---

## Part 7: Experience Design

### UX & visual

**Design principles**

1. The panel is quiet; the opossums are the only loud thing in it.
2. Order is meaning: whoever needs the user is on top.
3. Words back every picture (I-06).
4. Nothing moves unless something is happening.
5. Defaults over settings: it works with none touched.

**Visual direction**

Chunky pixel sprites at a whole-number scale on the app's own panel surface. Text, bars and dividers use the app's theme colours, so the panel looks native in both themes; all strong colour belongs to the outfits. A panel shows one set at a time. Each role owns a silhouette (its headgear and prop) and a signature colour, so roles differ even at a glance from the side of the eye.

**Key screens & flows**

The row, desktop:

```
+--------+  Build the landing page                      working
| sprite |  Builder - <model> - <effort>
| 64 px  |  editing src/pages/landing.tsx
+--------+  [=========-----] 3/5 Hero copy   ctx 4% - 38k - 0:26
```

The panel:

```
Possum Squad                                    [collapse]
[Lead sprite]  Main session   ctx 31%
limits 40% - 254k tokens - 4:12
Needs you - 1
  ...row...
Running - 2
  ...rows...
Finished - 3  [show]
Planned - 1
```

Collapsed: the Lead sprite with joeys, the running count, and "1 needs you" when true.

**Design system & components**

The app's own elements only: boxes, text, buttons, and `Svg` for sprites on desktop. No custom controls. Hover and focus follow the app.

**Motion & feedback**

Each sprite animates inside its own SVG with SMIL, so animation needs no timer and no redraw (N-04). Each recipe below becomes a SMIL loop with steps of T-01; with motion off the same SVG is written without them (F-21).

| State id | Shown as | Recipe |
|---|---|---|
| `planned` | sitting, greyed | idle frame at reduced colour, still |
| `starting` | arrives plain, then dressed | slide in over 3 ticks; when the role settles, one hop (up 2 px for a tick) and it lands wearing the outfit |
| `working` | work loop | 2-frame body bob; the prop moves against the body by its own offset; a blink every few seconds |
| `needs-you` | holds a "?" sign | sign held up, bobbing; row moves to Needs you |
| `quiet` | dozing on its feet | eyes closed, slow bob; state word in amber |
| `finished` | cheer, then asleep | two hops, then eyes closed with a rising "z"; still after 3 s |
| `failed` | plays dead | flipped on its back, tongue out; still |
| `stopped` | startled | wide eyes and "!" for 1 s, then idle, still |

A context badge at T-08 is text on the row, with no animation.

**Style guide reference**

`research/sprites/`: for `classic`, `roles-dark.png`, `roles-light.png`, `roles-at-panel-size.png` and `squad-preview.gif`; for each other set, `roles-<set>-dark.png`, `roles-<set>-light.png` and `squad-<set>-preview.gif`; all four at panel size in `sets-at-panel-size.png`; the state poses in `states-dark.png`; and the scripts that drew them (`sprites-first-pass.py` and one `set_<id>.py` per extra set). The layers themselves are in `research/art/`.

### Both variants

**Voice, tone & microcopy**

Plain, short, lower-key than the art. The opossums are funny; the words are not trying to be. No exclamation marks, no jokes in error text.

| Situation | Good | Bad |
|---|---|---|
| Empty panel | No agents yet. They show up here when Claude starts one. | Your squad is snoozing! Wake them up with a task! |
| Failed run | Failed: ended without an answer | Uh-oh, this little guy didn't make it |
| Needs you | Needs you: waiting on a permission prompt | ACTION REQUIRED |
| Gone quiet | Quiet for 2 min | Possibly stuck? |
| Estimate | est. $0.25 | $0.25 |

Ukrainian follows the same tone: "Чекає на вас", "Працюють", "Завершили", "Не вдалося: завершив без відповіді", "Мовчить 2 хв".

---

## Part 8: Technical

**Trade-off order**

Never alter Claude's work > show the truth > zero token cost > boring permissions > simplicity > charm > features.

**Stack & architecture**

| Layer | Choice and pinned version | Rejected alternative, and why |
|---|---|---|
| Form | A Claude Code mod. Minimum Claude Code version pinned at M1; 2.1.287 is the documented floor (checked 2026-11-14) | A settings hook with a status line: cannot draw a pane. An MCP server: cannot see engine events |
| Language | TypeScript, loaded by Claude Code directly; no bundler, no packages | A bundled build with dependencies: a hooks module cannot import packages, and a build step would add a toolchain for nothing |
| Drawing | Element trees for the `Pane` site; each sprite is one `Svg` string animated with SMIL, built from the mod's own data and cached per set, role, state and theme | Redrawing frames from a timer: a timer and several redraws a second for what SMIL does for nothing. The `Client` region: a second file with no mods API; kept as the fallback if spike A shows SMIL misbehaving in a pane |
| Art source | PNG layers and `manifest.json` in `art/`, seeded at M3 from `research/art/`, with Aseprite files beside them once a sprite is polished; a converter in the mod's `tools/` writes `hooks/sprites/data.ts`, which is generated, committed, and formatted like any source file | Aseprite files as the only source: every build would need Aseprite. Text grids as the source: cannot be polished in a pixel editor |
| Art tool | A dependency-free TypeScript script run by the repository's Node (26 or later), reading PNG with Node's built-in zlib (Appendix C item 8) | Python with Pillow, which drew the first pass: a prerequisite the repository does not have (its only ones are Node and the Claude Code CLI). A PNG package: a new dependency in a pinned toolchain |
| State | Session state atoms for runs; the plugin store for role memory and preferences | Module variables: lost on every reload. Files: breaks I-02 |
| Role engine | An ordered rule table and a pure function, ported from the Python reference in `research/roles/` | A small-model call per spawn: guesses better, but spends the user's plan and adds delay for a cosmetic choice |
| Tests | `claude plugin test` with the `claude-code/testing` kit | A separate test runner: cannot raise engine events |

Tests run on the kit's mocked engine, not in the app. The kit checks the tree a hook returns, not how the app paints it (*Verified*), so painting and animation are checked by hand (Part 12).

Boundaries, with dependencies pointing one way:

The layout is the repository's: the plugin is `mods/possum-squad/`, started from its mod template, and every file the hooks module imports is inside that folder.

- `hooks/register.tsx` is the only file that uses the mods API. It hooks events, turns each into a plain record, calls the pure modules, writes state, opens the pane and returns the tree. Claude Code's static analysis requires this (*Verified*), and it is wanted anyway: when event shapes change, one file changes.
- `hooks/model/` is pure: event records in, run list and totals out.
- `hooks/roles/` is pure and table-driven.
- `hooks/view/` holds functions that take data, the resolved elements and callbacks, and return trees: one for desktop, one for the terminal.
- `hooks/sprites/` holds the recipe table, the compositor, the SVG writer and the cache.
- `hooks/i18n/` holds the string tables. `hooks/data/` holds the dated model and price tables. `hooks/config.ts` holds the tunables.

Rejected: one module that draws straight from events, as small mods do. The mods API is new and can change between releases; the churn has to land in one place.

Mods API allow-list (I-02): `$.ui.resolve`, `$.ui.invalidate`, `$.ui.open`, `$.ui.close`, `$.ui.toast`, `$.command.register`, `$.tool.register` (only when `stepReports` is on), `$.state` through its helpers, `$.store.get`, `$.store.set`, `$.store.delete`, `$.clock.every`, `$.clock.now`, `$.session.usage`, `$.agent.list`, `$.settings.read`.

Events hooked: `session.start`, `classic.SessionStart`, `agent.spawn`, `turn.start`, `turn.step`, `turn.complete`, `tool.call`, `session.measure`, `command.run`, `ui.render` for the pane, `ui.close`, and whichever event spike C names for the permission wait.

**Platform targets & performance**

Claude Code desktop app on macOS first; Windows and Linux builds of the app are expected to work and are not tested by the owner. Budgets: N-02 to N-05, N-07.

**Storage & sync**

Local only. The store is shared by every session on the machine and a read-then-write is not atomic (*Verified*), so each remembered role is its own key and no value is built from a stale copy. No sync, no migration; an unknown store value is ignored.

**External systems**

| System | What crosses the boundary | Version / API | How it fails | What we do then |
|---|---|---|---|---|
| Claude Code mods API | Events in; trees, state and store calls out | Pinned at M1 | An update renames or reshapes an event or method; the engine skips a failing hook | The adapter ignores shapes it does not know and keeps the last good data (I-05); the README names the tested version; the fix lands in one file |
| Desktop pane renderer | Element trees | Same | A tree that does not validate is replaced by the engine's own drawing; many `Svg` redraws stutter | Drawing tests on both surfaces; fall back to still poses or to the `Client` region |
| Plugin store | Role memory, preferences | Same | Two sessions write at once; 4 MiB cap | One key per item; values are a few bytes |
| Plugin marketplace (the owner's mods repository) | The plugin's files | Git | Installed copies are cached by version | Every release increments the version |

**Security & privacy**

The mod collects nothing and sends nothing. Session data stays in memory; the store holds role choices and two flags. A mod runs unsandboxed with the user's permissions, so the answer to "what can this do?" has to be short and provable: the allow-list above, printed in the README from `claude plugin validate`.

| Threat | Mitigation | Residual risk |
|---|---|---|
| A user cannot tell what the mod can do | Validate output in the README; allow-list check at release (I-02) | Users must trust the listing; accepted |
| Agent-supplied text (description, step label) carries markup or a link | Drawn as plain text only, cut to length (I-04) | None known |
| An agent floods step reports | Values clamped; redraws are coalesced by the app; nothing is stored | Wasted tokens are the agent's own; accepted |
| The nudge changes how agents behave | Off by default; one fixed sentence; documented; may not ship | Real; Appendix C item 6 |
| A Claude Code update makes the panel show wrong data | Unknown shapes are dropped, not guessed | The panel may go stale until fixed; accepted |
| A lookalike mod under the same name | Published from the owner's repository only; name check before release | Marketplace-level; accepted |

**Build, release & operations**

The mod lives in `mods/possum-squad/` of the owner's mods repository, which is also the marketplace it installs from. The repository is private until the owner publishes it. Its rules bind the build: the session workflow at the mod's level, the gate (`npm run verify -- possum-squad`: the repository stages, then validate, types, tests and imports for the mod), hygiene, and a push or tag only with the owner's approval, each time. Nothing changes the owner's Claude Code setup without asking. There is no build step for the mod itself; sprite data is generated by the converter and committed. An unpushed build is tried in a terminal session started with `claude --plugin-dir mods/possum-squad`, which shows the text fallback only. The desktop app runs the installed release, so sprites, animation and both themes are checked by hand after a push, with the gallery (F-26) as the harness. Kill switch for a user: disable the plugin; `autoOpen` at `never` keeps it out of the way without disabling it. Rollback: the previous version.

**Technical risks**

| Risk | Fallback |
|---|---|
| SMIL does not run inside a pane, or a dozen animated sprites stutter there (spike A) | Animate only running rows; the `Client` region; last resort still poses |
| Desktop drawing can only be seen after a push | The gallery early (M3); small releases; kit tests and the terminal fallback carry everything else |
| The desktop app's engine and the CLI the gate runs are different builds | Record both versions in every done-note; check by hand on the installed release |
| No signal for a permission wait (spike C) | F-12 is dropped; gone-quiet is the only attention state |
| The brief cannot be changed from a hook (spike D) | F-18 is dropped; `stepReports` has two values |
| Roles are wrong too often on real sessions (H1) | Add the misses to the dev set and tune the table; if still under three in four, use type, name and the user's choices only |
| Mods API churn | Adapter in one file, pinned version, kit tests |

---

## Part 9: Analytics & Telemetry

**Success metrics**

No telemetry of any kind. Success is judged by the hypotheses in Part 12 on the owner's own use, and after release by issues and installs visible on the repository.

**Privacy constraints**

Nothing is collected. This part has no event model and no dashboards.

---

## Part 10: Localization & Compliance

**Localization scope**

English and Ukrainian at release (F-25; Appendix C item 3).

**Internationalization readiness**

All strings in `hooks/i18n/`, one table per language, with a test that every key exists in both. Ukrainian plural forms (one, few, many) through one small function. Times and token counts use fixed short forms. No right-to-left layout in version 1.

**Legal & data compliance**

No personal data leaves the machine, no accounts, nothing to consent to.

**Store & platform review**

No store. Distribution is the owner's mods repository as a plugin marketplace, private until the owner publishes it. Submission to Anthropic's plugin directory is optional (Appendix C item 5). A plugin name must not look like one of Anthropic's own (*Verified*); `possum-squad` does not.

**Licensing**

**Decided:** MIT for code and sprites. No runtime dependencies. No other mod's code or art is used (I-08).

---

## Part 11: Business & Operations

**Business model**

Free and open source.

**Support & feedback**

Issues on the repository. No response promise.

**Roadmap**

After version 1, by theme: the workflow contract (planned list, nested helpers); community outfits (a documented layer format so others can add roles); terminal sprites.

---

## Part 12: Validation & Quality Plan

**Key hypotheses**

| # | Hypothesis | How we'll test it | Success signal | Status |
|---|---|---|---|---|
| H1 | Roles can be guessed from what a mod sees for free | A week of the owner's real sessions from M4; every reassignment click counts as a miss | At least three outfits in four right | Open |
| H2 | A pane animates a dozen sprites smoothly | Spike A. SMIL in a desktop `Svg` is already verified in the repository; open are the pane and the count | No visible stutter; the app stays responsive | Open |
| H3 | The panel earns its space | Two weeks of own use after M5 | Still open in most sessions | Open |
| H4 | A permission wait is visible to a mod | Spike C | A named signal, shown in the spike notes | Open |
| H5 | Step reports are worth their tokens | A week with `stepReports` at `tool` in the owner's own workflow | Bars are right; no noticeable change in plan-limit use | Open |
| H6 | The outfits are distinct at panel size | The owner names each role from `roles-at-panel-size.png` without labels | At least 15 of 17 | Open |

**Discovery & research plan**

Done: the mods documentation (Appendix D). Next, scariest first: spike A, then C.

**Prototype & usability testing**

The spikes are the prototype. The owner is the tester through M6; other people's reactions come from issues after release.

**Quality strategy**

- **Unit tests** (pure modules): the role corpus from `research/roles/` (the build may add cases to the dev set; it never relabels an item and never tunes on the holdout set), the run model replayed from fixture event sequences, the sprite compositor and SVG size, palette contrast, string table completeness.
- **Kit tests** (hooks and drawings): every F- check above marked "kit test", on both surfaces where the row is drawn. They cannot see painting, animation smoothness or real event shapes.
- **Fixtures** are fictional and written from the declarations of the running build. No real session is recorded anywhere, so the mod needs no file access.
- **The repository's practices for every mod apply:** a UI test runs on both surfaces, a test that depends on time pins the clock, every gating hook decides what its failure does, and reach is named in the architecture document.
- **Manual checklist** in the desktop app, on the installed release: each state's animation, both themes, reduced motion, three real agents against the transcript, the panel after clear and after reload. Only one session can run this at a time: it needs the one desktop app with the mod loaded.
- **Release gate:** the repository's full gate is green, the calls line matches the architecture document, and the manual checklist is ticked on the installed release.

**Definition of "validated"**

M0 is complete, and H2 has passed for a pane or the still-pose decision is recorded. Only then does M1 start.

---

## Part 13: Production

**Scope statement**

One pane, one command, at most two tools, 27 requirements of which 14 are Must. Four sets of seventeen outfits. One person directing, build sessions doing the work, sized so that each milestone row below is one to two sessions.

**Team & roles**

- The owner: product, art direction, manual checks, pushes and releases.
- Build sessions: all code and tests, under the repository's workflow.
- Art: first-pass sprites drawn before the build (below); polish in Aseprite where the first pass lacks charm (Appendix C item 4).

**Work done outside the build**

- First-pass sprites for all seventeen roles in all four sets, and the state poses: sheets and the drawing script in `research/sprites/`, the exported layers and manifest in `research/art/`. They are the input to M3, not final art.
- The role engine reference and its labelled corpus: `research/roles/`. They are the input to M4.
- Notes on the mods API as documented on 2026-11-14: `research/mods-api-notes.md`.

**MVP**

The end of M4: real agents as rows with live numbers, every role's outfit with a work loop, roles detected and correctable, finished and failed shown, text rows in the terminal.

**Milestones**

| Milestone | Exit check | Owner tasks | Effort |
|---|---|---|---|
| M0 Skeleton and spikes | The mod stands in `mods/possum-squad/` from the template, with its marketplace entry and a green gate. A spike build, 0.0.1, opens a pane with a dozen SMIL sprites and a text view of the last event shapes. The mod's docs record what it found: SMIL and sizing in a pane, the permission-wait signal, usage values on a subscription, whether a brief can be changed, whether manifest settings can be edited, and the fields read from the declarations. Every Assumed row in Part 5 is marked verified or replaced | Approve the push; install it; run one prompt that starts three subagents and one that triggers a permission prompt; decide go or stop | 2 sessions |
| M1 Panel shell | `/possums` with `open`, `set` and `settings`; the pane draws a fixture list on both surfaces; settings live in the store; the names of Part 6 are in the mod's own rules file | None | 1 session |
| M2 Runs and numbers | Real agents appear as text rows with live numbers, the Lead row and Finished; the terminal fallback is complete. Checks F-01 to F-04, F-09, F-11, F-22, F-23 pass | Run three agents and compare the panel with the transcript | 2 sessions |
| M3 Sprites | `art/` is seeded from `research/art/`; the converter builds the sprite data from it; every role of every set draws its outfit with the work loop on desktop; `/possums set theme` switches sets; the gallery shows the current set; reduced motion works. Checks F-21, F-26, F-27, N-02 to N-06 pass | Approve the push; art review of each set in the gallery; decide what goes to polish | 2 sessions |
| M4 Roles (MVP) | The role corpus passes (F-05); arrival and dressing work; reassignment works and is remembered for custom types. Checks F-05 to F-07 and I-07 pass | Start the week of use for H1 | 1-2 sessions |
| M5 States and attention | Every state animates; auto-open, toast, collapsed view and Peek work. Checks F-08, F-10, F-12 to F-16 pass | Trigger each state by hand | 2 sessions |
| M6 Reports and limits | The `step` tool, the plan-limit meter and the cost estimate work. Checks F-17 and F-20 pass (F-18 if kept) | A week with `stepReports` at `tool` for H5 | 1-2 sessions |
| M7 Release | Ukrainian strings, README with the calls line and tested versions, preview GIF. Release gate green; H1 and H3 judged | Review the Ukrainian strings; name check; publish | 1 session |

**Releases**

Versions follow the repository's rules: each session's version is set in the session plan and lives in the mod's `plugin.json`; round 1 ends at 1.0.0; tags are `possum-squad-v<x.y.z>`, at milestones only. The remote is the owner's mods repository.

**Scope cuts / stretch goals**

Cut first, in this order: F-19, F-24, F-18, the dollar estimate in F-20, F-16, F-25 (English first, Ukrainian in a later release), F-14, F-13, F-15. Stretch after 1.0.0: F-19, F-24, a second set, a finish sound. Never cut: I-01 to I-06, N-01, F-21, F-22, F-27.

**Risks & mitigations**

- **Maintenance.** A public mod on a new API needs fixing after app updates. Mitigation: one adapter file, fixtures renewed against each pinned version's declarations, a README that names the tested versions.
- **Crowded niche.** Mitigation: ship role and attention, which no other panel has.
- **Art time.** Sixty-eight outfits to polish. Mitigation: layers and recipes; polish only what the owner flags at M3.
- **One tester.** Mitigation: the kit tests and the corpus carry correctness; the owner's eyes carry charm.

---

## Appendices

**A. Glossary**

- **Agent, subagent:** a helper Claude starts for a task. **Main session:** the conversation the user types into; on the panel it is the Lead.
- **Run:** one start-to-end life of an agent; one row.
- **Role:** the kind of work an agent is for. **Outfit:** everything a role wears, one sprite layer; its **prop** is a second. **Set:** one collection of outfits and props for all seventeen roles. **Costume name:** what a set calls a role's outfit ("Mad scientist" for the Tester in `horror`); the role name never changes.
- **State:** where a run is in its life (Part 7).
- **Recipe:** the rule that composes a frame from the body, the layers and a transform.
- **Brief:** the task text an agent is given when it starts.
- **Step report:** a call to the `step` tool. **Nudge:** the one sentence that asks agents to report steps.
- **Peek:** the expanded detail of a row. **Joey:** a baby opossum; in the collapsed view, one per running agent.
- **Pane, render site, hooks module, kit:** Claude Code's terms for a side panel, a place a mod can draw, a mod's code file, and its test library.

**B. References**

- Mods overview: https://code.claude.com/docs/en/plugins/mods/overview
- Mods reference: https://code.claude.com/docs/en/plugins/mods/reference
- Draw in the interface: https://code.claude.com/docs/en/plugins/mods/interface
- React to events: https://code.claude.com/docs/en/plugins/mods/events
- Use the mods API: https://code.claude.com/docs/en/plugins/mods/api
- Create a mod: https://code.claude.com/docs/en/plugins/mods/create
- Test a mod: https://code.claude.com/docs/en/plugins/mods/test
- Subagents: https://code.claude.com/docs/en/sub-agents

**C. Open questions**

| # | Question | Recommendation | Owner | Needed by |
|---|---|---|---|---|
| 3 | Ukrainian at release, or English first | Both at release; the string table is small | The owner | M7 |
| 4 | Which sprites go to polish, and when | Decide at the M3 art review, on the real panel, not on a sheet | The owner | M3 |
| 5 | Submit to Anthropic's plugin directory | Yes, after 1.0.0 has a week of use | The owner | After M7 |
| 6 | Does the nudge ship at all | Build it last and keep it only if H5 shows agents ignore the tool without it; it is the one feature that changes what agents are told | The owner | M6 |
| 7 | Collapsed-view joeys | The first-pass joeys are the weakest art; redraw at M5 before judging the idea | The owner | M5 |
| 8 | Where the sprite converter lives, and how the gate treats a Node script inside a mod's folder | In the mod, under `tools/`, outside what the mod's type check and import scan read; the generated module is checked by a unit test. Anything the gate must learn is a repository-level change, made in its own session | The owner | M3 |
| 10 | Which research files enter the repository | This document as the round's design draft; the art layers into the mod's `art/`; the corpus into its tests. The Python references and preview sheets stay outside | The owner | Intake |
| 12 | Do all four sets ship in version 1 | Yes: they are drawn, they are data only, and real sets are the test of switching. Cut whole sets, never single roles, if the M3 review finds one not ready | The owner | M3 |
| 11 | Settings in the store, or in the manifest | The store, with `/possums set`: it works on both surfaces today. Revisit if M0 shows the desktop app edits manifest settings | The owner | M1 |

**D. Living log**

| Date | Insight | Action taken |
|---|---|---|
| 2026-11-14 | Step bars and a planned list need a companion flow skill; generic subagents are tracked from engine events for free | Step reports made an opt-in contract; everything else from events |
| 2026-11-14 | Costumes by model tier repeat what the row already says | Outfits assigned to role |
| 2026-11-14 | Most subagents share one generic type | Role detection by ordered rules, not by type alone |
| 2026-11-14 | The desktop app draws `Svg` and no bitmap element | Sprites shipped as data and written out as SVG rectangles |
| 2026-11-14 | Only the hooks module file may use the mods API | One adapter file, pure modules around it |
| 2026-11-14 | First sprite pass (24 by 24, hat and prop only): the owner liked the opossum and asked for more distinctive outfits | Second pass on 32 by 32 with garment, headgear, extras and prop per role |
| 2026-11-14 | Second pass measured: 31 colours; 4,833 to 7,601 SVG characters per sprite | N-02 set at 16,000 |
| 2026-11-14 | Owner review of the second pass: every outfit liked except the Reviewer's head and gavel (the wig hid the ears and turned the head into a grey block) | Reviewer redrawn as a critic; bow tie darkened and buttons centred at the owner's request |
| 2026-11-14 | Second read: remembering a role per agent type would apply to the generic type, which most agents share | Memory limited to custom types (F-07) |
| 2026-11-14 | Role corpus written and labelled (144 items), reference engine measured: keyword order alone misread verb-led descriptions | Leading-verb pass added; dev 102 of 102 after tuning, holdout 39 of 42 untouched |
| 2026-11-14 | The first pass drew garment, headgear and extras in one pass per role | Two layers per role (outfit, prop), exported as PNG with a manifest; all 17 recompose exactly |
| 2026-11-15 | The repository the mod will live in has a settled layout, gate and workflow, and another mod there already animates desktop `Svg` with SMIL and reads agent ids from tool calls and spawns | Part 8 and Part 13 fitted to it; three spikes shrink to reading the declarations; animation moved from timed redraws to SMIL |
| 2026-11-15 | In that repository the desktop app runs only installed releases | Gallery promoted and moved to M3 as the by-hand harness |
| 2026-11-15 | Owner review: the captain Lead read as a police officer; a wizard Lead was not wanted either | Lead redrawn as a king |
| 2026-11-15 | Owner asked whether the roles could share an era, and for room for themed sets later | Sets added (F-27). A `modern` set was drawn in full (Lead as a coach, eight outfits redrawn) |
| 2026-11-15 | Owner review of the `modern` set: not a fan; the earlier outfits stay | The earlier set ships as `classic`; `modern` is parked as a later set, its layers kept outside the build |
| 2026-11-15 | The owner wants real sets to switch between, so the set logic is tested on art and not only on fixtures: steampunk, horror characters, prehistoric with dinosaur costumes | Three rosters planned and drawn in full (51 outfits); costumes, not creatures, so the shared body and poses hold; a costume name per role per set added to the manifest; the blink recipe moved under the outfit so masks and dark glasses stay whole |
| 2026-11-15 | Owner review of `classic`: all good, but the Guard should be an agent in a black suit | Guard redrawn with the suit, dark glasses, earpiece and padlock first drawn for `modern`; the knight is kept outside the build |
| 2026-11-15 | Owner review of the three new sets: the designs can be better | Refinement pass: props enlarged so they read at panel size, weak silhouettes redrawn (steampunk Helper as a tin wind-up, Stoker, Clerk, Rocket postman; horror Stitched creature, Vampire count, Lab assistant; prehistoric Mason, Hunter, Firekeeper, Counter), one hide tunic shared across `prehistoric`. All 68 sprites still recompose exactly from their layers |
| 2026-11-15 | After the refinement pass three sprites were still weak: the Draughtsman's moustache did not show, the Sugar skull was busy at panel size, the Counter had no clear costume | Moustache moved up beside the nose and the blueprint drawn open; the Sugar skull cut to three flowers and one ring colour; the Analyst of `prehistoric` redrawn as a stegosaurus costume, the set's third dinosaur |

**E. Decision log**

| # | Date | Decision | Rationale | Alternatives considered |
|---|---|---|---|---|
| 1 | 2026-11-14 | Panel plus opt-in step reports; no flow skill (owner) | The owner's workflows already exist; the panel should serve any of them | Panel only: no bars at all. Own flow skill: far larger scope |
| 2 | 2026-11-14 | Outfit by role, not model tier | Model and effort are already text on the row; role is what text cannot say at a glance | Tier costumes |
| 3 | 2026-11-14 | No band above the prompt | Every mod shares the one band; a band's progress content would need a flow skill | Keep the band for the collapsed state: the collapsed view does that job inside the pane |
| 4 | 2026-11-14 | Roles by ordered rules, no model call | A wrong outfit costs nothing; a model call costs plan and delay | A small-model classifier per spawn |
| 5 | 2026-11-14 | Layered outfits, frames by recipe | Art cost is roles plus recipes, not roles times frames; a new role is two layers | A hand-drawn sheet per role: more charm, roughly ten times the work |
| 6 | 2026-11-14 | 32 by 32 canvas at twice size (delegated) | Distinctive outfits need room for tall headgear and a prop beside the body; 64 px matches a four-line row | 16 by 16: no room. 24 by 24: outfits reduce to a hat. 48 by 48: double the art for more than a row can show |
| 7 | 2026-11-14 | Seventeen roles (delegated) | Covers the kinds of work agents are given, with Helper as the plain fallback | Fewer roles: more Helpers. More roles: lower detection accuracy |
| 8 | 2026-11-14 | Subscription numbers lead; dollar estimate off by default (owner) | Limits and context are what a subscriber can act on; price tables go stale | Dollar-first header |
| 9 | 2026-11-14 | The panel opens by itself on the first agent (owner) | Zero-setup first run | Open only on command |
| 10 | 2026-11-14 | Text fallback in the terminal (owner) | A public mod should not be blank for terminal users | Desktop only |
| 11 | 2026-11-14 | Public, open source, MIT for code and sprites (owner) | A portfolio piece others can use and extend | A separate art licence |
| 12 | 2026-11-14 | One file touches the mods API | Required by static analysis, and it confines API churn | Calls spread through view and model code |
| 13 | 2026-11-14 | PNG layer sheets as the art source | Editable in any pixel editor, buildable without one | Aseprite-only; text grids |
| 14 | 2026-11-14 | Session data is never stored | Briefs and answers are the user's work; the panel has no need to keep them | A history log across sessions |
| 15 | 2026-11-14 | Role memory by click only, and only for custom agent types | One obvious way to correct an outfit; a remembered choice for the generic type would dress every agent alike | A settings map from agent type to role as well; memory for every type |
| 16 | 2026-11-14 | The leading verb outranks keywords in a description | Descriptions are short and verb-first; measured on the corpus | Keyword order only; a model call |
| 17 | 2026-11-14 | Two layers per role, outfit and prop | Matches how the first pass is drawn; dressing is one hop, not a falling hat | Four layers (garment, headgear, extras, prop): more files per role for one two-tick animation |
| 18 | 2026-11-14 | Only decisive tools and reads count as evidence; other shell commands do not | Every kind of agent lists directories and checks status | Any shell command settles Operator |
| 19 | 2026-11-14 | The name is Possum Squad, `possum-squad`, `/possums` (owner) | Clear, searchable, says what it is | Possum Posse; Passel |
| 20 | 2026-11-15 | It lives in `mods/possum-squad/` of the owner's mods repository and follows that repository's rules | The repository already settles layout, gate, workflow and release for every mod | A repository of its own |
| 21 | 2026-11-15 | Sprites animate with SMIL inside their SVG | No timer, no redraws, and already proven on the desktop app in the same repository | Timed redraws of whole frames; the `Client` region |
| 22 | 2026-11-15 | Outfits are sets, and sets are data; `classic` ships first (owner) | The owner wants room for themed sets later and prefers the original costumes as the first one | `modern` as the first set: drawn in full, reviewed by the owner and not kept as the default |
| 23 | 2026-11-15 | Settings in the store, changed by command | Works on both surfaces today; whether the desktop app edits manifest settings is unverified | Manifest settings |
| 24 | 2026-11-15 | The sprite converter is dependency-free TypeScript on the repository's Node | The repository's only prerequisites are Node and the Claude Code CLI | Python with Pillow; a PNG package |
| 25 | 2026-11-15 | The gallery is a Should and ships with the sprites | It is the only way to look at every sprite on an installed release | Gallery as a late nicety |
| 27 | 2026-11-15 | Three more sets: `steampunk`, `horror`, `prehistoric` (owner) | Real sets test the switching; each is far enough from `classic` to be obvious at a glance | Fixture sets only; one extra set |
| 28 | 2026-11-15 | A set changes costumes, never role names; it adds a costume name per role | A row must keep its meaning whatever the set; the gallery still needs to say what the costume is | Set-specific role names |
| 29 | 2026-11-15 | The setting is named `theme` | `/possums set set classic` reads badly, and the name cannot change later | `set` |
| 26 | 2026-11-15 | The Lead is a king | The owner rejected a captain (read as a police officer) and a wizard | A coach and an orchestra conductor, both drawn for the `modern` set |

**F. Graveyard**

| Date | Idea | Why it was cut | Could return if |
|---|---|---|---|
| 2026-11-14 | Progress band above the prompt | Decision 3 | The collapsed view proves not enough with the panel closed |
| 2026-11-14 | Model-classified roles | Decision 4 | H1 fails and users ask for an opt-in |
| 2026-11-14 | Stop one agent from the panel | Unclear the API can abort a single subagent; a misclick destroys work | The API gains a safe per-agent stop |
| 2026-11-14 | Rare or seasonal variants | Charm with no information, against pillar 3 | Never as a default; possibly as a community layer pack |
| 2026-11-14 | History log across sessions with per-role totals | Decision 14; logs nobody opens | A real question it answers turns up |
| 2026-11-14 | Sets made by other people, in version 1 | No users yet; built-in sets cover the need (F-27) | After 1.0.0; a set is already only a folder and a manifest entry |
| 2026-11-15 | `modern` as the first set | The owner preferred the original costumes (decision 22) | As a second set; its 34 layers are already drawn |
| 2026-11-15 | A development-only mod that records event shapes | The repository lists every mod in its marketplace and its tests use fictional data | Never; the declarations and a spike build do the job |
