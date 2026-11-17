import type { CommandSpec, On, PaneOpenArgs } from 'claude-code'

import { PANE_COLUMNS } from '../hooks/config'
import { PANE, register } from '../hooks/register'
import { STRINGS } from '../hooks/strings'

// What the tests raise and mount.
export const SURFACES = ['terminal', 'desktop'] as const
export const POSSUMS = { command: 'possums', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } } as const
export const MOUNT = {
  plugin: 'possum-squad',
  component: 'Pane',
  requestId: PANE,
  props: { title: STRINGS.title, isFocused: false, bodyColumns: PANE_COLUMNS, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

type Pane = { id: string; isShown: boolean; isPlaced: boolean }

// The engine's stand-in: it keeps the open panes and records what the mod asked of it.
export function engine(on: On, refusal?: string) {
  const seen = { commands: [] as CommandSpec[], tools: [] as string[], opens: [] as PaneOpenArgs[], panes: [] as Pane[] }
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => {
    seen.commands.push(e)
    return { value: { command: e.name } }
  })
  on('tool.register', (_, e) => {
    seen.tools.push(e.name)
    return { value: { tool: e.name } } as never
  })
  on('ui.panes', () => ({ value: seen.panes.map(pane => ({ ...pane, title: STRINGS.title, isFocused: false })) }))
  on('ui.open', (_, e) => {
    if (refusal !== undefined) return { deny: refusal }
    seen.opens.push(e)
    // An open of an open id raises it in place, as the person asked.
    seen.panes = [...seen.panes.filter(pane => pane.id !== e.id), { id: e.id, isShown: true, isPlaced: true }]
    return { value: { isPlaced: true } }
  })
  on('ui.close', (_, e) => {
    seen.panes = seen.panes.filter(pane => pane.id !== e.id)
    return { value: undefined }
  })
  return seen
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
