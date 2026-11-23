import { read, update } from 'claude-code'
import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { PANE_COLUMNS } from '../hooks/config'
import { PANE, view } from '../hooks/register'
import { STRINGS } from '../hooks/strings'
import { engine, hooksOf, MOUNT, POSSUMS, SURFACES } from './engine'

test('a session declares /possums to run mid-turn, and registers no tool', async ($, on) => {
  const seen = engine(on)
  for (const surface of SURFACES) {
    seen.commands = []
    await $.session.start({ cwd: '/', surface, isInteractive: true })
    expect(seen.commands).toEqual([{ name: 'possums', description: STRINGS.commandDescription, argumentHint: STRINGS.commandHint, immediate: true }])
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
  const hook = hooksOf().hooks.get('ui.close')
  if (hook === undefined) throw new Error('the mod hooks no ui.close')
  return hook as unknown as CloseHook
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

test("any close the engine does not refuse ends an open gallery and drops its part; only the person's is kept as theirs", async () => {
  const hook = closeHook()
  for (const kind of ['plugin', 'unload', 'person'] as const) {
    const { $, read: readView } = stateOnly()
    await update($ as never, view, flags => ({ ...flags, isGalleryOpen: true, galleryPart: 2 }))
    await hook($, { id: PANE, origin: { kind } }, async () => ({ value: undefined }))
    expect([kind, await readView()]).toEqual([kind, { isClosedByPerson: kind === 'person', isGalleryOpen: false }])
  }
  const { $, read: readView } = stateOnly()
  await update($ as never, view, flags => ({ ...flags, isGalleryOpen: true, galleryPart: 2 }))
  await hook($, { id: PANE, origin: { kind: 'person' } }, async () => ({ deny: 'a hook keeps it open' }))
  expect(await readView()).toEqual({ isClosedByPerson: false, isGalleryOpen: true, galleryPart: 2 })
})

test('any close the engine does not refuse ends an open role picker, so the pane opens on the list', async () => {
  const hook = closeHook()
  for (const kind of ['plugin', 'unload', 'person'] as const) {
    const { $, read: readView } = stateOnly()
    await update($ as never, view, flags => ({ ...flags, pickerFor: 3 }))
    await hook($, { id: PANE, origin: { kind } }, async () => ({ value: undefined }))
    expect([kind, await readView()]).toEqual([kind, { isClosedByPerson: kind === 'person', isGalleryOpen: false }])
  }
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
