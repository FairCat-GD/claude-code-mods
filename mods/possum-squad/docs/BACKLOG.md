# Backlog

Work that has been named but belongs to no session. Each item needs its own intake before it runs
(a `docs/spec/FEATURE-*.md` with the request verbatim and the decisions resolved, then a block
in `docs/spec/SESSIONS.md`; see the root `docs/DEVELOPMENT-WORKFLOW.md`). When an item is picked
up, it moves out of this file.

## Deferred

- **Step reports.** A `step` tool an agent calls to report done and total, so its row shows a
  real progress bar; the nudge, one fixed sentence added to each brief asking agents to report;
  and a `plan` tool with which the main session lists tasks ahead, shown under Planned. Off by
  default, behind the setting `stepReports` (`off`, `tool`, `nudge`). Their names are reserved.
  Left out at the round 1 intake: they add tokens when on, and the panel works without them.
- **Submitting to Anthropic's plugin directory,** after 1.0.0 has a week of use. Left out at the
  round 1 intake.
- **A preview GIF for the README.** Left out at the round 1 intake.
- **A finish sound.** Left out at the round 1 intake.
- **The `modern` set,** drawn in full before the build and not chosen as the first set; its
  layers are outside the repository. Left out at the round 1 intake.

## Not yet checked by hand

Checks that need a person at the machine. Each has an automated check covering most of it;
these are the parts only a person can see.

## Directions

- **Sets made by other people.** A set is already a folder of layers and one manifest entry; a
  documented format would let others add one.
- **Sprites in the terminal.** The terminal draws text rows; its `Raster` element could carry the
  same art.

## Decided against

- A Ukrainian translation: English only, at the round 1 intake.
- Naming or crediting another mod, in the docs, the README or the code: the owner's word at the
  round 1 intake.
- Roles picked by a model call: a wrong outfit costs nothing, a model call costs the owner's plan.
- A history log across sessions: briefs and answers are the owner's work, and nothing reads it.
- A button that stops one agent: a misclick destroys work.
- A band above the prompt: the collapsed view does its job inside the pane.
- Rare or seasonal variants: charm that carries no information.
