import type { RoleId, StateId } from '../types/index'

// "a, b and c", or "a, b or c".
const list = (items: readonly string[], joiner: 'and' | 'or') =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${joiner} ${items[items.length - 1]}`

// Every string the mod shows, in one English table.
export const STRINGS = {
  title: 'Possum Squad',
  commandDescription: 'Show or hide the Possum Squad pane',
  commandHint: '[open | roles | settings | set <name> <value>]',
  empty: 'No agents yet. They show up here when Claude starts one.',
  cannotToggle: 'The Possum Squad pane could not be shown or hidden here.',
  usage: 'Use /possums, /possums open, /possums roles, /possums settings or /possums set <name> <value>.',
  settingsHeading: 'Possum Squad settings:',
  setting: (name: string, value: string, values: readonly string[]) => `${name}: ${value} (${values.join(', ')})`,
  howToChange: 'Change one with /possums set <name> <value>.',
  isNow: (name: string, value: string) => `${name} is now ${value}.`,
  noName: (names: readonly string[]) => `Name a setting: ${list(names, 'or')}.`,
  noSuchSetting: (names: readonly string[]) => `There is no such setting. The settings are ${list(names, 'and')}.`,
  badValue: (name: string, values: readonly string[]) => `${name} can be ${list(values, 'or')}.`,
  cannotStore: 'The settings could not be read or saved here.',
  lead: 'Main session',
  // The header's line: tokens and work time over the Lead and every run.
  session: (tokens: string, time: string) => `${tokens} tokens · ${time}`,
  // A plan's usage window on the header's line, by the name the engine gives it; one it names otherwise reads as given.
  limit: (window: string, percent: string) => `${window} ${percent}`,
  limits: { five_hour: '5h', seven_day: '7d', spend_limit: 'spend' } as Record<string, string | undefined>,
  // With `cost` at `estimate`: the dollars on the header's line and each row, never without "est.".
  estimate: (amount: string) => `est. ${amount}`,
  dollars: (amount: string) => `$${amount}`,
  underCent: '<$0.01',
  sections: { 'needs-you': 'Needs you', running: 'Running', finished: 'Finished' },
  heading: (name: string, count: number) => `${name} · ${count}`,
  show: 'show',
  hide: 'hide',
  // Under a section whose last rows are not drawn.
  more: (count: number) => `and ${count} more`,
  // Where a description is cut.
  cut: '…',
  // A run's state, and `planned`, which only the gallery draws yet.
  states: {
    planned: 'planned',
    starting: 'starting',
    working: 'working',
    'needs-you': 'needs you',
    quiet: 'quiet',
    waiting: 'waiting',
    finished: 'finished',
    failed: 'failed',
    stopped: 'stopped',
  } satisfies Record<StateId | 'planned', string>,
  // Role names never change with the set.
  roles: {
    lead: 'Lead',
    scout: 'Scout',
    planner: 'Planner',
    builder: 'Builder',
    tester: 'Tester',
    bugcatcher: 'Bug catcher',
    reviewer: 'Reviewer',
    researcher: 'Researcher',
    operator: 'Operator',
    courier: 'Courier',
    writer: 'Writer',
    artist: 'Artist',
    analyst: 'Analyst',
    guard: 'Guard',
    janitor: 'Janitor',
    pilot: 'Pilot',
    helper: 'Helper',
  } satisfies Record<RoleId, string>,
  row: {
    mark: '●',
    separator: ' · ',
    noActivity: 'No tool calls yet',
    context: 'Context',
    contextShort: 'ctx',
    unknown: '–',
    round: (round: number) => `round ${round}`,
    // A quiet row's third line, in whole minutes since its last event.
    quietFor: (minutes: number) => `Quiet for ${minutes} min`,
  },
  // A call's verb, by tool; a tool not here reads "Using <tool>".
  activity: {
    Read: 'Reading',
    Write: 'Writing',
    Edit: 'Editing',
    MultiEdit: 'Editing',
    NotebookEdit: 'Editing',
    Bash: 'Running',
    Grep: 'Searching for',
    Glob: 'Finding',
    WebFetch: 'Fetching',
    WebSearch: 'Searching the web for',
    Agent: 'Starting',
    Task: 'Starting',
    Skill: 'Using',
  } as Record<string, string | undefined>,
  using: (tool: string) => `Using ${tool}`,
  // `/possums roles`: every role of the set in every state, a few roles at a time.
  gallery: {
    heading: (set: string) => `Roles · ${set}`,
    close: 'close',
    previous: 'previous',
    next: 'next',
    part: (at: number, of: number) => `${at} of ${of}`,
    // Between a role's name and its costume's, where only dimming tells them apart.
    between: '·',
    states: 'States',
    roles: 'Roles',
  },
  // A row's Peek: its button, then the headings of what it shows under the row.
  peek: {
    open: 'peek',
    close: 'hide',
    brief: 'Brief',
    actions: 'Last actions',
    files: 'Files changed',
    answer: 'Answer',
    lastAnswer: 'Last answer',
  },
  // The header's button between the list and the collapsed view, and what the collapsed view says.
  collapse: 'collapse',
  expand: 'expand',
  collapsed: {
    running: 'running',
    between: '·',
    needsYou: (count: number) => `${count} needs you`,
    // The Lead's sprite, carrying a joey per running agent.
    alt: (joeys: number) => (joeys === 0 ? 'Lead' : `Lead, carrying ${joeys} ${joeys === 1 ? 'joey' : 'joeys'}`),
  },
  // A row's role picker: its button while the row is plain, the picker's label, and its way out.
  picker: {
    pick: 'Pick a role',
    label: 'Role',
    cancel: 'cancel',
  },
  // While the pane is out of view: a run that needs the person, and a long run's end. Each names its run by its
  // description, or as `someone` before its row has shown.
  toasts: {
    someone: 'An agent',
    needsYou: (who: string) => `${who} · needs you: waiting on a permission prompt`,
    finished: (who: string, time: string) => `${who} · finished after ${time}`,
    failed: (who: string, time: string) => `${who} · failed after ${time}`,
    stopped: (who: string, time: string) => `${who} · stopped after ${time}`,
  },
  // What a sprite shows, for a reader that cannot see it.
  sprite: {
    plain: 'Opossum',
    alt: (who: string, state: string) => `${who}, ${state}`,
    squad: 'The squad, asleep',
  },
} as const
