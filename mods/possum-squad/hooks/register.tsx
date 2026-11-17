import type { CommandRunResult, EngineInterface, Register } from 'claude-code'
import { atom, update } from 'claude-code'

import { PANE_COLUMNS } from './config'
import { changeOf, mergePrefs, type Prefs, parseWords, readPrefs, SETTING_NAMES, SETTINGS, settingsText } from './settings'
import { STRINGS } from './strings'
import { emptyPanel } from './view/empty'

export const PANE = 'possum-squad'
// Bump the shape when View's fields change: an older value then reads as absent.
export const view = atom({ plugin: 'possum-squad', key: 'view' } as const, { isClosedByPerson: false }, { shape: 'view-1' })

// The person's answer, kept out of every request the engine lets it be.
const say = (text: string): CommandRunResult => ({ text, isTextDisplayOnly: true })

// The one door to the store (I-03): a write holds only setting values and panel flags. `prefs` is read
// just before it is written, since another session may have changed it meanwhile.
async function writeStore($: Pick<EngineInterface, 'store'>, write: { key: 'prefs'; change: Partial<Prefs> }) {
  await $.store.set(write.key, mergePrefs(await $.store.get(write.key), write.change))
}

// A pane behind another's tab or waiting undrawn is raised; a shown one is closed only by the toggle.
async function showPane($: Pick<EngineInterface, 'ui'>, mayClose: boolean): Promise<CommandRunResult> {
  try {
    const pane = (await $.ui.panes()).find(one => one.id === PANE)
    if (pane?.isShown) {
      if (mayClose) await $.ui.close({ id: PANE })
      return {}
    }
    const raise = pane === undefined ? {} : ({ focus: true } as const)
    await $.ui.open({ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS, ...raise })
    return {}
  } catch {
    return say(STRINGS.cannotToggle)
  }
}

async function listSettings($: Pick<EngineInterface, 'store'>): Promise<CommandRunResult> {
  try {
    return say(settingsText(readPrefs(await $.store.get('prefs'))))
  } catch {
    return say(STRINGS.cannotStore)
  }
}

async function changeSetting($: Pick<EngineInterface, 'store'>, change: Partial<Prefs>, answer: string): Promise<CommandRunResult> {
  try {
    await writeStore($, { key: 'prefs', change })
    return say(answer)
  } catch {
    return say(STRINGS.cannotStore)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'possums', description: STRINGS.commandDescription, argumentHint: STRINGS.commandHint, immediate: true })
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: 'possums' }, async ($, e) => {
    const words = parseWords(e.args)
    switch (words.kind) {
      case 'toggle':
        return showPane($, true)
      case 'open':
        return showPane($, false)
      case 'settings':
        return listSettings($)
      case 'set':
        return changeSetting($, changeOf(words.name, words.value), STRINGS.isNow(words.name, words.value))
      case 'noName':
        return say(STRINGS.noName(SETTING_NAMES))
      case 'noSuchSetting':
        return say(STRINGS.noSuchSetting(SETTING_NAMES))
      case 'badValue':
        return say(STRINGS.badValue(words.name, SETTINGS[words.name].values))
      default:
        return say(STRINGS.usage)
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => emptyPanel($.ui.resolve(e)))

  on('ui.close', { id: PANE }, async ($, e, next) => {
    const closed = await next(e)
    if (closed.deny !== undefined || e.origin.kind !== 'person') return closed
    try {
      await update($, view, flags => ({ ...flags, isClosedByPerson: true }))
    } catch {
      // the close stands; only the flag is lost
    }
    return closed
  }).catch((_$, e, next) => next(e))

  // Hooked for later versions to read; each passes on exactly what the engine gave. `tool.call` and
  // `tool.run` stay unhooked: a hook there turns off a tool's move to the background, even as a pass-through.
  on('agent.spawn', (_$, e, next) => next(e)).catch((_$, e, next) => next(e))
  on('turn.start', (_$, e, next) => next(e)).catch((_$, e, next) => next(e))
  on('turn.complete', (_$, e, next) => next(e)).catch((_$, e, next) => next(e))
  on('session.measure', (_$, e, next) => next(e)).catch((_$, e, next) => next(e))
  on('classic.PermissionRequest', (_$, e, next) => next(e)).catch((_$, e, next) => next(e))

  // The stream goes through untouched.
  on('turn.step', async function* (_$, e, next) {
    return yield* next(e)
  }).catch(async function* (_$, e, next) {
    return yield* next(e)
  })
}
