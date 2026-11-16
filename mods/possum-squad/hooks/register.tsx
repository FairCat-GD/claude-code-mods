import type { Register } from 'claude-code'
import { atom, update } from 'claude-code'

import { PANE_COLUMNS } from './config'
import { STRINGS } from './strings'
import { emptyPanel } from './view/empty'

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
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'possums', description: STRINGS.commandDescription, immediate: true })
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: 'possums' }, async $ => {
    try {
      const pane = (await $.ui.panes()).find(one => one.id === PANE)
      if (pane?.isShown) await $.ui.close({ id: PANE })
      // A pane behind another's tab or waiting undrawn is raised: the person asked to see it.
      else if (pane !== undefined) await $.ui.open({ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS, focus: true })
      else await $.ui.open({ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS })
      return {}
    } catch {
      return { text: STRINGS.cannotToggle }
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => emptyPanel($.ui.resolve(e)))

  on('ui.close', { id: PANE }, async ($, e, next) => {
    const closed = await next(e)
    if (e.origin.kind === 'person' && closed.deny === undefined) {
      try {
        await update($, view, flags => ({ ...flags, isClosedByPerson: true }))
      } catch {
        // the close stands; only the flag is lost
      }
    }
    return closed
  }).catch((_$, e, next) => next(e))

  on('agent.spawn', async (_$, e, next) => passOn(e, await next(e))).catch((_$, e, next) => next(e))
  on('turn.start', async (_$, e, next) => passOn(e, await next(e))).catch((_$, e, next) => next(e))
  on('turn.complete', async (_$, e, next) => passOn(e, await next(e))).catch((_$, e, next) => next(e))
  on('tool.call', async (_$, e, next) => passOn(e, await next(e))).catch((_$, e, next) => next(e))
  on('tool.check', async (_$, e, next) => passOn(e, await next(e))).catch((_$, e, next) => next(e))
  on('session.measure', async (_$, e, next) => passOn(e, await next(e))).catch((_$, e, next) => next(e))
  on('classic.PermissionRequest', async (_$, e, next) => passOn(e, await next(e))).catch((_$, e, next) => next(e))

  // The stream goes through untouched; only its result is read, once it has ended.
  on('turn.step', async function* (_$, e, next) {
    return passOn(e, yield* next(e))
  }).catch(async function* (_$, e, next) {
    return yield* next(e)
  })
}
