# cartoon-fx

Short cartoon animations for the moments worth marking in a Claude Code session:
- a clapperboard for an accepted plan;
- a stamp for a commit, a picked cherry for a cherry-pick, and a rocket for a push;
- a claw stacking blocks for a rebase, and a jack-in-the-box for a pull request opened;
- a zipper closing two strands into one for a merge;
- a ticked clipboard for a passing test run;
- a googly-eyed magnifying glass for a finished code review, and a swatted bug for its fixes;
- a squish for a compaction, and ninja helpers for subagents;
- an overstuffed suitcase as the context window reaches its yellow and red zones.

In the desktop app each one plays under the conversation row that set it off, or in the strip
above the prompt. The terminal shows the words in that strip, with coloured glyphs flying out from them.

## Install

In a terminal:

```bash
claude plugin install cartoon-fx --marketplace FairCat-GD/claude-code-mods
```

In the desktop app: + beside the prompt, then Plugins, then Add marketplace.

## Commands

| Command | Does |
|---|---|
| `/fx` or `/fx all` | Plays every animation in turn. |
| `/fx <name>` | Plays one: `plan`, `commit`, `cherry`, `rebase`, `push`, `pr`, `merge`, `tests`, `review`, `fixes`, `compact`, `helpers`, `context` or `redzone`. Any other name gets this list. |
| `/fx place bottom` | Plays every effect in the strip above the prompt, from now on and in later sessions. |
| `/fx place conversation` | Plays effects under the row that set them off again, which is the default. `/fx place middle` does the same. |
| `/fx off` / `/fx on` | Turns every effect off or on again, from now on and in later sessions. `/fx` still plays while they are off. |
| `/fx size small`, `medium` or `large` | How large the desktop app draws them; `medium` is the default. |
