import type { AgentSpawnInput, AgentSpawnResult, CommandRunResult, EngineInterface, Register, TurnStepResult } from 'claude-code'
import { atom, read, update } from 'claude-code'

import type { Runs, Tokens } from '../types/index'
import { PANE_COLUMNS } from './config'
import { cleared, figures, NO_RUNS, type Spawn, shownRuns, spawnOpened, spawnSettled, stepped, turnEnded, turnStarted } from './model/runs'
import { callsOf } from './model/tools'
import { changeOf, mergePrefs, type Prefs, parseWords, readPrefs, SETTING_NAMES, SETTINGS, settingsText } from './settings'
import { STRINGS } from './strings'
import { emptyPanel } from './view/empty'
import { rowData, runsPanel } from './view/runs'

export const PANE = 'possum-squad'
// Bump the shape when View's fields change: an older value then reads as absent.
export const view = atom({ plugin: 'possum-squad', key: 'view' } as const, { isClosedByPerson: false }, { shape: 'view-1' })
// Bump the shape when Runs or Run change their fields.
export const runs = atom({ plugin: 'possum-squad', key: 'runs' } as const, NO_RUNS, { shape: 'runs-1' })

// A clear, a resume or a fork of the session starts the list over.
const STARTS_OVER = new Set(['clear', 'resume', 'fork'])

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

// The reading guard (I-05): an event's record is read and written apart from its result, so a fault here loses only
// the panel's record, never the event.
async function record($: Pick<EngineInterface, 'state'>, change: (held: Runs) => Runs) {
  try {
    await update($, runs, change)
  } catch {
    // the event goes on as the engine gave it
  }
}

// The same, for the records that need the time: a spawn and an end.
async function recordAt($: Pick<EngineInterface, 'state' | 'clock'>, change: (held: Runs, at: number) => Runs) {
  try {
    const at = await $.clock.now()
    await update($, runs, held => change(held, at))
  } catch {
    // the event goes on as the engine gave it
  }
}

function spawnOf(e: AgentSpawnInput): Spawn {
  const spawn: Spawn = {
    key: e.tool_use_id === '' ? '' : e.workflow === undefined ? e.tool_use_id : `${e.tool_use_id}#${e.workflow.agentIndex}`,
    type: e.subagentType,
    description: e.description,
    isTeammate: e.isTeammate === true,
  }
  if (e.parentAgentId !== undefined) spawn.parentId = e.parentAgentId
  if (e.resume !== undefined) spawn.resumes = e.resume.agentId
  return spawn
}

const settledOf = (result: AgentSpawnResult) => ({ agentId: result.agentId, model: result.model, isDenied: result.deny !== undefined })

const usageOf = (result: TurnStepResult): Tokens | undefined =>
  result.usage === null
    ? undefined
    : {
        input: result.usage.input_tokens,
        output: result.usage.output_tokens,
        cacheRead: result.usage.cache_read_input_tokens,
        cacheWrite: result.usage.cache_creation_input_tokens,
      }

// A state that cannot be read draws the empty panel, and a clock that cannot be read leaves times unknown.
async function drawPane($: Pick<EngineInterface, 'state' | 'clock' | 'ui'>, e: Parameters<EngineInterface['ui']['resolve']>[0] & { surface: string }) {
  const table = $.ui.resolve(e)
  const shown = shownRuns(await read($, runs).catch(() => NO_RUNS))
  if (shown.length === 0) return emptyPanel(table)
  const now = await $.clock.now().catch(() => Number.NaN)
  const keyOf = (run: (typeof shown)[number]) => run.agentId ?? `spawn-${run.order}`
  return runsPanel(
    table,
    e.surface === 'terminal',
    shown.map(run => rowData(run, keyOf(run), figures(run, now))),
  )
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

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => drawPane($, e))

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

  // Each event passes on exactly what the engine gave; only subagents' events are recorded, the main loop's never
  // call `$`. A tool call's start is read from its step's result: `tool.call` and `tool.run` stay unhooked, since
  // the declarations say a hook there turns off a tool's move to the background, even as a pass-through.
  on('agent.spawn', async ($, e, next) => {
    const spawn = spawnOf(e)
    await recordAt($, (held, at) => spawnOpened(held, spawn, at))
    let result: AgentSpawnResult
    try {
      result = await next(e)
    } catch (error) {
      await recordAt($, (held, at) => spawnSettled(held, spawn, { isDenied: true }, at))
      throw error
    }
    await recordAt($, (held, at) => spawnSettled(held, spawn, settledOf(result), at))
    return result
  }).catch((_$, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    const started = await next(e)
    const { agentId } = e
    if (agentId !== undefined) await record($, held => turnStarted(held, agentId))
    return started
  }).catch((_$, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const completed = await next(e)
    const { agentId } = e
    if (agentId !== undefined) await recordAt($, (held, at) => turnEnded(held, agentId, { reason: e.reason, hasText: e.answer.trim() !== '' }, at))
    return completed
  }).catch((_$, e, next) => next(e))

  on('classic.SessionStart', async ($, e, next) => {
    const started = await next(e)
    if (STARTS_OVER.has(e.source)) await record($, held => cleared(held))
    return started
  }).catch((_$, e, next) => next(e))

  on('session.measure', (_$, e, next) => next(e)).catch((_$, e, next) => next(e))
  on('classic.PermissionRequest', (_$, e, next) => next(e)).catch((_$, e, next) => next(e))

  // Every chunk is delegated untouched; the step is read once its stream has ended.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const { agentId } = e
    if (agentId !== undefined) {
      // No clock here: the step's result waits only on the state's read and write.
      await record($, held => {
        const calls = callsOf(result.toolUses)
        const effort = e.effort === undefined ? undefined : String(e.effort)
        return stepped(held, agentId, { model: result.usage?.model ?? e.model, effort, usage: usageOf(result), activity: calls.activity, calls: calls.count })
      })
    }
    return result
  }).catch(async function* (_$, e, next) {
    return yield* next(e)
  })
}
