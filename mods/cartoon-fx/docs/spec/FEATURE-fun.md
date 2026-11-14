# FEATURE: fun, a queue, new moments and controls (round 3)

## The request, verbatim (2026-11-14)

> […] please review this repo (maybe you'd like to tweak its structure before we proceed with the
> new plugin development), and review the fx plugin maybe you can improve its functionality
> and/or its art

The request asks for judgement, so the intake began with an audit: `REVIEW-2026-11-14.md` beside
this file, with every drawing rendered and the detection rules run against real output. The
intake proposed four groups of work, and the owner took all four. Their answers follow: the
options they picked, with the intake's "(Recommended)" marks dropped, and their own words
verbatim.

> Which groups of cartoon-fx work should round 3 take? — Art fixes, Effects queue up, Detection
> hardening, New triggers and controls

> How far should the art work go beyond fixing what is broken? — Fix and polish

> With a queue, what should one command that does several things play? — Everything, in order

> Which new moments should play an effect? — can cherry-pick animation show picking a cherry? it
> is fun :) I generally want animations to be fun, you can revise existing ones as well, PR
> opened, PR or branch merged, Cherry-pick, Rebase finished

> Which controls should /fx gain? — /fx off and /fx on, /fx size small|medium|large, Animated
> terminal row

The owner declined one option offered: muting single effects.

## The promise

**The animations are fun,** and every one of them is seen: none is cut off by the next, none
plays for something that did not happen, and none draws wrong.

## Resolved decisions (2026-11-14, at intake)

1. **Round 3 takes all four groups:** the art faults, a queue, detection hardening, and new
   triggers with controls.
2. **Fun is the measure of the art.** Fix what the review found broken, redo the helpers and the
   smoke, and any existing drawing may be revised. New drawings are welcome. A drawing's design
   is settled with the owner in its session's plan mode, from rendered frames, never from a
   description alone.
3. **The cherry-pick shows a cherry being picked.**
4. **One command that does several things plays all of them, in the order the command ran
   them.** `npm test && git commit && git push` plays the checkmark, the stamp, then the
   confetti.
5. **Effects queue instead of replacing each other.** At most three wait behind the one on show,
   and one that has waited too long is dropped, so a burst never plays long after its moment.
   The wait limit is Q1's to propose.
6. **New moments:** a pull request opened, a pull request or branch merged, a cherry-pick, a
   rebase finished. Each is read from the engine's own report of the call (`gitOperation`), never
   from printed output, and each has a drawing of its own.
7. **New controls,** each kept across sessions in `$.store`:
   - `/fx off` and `/fx on` mute and unmute every effect; `/fx` replays still play while muted;
   - `/fx size small|medium|large`; today's size is the largest, and small is about half of it.
   - The terminal's row is animated, a few frames over the effect, where it is still today.
8. **The sessions, in order** (`SESSIONS.md`): A1 0.11.0, D1 0.11.1, Q1 0.12.0, T1 0.13.0,
   T2 0.14.0, C1 0.15.0, A2 0.16.0. A2 releases and closes the round. That A2 cuts 0.16.0 rather
   than 1.0.0 is proposed at intake, not yet confirmed.
9. **Out of this round:** muting single effects (`/fx mute <name>`), declined by the owner; in
   `docs/BACKLOG.md`.
