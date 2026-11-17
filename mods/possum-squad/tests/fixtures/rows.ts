import type { RowData } from '../../hooks/view/row'

// Fictional rows, one in each state.
export const ROWS: readonly RowData[] = [
  { id: 'row-starting', state: 'starting', description: 'Map the orchard paths', tokens: 0, elapsedMs: 2_000 },
  {
    id: 'row-working',
    state: 'working',
    description: 'Count the shovels',
    role: 'Scout',
    model: 'claude-haiku-5-5',
    effort: 'medium',
    activity: 'Reading shed/rack.txt',
    contextPercent: 9.4,
    tokens: 18_250,
    elapsedMs: 42_000,
  },
  {
    id: 'row-needs-you',
    state: 'needs-you',
    description: 'Paint the garden fence green',
    role: 'Builder',
    model: 'claude-sonnet-5-5',
    activity: 'Running paint --coat 2',
    contextPercent: 31,
    tokens: 9_640,
    elapsedMs: 75_000,
  },
  {
    id: 'row-quiet',
    state: 'quiet',
    description: 'Weigh the pumpkins',
    model: 'claude-sonnet-5-5',
    effort: 'low',
    contextPercent: 55,
    tokens: 640,
    elapsedMs: 200_000,
  },
  {
    id: 'row-finished',
    state: 'finished',
    description: 'List the seed packets by colour',
    role: 'Writer',
    model: 'claude-opus-5-5',
    effort: 'high',
    activity: 'Writing seeds.md',
    contextPercent: 100,
    tokens: 1_234_567,
    elapsedMs: 3_725_000,
  },
  { id: 'row-failed', state: 'failed', description: 'Fix the wheelbarrow', role: 'Helper', contextPercent: 0, tokens: 38_400, elapsedMs: 600_000 },
  { id: 'row-stopped', state: 'stopped', description: 'Rake the leaves', tokens: 120, elapsedMs: 5_000 },
]

// A description carrying markdown, a link and a tag, which must draw as the same plain text.
export const MARKUP_ROW: RowData = {
  id: 'row-markup',
  state: 'working',
  description: '**Prune** the [hedge](https://example.test/hedge) <b>today</b>',
  activity: '_Trimming_ `hedge.txt`',
  tokens: 2_000,
  elapsedMs: 9_000,
}

// A description too long for one line of the pane.
export const LONG_ROW: RowData = {
  id: 'row-long',
  state: 'working',
  description: 'Sort every flower pot in the greenhouse by size, colour, age and the plant it held last spring',
  tokens: 4_000,
  elapsedMs: 61_000,
}
