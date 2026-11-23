import type { AgentSpawnInput, AgentSpawnResult, CommandRunResult, EngineInterface, Register, Timer, TurnStepResult } from 'claude-code'
import { atom, read, update } from 'claude-code'

import type { Lead, RoleId, Runs, Tokens, View } from '../types/index'
import { PANE_COLUMNS } from './config'
import { leadFigures, measured, NO_LEAD, totals, turnCounted } from './model/lead'
import {
  cleared,
  fellBack,
  figures,
  isEmpty,
  keepsClock,
  NO_RUNS,
  reassigned,
  runOf,
  type Spawn,
  shownRuns,
  spawnOpened,
  spawnSettled,
  stepped,
  turnEnded,
  turnStarted,
  weakOf,
} from './model/runs'
import { callsOf } from './model/tools'
import { atSpawn, HELPER, isCustomType, isPickable, rememberedOf, toolsSeen } from './roles/rules'
import { changeOf, mergePrefs, type Prefs, parseWords, readPrefs, SETTING_NAMES, SETTINGS, settingsText } from './settings'
import { galleryOf } from './sprites'
import { ART } from './sprites/data'
import { STRINGS } from './strings'
import { panel } from './view/panel'
import { rowData } from './view/runs'

export const PANE = 'possum-squad'
// Bump the shape when View's fields change: an older value then reads as absent.
export const NO_FLAGS: View = { isClosedByPerson: false, isGalleryOpen: false }
export const view = atom({ plugin: 'possum-squad', key: 'view' } as const, NO_FLAGS, { shape: 'view-3' })
// Bump the shape when Runs or Run change their fields.
export const runs = atom({ plugin: 'possum-squad', key: 'runs' } as const, NO_RUNS, { shape: 'runs-4' })
// Bump the shape when Lead changes its fields.
export const lead = atom({ plugin: 'possum-squad', key: 'lead' } as const, NO_LEAD, { shape: 'lead-1' })

// A clear, a resume or a fork of the session starts the list over.
const STARTS_OVER = new Set(['clear', 'resume', 'fork'])

// The person's answer, kept out of every request the engine lets it be.
const say = (text: string): CommandRunResult => ({ text, isTextDisplayOnly: true })

// The key a custom agent type's remembered pick is kept under.
const roleKey = (type: string) => `role:${type}` as const

type StoreWrite = { key: 'prefs'; change: Partial<Prefs> } | { key: ReturnType<typeof roleKey>; role: RoleId }

// The one door to the store (I-03): a write holds only setting values, panel flags, agent type names and role ids.
// `prefs` is read just before it is written, since another session may have changed it meanwhile.
async function writeStore($: Pick<EngineInterface, 'store'>, write: StoreWrite) {
  if ('change' in write) await $.store.set(write.key, mergePrefs(await $.store.get(write.key), write.change))
  else await $.store.set(write.key, write.role)
}

// The store is not reactive, so a change the pane draws from redraws it by hand.
function redraw($: Pick<EngineInterface, 'ui'>) {
  try {
    $.ui.invalidate('ui.render')
  } catch {
    // the pane catches up at its next redraw
  }
}

// The one-second clock (N-03), in module memory: a reload drops it along with its timer.
const TICK_MS = 1000
// Beats that stop this long mean the engine ended the timer (a refused period ends it silently).
const STALE_MS = 2500
let ticking: Timer | undefined
// Each arming's own, so a beat still in flight from a replaced timer stops nothing.
let generation = 0
let isPaneOpen = false
let beats = 0
let lastBeat = { beats: -1, at: 0 }

function armClock($: Pick<EngineInterface, 'clock' | 'ui' | 'state'>) {
  if (ticking !== undefined) return
  const own = ++generation
  beats = 0
  lastBeat = { beats: -1, at: 0 }
  ticking = $.clock.every(TICK_MS, () => void tick($, own))
}

function stopClock(own = generation) {
  if (own !== generation) return
  ticking?.cancel()
  ticking = undefined
}

// A closed pane, or no run that is live or may still fall back to Helper, stops the clock. A pane open behind another keeps it, undrawn, so its times are right
// the moment it shows. A role settled here redraws the pane by its write. The gallery's sprites move inside themselves,
// so a beat leaves it undrawn: a redraw would send every one of its sprites again for the header's time alone.
async function tick($: Pick<EngineInterface, 'ui' | 'state' | 'clock'>, own: number) {
  if (own !== generation) return
  beats++
  try {
    const pane = (await $.ui.panes()).find(one => one.id === PANE)
    isPaneOpen = pane !== undefined
    if (pane === undefined) return stopClock(own)
    const held = await read($, runs)
    if (!shownRuns(held).some(keepsClock)) return stopClock(own)
    const hasSettled = await settleHelpers($, held)
    const flags = await read($, view).catch(() => NO_FLAGS)
    if (pane.isShown && !hasSettled && !flags.isGalleryOpen) $.ui.invalidate('ui.render')
  } catch {
    stopClock(own)
  }
}

// Helper at T-04 with no event to bring it. It writes only when a role is due, through the update's own read, so a
// beat still in flight after a clear writes nothing stale; a fault leaves the clock running.
async function settleHelpers($: Pick<EngineInterface, 'state' | 'clock'>, held: Runs): Promise<boolean> {
  if (!Object.values(held.rows).some(run => run.role === undefined)) return false
  try {
    const now = await $.clock.now()
    if (fellBack(held, now, HELPER) === held) return false
    await update($, runs, latest => fellBack(latest, now, HELPER))
    return true
  } catch {
    return false
  }
}

// Where the pane is open and a run works, the clock starts, or starts again after the engine ended it. `every` is
// synchronous, so no event waits on it.
function keepTime($: Pick<EngineInterface, 'clock' | 'ui' | 'state'>) {
  if (!isPaneOpen) return
  try {
    armClock($)
  } catch {
    // the times move on events alone
  }
}

async function armIfLive($: Pick<EngineInterface, 'clock' | 'ui' | 'state'>, isFresh = false) {
  if (!shownRuns(await read($, runs)).some(keepsClock)) return
  // The person asking for the pane starts a fresh timer, in case the engine ended the last one.
  if (isFresh) stopClock()
  armClock($)
}

// Seen while drawing: a timer whose beats stopped was ended by the engine, so the next arming starts another.
function noteBeat(now: number) {
  if (ticking === undefined) return
  if (beats !== lastBeat.beats) lastBeat = { beats, at: now }
  else if (now - lastBeat.at > STALE_MS) stopClock()
}

// A pane behind another's tab or waiting undrawn is raised; a shown one is closed only by the toggle.
async function showPane($: Pick<EngineInterface, 'ui' | 'state' | 'clock'>, mayClose: boolean): Promise<CommandRunResult> {
  try {
    const pane = (await $.ui.panes()).find(one => one.id === PANE)
    if (pane?.isShown && mayClose) {
      await $.ui.close({ id: PANE })
      return {}
    }
    if (!pane?.isShown) await $.ui.open({ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS, ...(pane === undefined ? {} : ({ focus: true } as const)) })
    isPaneOpen = true
  } catch {
    return say(STRINGS.cannotToggle)
  }
  await forgetClose($)
  try {
    await armIfLive($, true)
  } catch {
    // the times move on events alone
  }
  return {}
}

// The person opening the pane takes back their own close, so the pane opens by itself again as `autoOpen` says.
async function forgetClose($: Pick<EngineInterface, 'state'>) {
  try {
    if ((await read($, view)).isClosedByPerson) await update($, view, flags => ({ ...flags, isClosedByPerson: false }))
  } catch {
    // the close stands until the next open
  }
}

// The pane opens by itself as `autoOpen` says: never over the person's own close, never raising a pane already open,
// never taking the keys. The spawn does not wait for it (N-07), so every fault here ends quietly. A pane left waiting
// undrawn (too narrow for an unasked open) starts no clock; its first drawing, or the person's open, brings the times.
async function autoOpen($: Pick<EngineInterface, 'store' | 'state' | 'ui' | 'clock'>, isFirst: boolean) {
  try {
    const { autoOpen: when } = readPrefs(await $.store.get('prefs'))
    if (when === 'never' || (when === 'first' && !isFirst)) return
    if ((await read($, view)).isClosedByPerson) return
    if ((await $.ui.panes()).some(one => one.id === PANE)) return
    const opened = await $.ui.open({ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS })
    if (!opened.isPlaced) return
    isPaneOpen = true
    await armIfLive($)
  } catch {
    // the pane waits for /possums
  }
}

const withoutPicker = ({ pickerFor: _, ...flags }: View): View => flags

// A row's role button opens its picker, or closes it when it is that row's already.
async function toggleRole($: Pick<EngineInterface, 'state'>, order: number) {
  try {
    await update($, view, flags => (flags.pickerFor === order ? withoutPicker(flags) : { ...flags, pickerFor: order }))
  } catch {
    // the picker stays as it was
  }
}

async function closePicker($: Pick<EngineInterface, 'state'>) {
  try {
    await update($, view, flags => (flags.pickerFor === undefined ? flags : withoutPicker(flags)))
  } catch {
    // the picker stays until the pane closes
  }
}

// The person's pick applies to that run at once, timed so a live row hops into it, and is remembered for a custom type
// only. A store that refuses loses only the memory.
async function pickRole($: Pick<EngineInterface, 'state' | 'store' | 'clock'>, order: number, value: string) {
  if (isPickable(value)) {
    const at = await timeOrNone($)
    let type: string | undefined
    try {
      await update($, runs, held => {
        const run = runOf(held, order)
        type = run?.type
        // The role it already wears stays as it is, with no hop; for a custom type the pick is still remembered.
        if (run?.role?.id === value) return held
        return reassigned(held, order, { id: value, source: 'manual', ...(at === undefined ? {} : { at }) })
      })
    } catch {
      type = undefined
    }
    if (type !== undefined && isCustomType(type)) {
      try {
        await writeStore($, { key: roleKey(type), role: value })
      } catch {
        // the run keeps its pick; the next spawn of its type is detected as usual
      }
    }
  }
  await closePicker($)
}

async function listSettings($: Pick<EngineInterface, 'store'>): Promise<CommandRunResult> {
  try {
    return say(settingsText(readPrefs(await $.store.get('prefs'))))
  } catch {
    return say(STRINGS.cannotStore)
  }
}

async function changeSetting($: Pick<EngineInterface, 'store' | 'ui'>, change: Partial<Prefs>, answer: string): Promise<CommandRunResult> {
  try {
    await writeStore($, { key: 'prefs', change })
  } catch {
    return say(STRINGS.cannotStore)
  }
  redraw($)
  return say(answer)
}

// `/possums roles`: the gallery takes the list's place, in a pane opened or raised, never closed. The flag is set first,
// so the pane's first drawing is the gallery; a pane that cannot be shown takes it back.
async function showGallery($: Pick<EngineInterface, 'ui' | 'state' | 'clock'>): Promise<CommandRunResult> {
  try {
    await update($, view, flags => ({ ...flags, isGalleryOpen: true }))
  } catch {
    return say(STRINGS.cannotToggle)
  }
  const shown = await showPane($, false)
  if (shown.text !== undefined) await closeGallery($)
  return shown
}

// The gallery's close button; the list is drawn again by the write.
async function closeGallery($: Pick<EngineInterface, 'state'>) {
  try {
    await update($, view, flags => ({ ...flags, isGalleryOpen: false }))
  } catch {
    // the gallery stays until the pane closes
  }
}

// Finished's show button: the person's choice, kept across sessions.
async function showFinished($: Pick<EngineInterface, 'store' | 'ui'>, isOpen: boolean) {
  try {
    await writeStore($, { key: 'prefs', change: { finishedOpen: isOpen } })
  } catch {
    return
  }
  redraw($)
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

// The same for the Lead.
async function recordLead($: Pick<EngineInterface, 'state'>, change: (held: Lead) => Lead) {
  try {
    await update($, lead, change)
  } catch {
    // the event goes on as the engine gave it
  }
}

// The clock's time, or nothing when it cannot be read.
async function timeOrNone($: Pick<EngineInterface, 'clock'>): Promise<number | undefined> {
  try {
    return await $.clock.now()
  } catch {
    return undefined
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

// The role the spawn's type, its remembered pick and its description settle, worked out inside the record's guard.
function dressed(spawn: Spawn, remembered?: RoleId): Spawn {
  const role = atSpawn(spawn.type, spawn.description, remembered)
  return role === undefined ? spawn : { ...spawn, role }
}

// The person's pick remembered for a custom type; the generic and built-in types read nothing.
async function rememberedFor($: Pick<EngineInterface, 'store'>, type: unknown): Promise<RoleId | undefined> {
  if (typeof type !== 'string' || !isCustomType(type)) return undefined
  try {
    return rememberedOf(await $.store.get(roleKey(type)))
  } catch {
    return undefined
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

async function prefsWhileDrawing($: Pick<EngineInterface, 'store'>): Promise<Prefs> {
  try {
    return readPrefs(await $.store.get('prefs'))
  } catch {
    return readPrefs(undefined)
  }
}

// A value that cannot be read draws as its start (no runs, the Lead unmeasured, the default prefs), and a clock that
// cannot be read leaves times unknown. Drawing never arms the clock: a drawing's `$` may not serve a later beat.
async function drawPane(
  $: Pick<EngineInterface, 'state' | 'clock' | 'ui' | 'store'>,
  e: Parameters<EngineInterface['ui']['resolve']>[0] & { surface: string },
) {
  isPaneOpen = true
  const table = $.ui.resolve(e)
  const readRuns = await read($, runs).catch(() => undefined)
  const held = readRuns ?? NO_RUNS
  const main = await read($, lead).catch(() => NO_LEAD)
  const flags = await read($, view).catch(() => NO_FLAGS)
  const prefs = await prefsWhileDrawing($)
  const now = await $.clock.now().catch(() => Number.NaN)
  const shown = shownRuns(held)
  if (shown.some(keepsClock)) noteBeat(now)
  // A refused read says nothing of the runs, so it leaves the clock alone.
  else if (readRuns !== undefined) stopClock()
  const keyOf = (run: (typeof shown)[number]) => run.agentId ?? `spawn-${run.order}`
  return panel(
    table,
    e.surface === 'terminal',
    {
      lead: leadFigures(main),
      session: totals(main, held, now),
      rows: shown.map(run => rowData(run, keyOf(run), figures(run, now), now)),
      isFinishedOpen: prefs.finishedOpen,
      look: { set: prefs.theme, motion: prefs.motion },
      ...(flags.isGalleryOpen ? { gallery: galleryOf(ART, prefs.theme) } : {}),
      ...(flags.pickerFor === undefined ? {} : { pickerFor: flags.pickerFor }),
    },
    {
      onToggleFinished: () => void showFinished($, !prefs.finishedOpen),
      onCloseGallery: () => void closeGallery($),
      onToggleRole: order => void toggleRole($, order),
      onPickRole: (order, value) => void pickRole($, order, value),
      onCancelRole: () => void closePicker($),
    },
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'possums', description: STRINGS.commandDescription, argumentHint: STRINGS.commandHint, immediate: true })
    const started = await next(e)
    // A reload drops the clock; a live run starts it again, and its first beat finds whether the pane is open.
    try {
      await armIfLive($)
    } catch {
      // the times move on events alone
    }
    return started
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: 'possums' }, async ($, e) => {
    const words = parseWords(e.args)
    switch (words.kind) {
      case 'toggle':
        return showPane($, true)
      case 'open':
        return showPane($, false)
      case 'roles':
        return showGallery($)
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
    if (closed.deny !== undefined) return closed
    isPaneOpen = false
    stopClock()
    // Any close ends the gallery and the role picker, so the pane opens on the list; the person's is also kept. A close
    // that changes none of them writes nothing.
    const isPerson = e.origin.kind === 'person'
    try {
      const held = isPerson ? undefined : await read($, view)
      if (held === undefined || held.isGalleryOpen || held.pickerFor !== undefined) {
        await update($, view, flags => ({ ...withoutPicker(flags), isGalleryOpen: false, ...(isPerson ? { isClosedByPerson: true } : {}) }))
      }
    } catch {
      // the close stands; only the flags are lost
    }
    return closed
  }).catch((_$, e, next) => next(e))

  // Each event passes on exactly what the engine gave; only subagents' events are recorded, the main loop's never
  // call `$`. A tool call's start is read from its step's result: `tool.call` and `tool.run` stay unhooked, since
  // the declarations say a hook there turns off a tool's move to the background, even as a pass-through.
  // A new agent may open the pane (`autoOpen`), unawaited, once the engine has started it. Whether its row starts the
  // list is learnt inside the write that opens the row, whose last try is the one kept, so agents spawned together open
  // it once.
  on('agent.spawn', async ($, e, next) => {
    const spawn = spawnOf(e)
    const remembered = await rememberedFor($, spawn.type)
    let isFirst = false
    await recordAt($, (held, at) => {
      const opened = spawnOpened(held, dressed(spawn, remembered), at)
      isFirst = opened !== held && isEmpty(held)
      return opened
    })
    keepTime($)
    let result: AgentSpawnResult
    try {
      result = await next(e)
    } catch (error) {
      await recordAt($, (held, at) => spawnSettled(held, dressed(spawn, remembered), { isDenied: true }, at))
      throw error
    }
    await recordAt($, (held, at) => {
      const settled = spawnSettled(held, dressed(spawn, remembered), settledOf(result), at)
      // A fork no tool call starts opens its row only here.
      if (spawn.key === '') isFirst = settled !== held && isEmpty(held)
      return settled
    })
    if (spawn.resumes === undefined && result.agentId !== undefined && result.deny === undefined) void autoOpen($, isFirst)
    return result
  }).catch((_$, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    const started = await next(e)
    const { agentId } = e
    if (agentId !== undefined) {
      await record($, held => turnStarted(held, agentId))
      keepTime($)
    }
    return started
  }).catch((_$, e, next) => next(e))

  // The main session's turn counts once, at its end: its tokens and time are the Lead's.
  on('turn.complete', async ($, e, next) => {
    const completed = await next(e)
    const { agentId } = e
    if (agentId !== undefined) {
      // A run no rule settled is Helper at its end.
      await recordAt($, (held, at) => fellBack(turnEnded(held, agentId, { reason: e.reason, hasText: e.answer.trim() !== '' }, at), at, HELPER))
    } else await recordLead($, held => turnCounted(held, e.usage, e.durationMs))
    return completed
  }).catch((_$, e, next) => next(e))

  on('classic.SessionStart', async ($, e, next) => {
    const started = await next(e)
    if (STARTS_OVER.has(e.source)) {
      stopClock()
      await record($, held => cleared(held))
      await recordLead($, () => NO_LEAD)
    }
    return started
  }).catch((_$, e, next) => next(e))

  // The Lead's context, after each main turn.
  on('session.measure', async ($, e, next) => {
    const echoed = await next(e)
    await recordLead($, held => measured(held, e.context))
    return echoed
  }).catch((_$, e, next) => next(e))
  on('classic.PermissionRequest', (_$, e, next) => next(e)).catch((_$, e, next) => next(e))

  // Every chunk is delegated untouched; the step is read once its stream has ended.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const { agentId } = e
    if (agentId !== undefined) {
      // The clock settles Helper at T-04 before the step's calls count, whether or not the pane is open; a clock that
      // cannot be read loses only that, never the step's record.
      const at = await timeOrNone($)
      await record($, held => {
        const calls = callsOf(result.toolUses)
        const effort = e.effort === undefined ? undefined : String(e.effort)
        const due = at === undefined ? held : fellBack(held, at, HELPER)
        return stepped(due, agentId, {
          model: result.usage?.model ?? e.model,
          effort,
          usage: usageOf(result),
          activity: calls.activity,
          calls: calls.count,
          tools: toolsSeen(weakOf(due, agentId), calls.clues),
          hasBackground: calls.hasBackground,
          ...(at === undefined ? {} : { at }),
        })
      })
      keepTime($)
    }
    return result
  }).catch(async function* (_$, e, next) {
    return yield* next(e)
  })
}
