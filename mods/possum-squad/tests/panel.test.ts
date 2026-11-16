import { read } from 'claude-code'
import type { CommandSpec, On, PaneOpenArgs } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { PANE_COLUMNS } from '../hooks/config'
import { PANE, register, view } from '../hooks/register'
import { STRINGS } from '../hooks/strings'

const SURFACES = ['terminal', 'desktop'] as const
const POSSUMS = { command: 'possums', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } } as const
const MOUNT = {
  plugin: 'possum-squad',
  component: 'Pane',
  requestId: PANE,
  props: { title: STRINGS.title, isFocused: false, bodyColumns: PANE_COLUMNS, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

type Pane = { id: string; isShown: boolean; isPlaced: boolean }

// The engine's stand-in: it keeps the open panes and records what the mod asked of it.
function engine(on: On, refusal?: string) {
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

test('a session declares /possums to run mid-turn, and registers no tool', async ($, on) => {
  const seen = engine(on)
  for (const surface of SURFACES) {
    seen.commands = []
    await $.session.start({ cwd: '/', surface, isInteractive: true })
    expect(seen.commands).toEqual([{ name: 'possums', description: STRINGS.commandDescription, immediate: true }])
    expect(seen.tools).toEqual([])
  }
})

test('/possums opens the pane and prints nothing; a second /possums closes it', async ($, on) => {
  const seen = engine(on)
  for (const surface of SURFACES) {
    seen.opens = []
    await $.session.start({ cwd: '/', surface, isInteractive: true })

    expect((await $.command.run(POSSUMS)).text).toBeUndefined()
    expect(seen.opens).toEqual([{ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS }])
    expect(seen.panes.map(pane => pane.id)).toEqual([PANE])

    expect((await $.command.run(POSSUMS)).text).toBeUndefined()
    expect(seen.opens).toHaveLength(1)
    expect(seen.panes).toEqual([])
  }
})

test('/possums raises the pane when it is open but not in view, and does not close it', async ($, on) => {
  const seen = engine(on)
  const hidden = [
    { id: PANE, isShown: false, isPlaced: true },
    { id: PANE, isShown: false, isPlaced: false },
  ]
  for (const pane of hidden) {
    seen.panes = [pane]
    seen.opens = []

    expect((await $.command.run(POSSUMS)).text).toBeUndefined()
    expect(seen.opens).toEqual([{ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS, focus: true }])
    expect(seen.panes).toEqual([{ id: PANE, isShown: true, isPlaced: true }])
  }
})

test('the pane draws the empty panel on every surface', async ($, on) => {
  engine(on)
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...MOUNT, surface })
    expect((await pane.find({ type: 'Text', text: STRINGS.empty }))?.text).toBe(STRINGS.empty)
    await pane.unmount()
  }
})

// Another plugin, beside the mod, that shows what the mod keeps in `view`, as stored.
const VIEW_READER = {
  name: 'view-reader',
  register: (on: On) => {
    on('command.run', { command: 'read-view' }, async $ => ({
      text: JSON.stringify((await $.state.get({ plugin: 'possum-squad', key: 'view' })).value ?? 'nothing'),
    }))
  },
}
const READ_VIEW = { ...POSSUMS, command: 'read-view' } as const

test('the mod closing its own pane writes nothing to the view', { plugins: [VIEW_READER] }, async ($, on) => {
  engine(on)
  await $.command.run(POSSUMS)
  await $.command.run(POSSUMS)
  expect((await $.command.run(READ_VIEW)).text).toBe('"nothing"')
})

// The kit's `$` cannot close a pane as the person, so the mod's `ui.close` hook runs here on its own.
type CloseHook = (
  $: unknown,
  e: { id: string; origin: { kind: 'plugin' | 'person' | 'unload' } },
  next: (e: unknown) => Promise<{ value?: undefined; deny?: string }>,
) => Promise<unknown>

function closeHook(): CloseHook {
  let hook: CloseHook | undefined
  const capture = (event: string, ...rest: unknown[]) => {
    if (event === 'ui.close') hook = rest[rest.length - 1] as CloseHook
    return { catch: () => undefined }
  }
  register(capture as never, {} as never)
  if (hook === undefined) throw new Error('the mod hooks no ui.close')
  return hook
}

// A `$` holding only state, as the engine keeps it: a value and its version per key.
function stateOnly() {
  const values = new Map<string, { value: unknown; version: number }>()
  const keyOf = (ref: object) => JSON.stringify(ref)
  const state = {
    get: async (ref: object) => values.get(keyOf(ref)) ?? { value: undefined, version: 0 },
    set: async (ref: object, value: unknown, options?: { ifVersion?: number }) => {
      const now = values.get(keyOf(ref))?.version ?? 0
      if (options?.ifVersion !== undefined && options.ifVersion !== now) return { isSet: false, version: now }
      values.set(keyOf(ref), { value, version: now + 1 })
      return { isSet: true, version: now + 1 }
    },
  }
  return { $: { state }, read: () => read({ state } as never, view) }
}

test('a close by the person is kept in the view, and the close goes on as the engine gave it', async () => {
  const hook = closeHook()
  for (const kind of ['plugin', 'unload', 'person'] as const) {
    const { $, read: readView } = stateOnly()
    const result = await hook($, { id: PANE, origin: { kind } }, async () => ({ value: undefined }))
    expect(result).toEqual({ value: undefined })
    expect((await readView()).isClosedByPerson).toBe(kind === 'person')
  }

  const { $, read: readView } = stateOnly()
  const refused = await hook($, { id: PANE, origin: { kind: 'person' } }, async () => ({ deny: 'a hook keeps it open' }))
  expect(refused).toEqual({ deny: 'a hook keeps it open' })
  expect((await readView()).isClosedByPerson).toBe(false)
})

test('a close by the person whose flag cannot be written still goes on as the engine gave it', async () => {
  const hook = closeHook()
  const failing = {
    state: {
      get: async () => ({ value: undefined, version: 0 }),
      set: async () => Promise.reject(new Error('the fixture state refuses every write')),
    },
  }
  const result = await hook(failing, { id: PANE, origin: { kind: 'person' } }, async () => ({ value: undefined }))
  expect(result).toEqual({ value: undefined })
})

test('an open the engine refuses answers in one line', async ($, on) => {
  engine(on, 'another plugin holds this pane')
  expect((await $.command.run(POSSUMS)).text).toBe(STRINGS.cannotToggle)
})
