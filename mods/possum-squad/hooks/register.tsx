import type { Register, Timer } from 'claude-code'
import { atom, update } from 'claude-code'

import { PANE_COLUMNS } from './config'
import { entriesOf, type HookedEvent, limitsOf, newLog, note } from './spike'
import { STRINGS } from './strings'
import { emptyPanel } from './view/empty'
import { spikePanel } from './view/spike'

export const PANE = 'possum-squad'
// Bump the shape when View's fields change: an older value then reads as absent.
export const view = atom({ plugin: 'possum-squad', key: 'view' } as const, { isClosedByPerson: false }, { shape: 'view-1' })

// What a hook gets from below goes back up as it came; reading it can never throw into the event.
function passOn<E, R>(e: E, result: R, read?: (e: E, result: R) => void): R {
  try {
    read?.(e, result)
  } catch {
    // a fault in reading costs the panel its data, never the event its result
  }
  return result
}

export const register: Register = on => {
  // The spike's tallies stay in this copy's memory, so reading an event never waits on a write.
  const log = newLog()
  const hear = (event: HookedEvent) => (e: unknown, result: unknown) => note(log, event, e, result)

  // One clock while the pane is open; its tick is the pane's only redraw.
  let clock: Timer | undefined
  let ticks = 0
  const disarm = () => {
    clock?.cancel()
    clock = undefined
  }

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'possums', description: STRINGS.commandDescription, immediate: true })
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: 'possums' }, async $ => {
    try {
      const pane = (await $.ui.panes()).find(one => one.id === PANE)
      if (pane?.isShown) {
        await $.ui.close({ id: PANE })
        return {}
      }
      // A pane behind another's tab or waiting undrawn is raised: the person asked to see it.
      const raise = pane === undefined ? {} : ({ focus: true } as const)
      await $.ui.open({ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS, ...raise })
    } catch {
      return { text: STRINGS.cannotToggle }
    }
    try {
      clock ??= $.clock.every(1000, () => {
        ticks++
        $.ui.invalidate('ui.render')
      })
    } catch {
      // the pane stays open; it is only not redrawn
    }
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const table = $.ui.resolve(e)
    try {
      // The terminal's table may still answer `Svg`, drawing nothing; only the declared surfaces get sprites.
      const Svg = e.surface === 'terminal' ? undefined : $.ui.resolve(e).Svg
      const asked = await $.session.usage().then(limitsOf, () => undefined)
      return spikePanel(table, Svg, { entries: entriesOf(log), asked, measured: log.measured, ticks })
    } catch {
      return emptyPanel(table)
    }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    const closed = await next(e)
    if (closed.deny !== undefined) return closed
    try {
      disarm()
      if (e.origin.kind === 'person') await update($, view, flags => ({ ...flags, isClosedByPerson: true }))
    } catch {
      // the close stands; only the clock or the flag is lost
    }
    return closed
  }).catch((_$, e, next) => next(e))

  on('agent.spawn', async (_$, e, next) => passOn(e, await next(e), hear('agent.spawn'))).catch((_$, e, next) => next(e))
  on('turn.start', async (_$, e, next) => passOn(e, await next(e), hear('turn.start'))).catch((_$, e, next) => next(e))
  on('turn.complete', async (_$, e, next) => passOn(e, await next(e), hear('turn.complete'))).catch((_$, e, next) => next(e))
  on('tool.call', async (_$, e, next) => passOn(e, await next(e), hear('tool.call'))).catch((_$, e, next) => next(e))
  on('tool.check', async (_$, e, next) => passOn(e, await next(e), hear('tool.check'))).catch((_$, e, next) => next(e))
  on('session.measure', async (_$, e, next) => passOn(e, await next(e), hear('session.measure'))).catch((_$, e, next) => next(e))
  on('classic.PermissionRequest', async (_$, e, next) => passOn(e, await next(e), hear('classic.PermissionRequest'))).catch((_$, e, next) => next(e))

  // The stream goes through untouched; only its result is read, once it has ended.
  on('turn.step', async function* (_$, e, next) {
    return passOn(e, yield* next(e), hear('turn.step'))
  }).catch(async function* (_$, e, next) {
    return yield* next(e)
  })
}
