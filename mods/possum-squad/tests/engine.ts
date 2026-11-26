import type { CommandSpec, On, PaneOpenArgs } from 'claude-code'
import type { Engine } from 'claude-code/testing'

import { PANE_COLUMNS } from '../hooks/config'
import { PANE, register } from '../hooks/register'
import { STRINGS } from '../hooks/strings'

// What the tests raise and mount.
export const SURFACES = ['terminal', 'desktop'] as const
export const POSSUMS = { command: 'possums', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } } as const
export const possums = (args: string) => ({ ...POSSUMS, args })
export const MOUNT = {
  plugin: 'possum-squad',
  component: 'Pane',
  requestId: PANE,
  props: { title: STRINGS.title, isFocused: false, bodyColumns: PANE_COLUMNS, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

type Pane = { id: string; isShown: boolean; isPlaced: boolean }

// The engine's stand-in: it keeps the open panes, each one's title apart (the mod's own for a pane a test set), and
// records what the mod asked of it.
export function engine(on: On, refusal?: string) {
  const seen = {
    commands: [] as CommandSpec[],
    tools: [] as string[],
    opens: [] as PaneOpenArgs[],
    panes: [] as Pane[],
    titles: new Map<string, string>(),
  }
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => {
    seen.commands.push(e)
    return { value: { command: e.name } }
  })
  on('tool.register', (_, e) => {
    seen.tools.push(e.name)
    return { value: { tool: e.name } } as never
  })
  on('ui.panes', () => ({ value: seen.panes.map(pane => ({ ...pane, title: seen.titles.get(pane.id) ?? STRINGS.title, isFocused: false })) }))
  on('ui.open', (_, e) => {
    if (refusal !== undefined) return { deny: refusal }
    seen.opens.push(e)
    seen.titles.set(e.id, e.title ?? e.id)
    // An open of an open id retitles it where it is, and raises it only with `focus`, as the terminal showed (CLI 2.1.330).
    const held = seen.panes.find(pane => pane.id === e.id)
    if (held !== undefined && e.focus !== true) return { value: { isPlaced: held.isPlaced } as never }
    seen.panes = [...seen.panes.filter(pane => pane.id !== e.id), { id: e.id, isShown: true, isPlaced: true }]
    return { value: { isPlaced: true } }
  })
  on('ui.close', (_, e) => {
    seen.panes = seen.panes.filter(pane => pane.id !== e.id)
    seen.titles.delete(e.id)
    return { value: undefined }
  })
  return seen
}

const copy = (value: unknown) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))

// The mod's store as the engine keeps it, JSON in and out. A test changes `held` between commands as
// another session would, and reads every write the mod made from `writes`, every deletion from `deletes`.
export function store(on: On, entries: Record<string, unknown> = {}, refuse?: 'get' | 'set') {
  const held = new Map(Object.entries(entries).map(([key, value]) => [key, copy(value)]))
  const writes: { key: string; value: unknown }[] = []
  const deletes: string[] = []
  on('store.get', (_, e) => (refuse === 'get' ? { deny: 'the fixture store refuses reads' } : { value: copy(held.get(e.key)) }))
  on('store.set', (_, e) => {
    if (refuse === 'set') return { deny: 'the fixture store refuses writes' }
    writes.push({ key: e.key, value: copy(e.value) })
    held.set(e.key, copy(e.value))
    return { value: undefined }
  })
  on('store.delete', (_, e) => {
    if (refuse === 'set') return { deny: 'the fixture store refuses deletions' }
    deletes.push(e.key)
    held.delete(e.key)
    return { value: undefined }
  })
  return { held, writes, deletes }
}

type Hook = (...args: never[]) => unknown

// The module's hooks and their `.catch` handlers from one registration, by event, so a test can run
// one with a `$` of its own where the kit's cannot reach.
export function hooksOf() {
  const hooks = new Map<string, Hook>()
  const catches = new Map<string, Hook>()
  const capture = (event: string, ...rest: unknown[]) => {
    hooks.set(event, rest[rest.length - 1] as Hook)
    return { catch: (handler: Hook) => catches.set(event, handler) }
  }
  register(capture as never, {} as never)
  return { hooks, catches }
}

// Work an event started and did not await (a toast, the engine's list read at a turn's end) settles within these turns.
export async function settled() {
  for (let i = 0; i < 200; i++) await Promise.resolve()
}

// A turn's end, then the list read it started: the kit lists no agent unless a test stands in for it, so the end lands
// as the turn gave it.
export async function turnEnds($: Engine, e: Parameters<Engine['turn']['complete']>[0]) {
  const completed = await $.turn.complete(e)
  await settled()
  return completed
}
