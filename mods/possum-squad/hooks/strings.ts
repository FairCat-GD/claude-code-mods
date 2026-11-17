import type { StateId } from '../types/index'

// "a, b and c", or "a, b or c".
const list = (items: readonly string[], joiner: 'and' | 'or') =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${joiner} ${items[items.length - 1]}`

// Every string the mod shows, in one English table.
export const STRINGS = {
  title: 'Possum Squad',
  commandDescription: 'Show or hide the Possum Squad pane',
  commandHint: '[open | settings | set <name> <value>]',
  empty: 'No agents yet. They show up here when Claude starts one.',
  cannotToggle: 'The Possum Squad pane could not be shown or hidden here.',
  usage: 'Use /possums, /possums open, /possums settings or /possums set <name> <value>.',
  settingsHeading: 'Possum Squad settings:',
  setting: (name: string, value: string, values: readonly string[]) => `${name}: ${value} (${values.join(', ')})`,
  howToChange: 'Change one with /possums set <name> <value>.',
  isNow: (name: string, value: string) => `${name} is now ${value}.`,
  noName: (names: readonly string[]) => `Name a setting: ${list(names, 'or')}.`,
  noSuchSetting: (names: readonly string[]) => `There is no such setting. The settings are ${list(names, 'and')}.`,
  badValue: (name: string, values: readonly string[]) => `${name} can be ${list(values, 'or')}.`,
  cannotStore: 'The settings could not be read or saved here.',
  states: {
    starting: 'starting',
    working: 'working',
    'needs-you': 'needs you',
    quiet: 'quiet',
    finished: 'finished',
    failed: 'failed',
    stopped: 'stopped',
  } satisfies Record<StateId, string>,
  row: {
    mark: '●',
    separator: ' · ',
    noActivity: 'No tool calls yet',
    context: 'Context',
    contextShort: 'ctx',
    unknown: '–',
  },
} as const
