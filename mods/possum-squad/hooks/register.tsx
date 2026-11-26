import type { AgentSpawnInput, AgentSpawnResult, CommandRunResult, EngineInterface, Register, Timer, TurnStepResult } from 'claude-code'
import { atom, read, update } from 'claude-code'

import type { Lead, Limit, RoleId, Runs, Tokens, View } from '../types/index'
import { PANE_COLUMNS } from './config'
import { leadFigures, limitsOf, measured, NO_LEAD, startedOver, totals, turnCounted } from './model/lead'
import {
  asked,
  cleared,
  fellBack,
  figures,
  hasKept,
  heldOut,
  isEmpty,
  isLive,
  keepsClock,
  listed,
  NO_RUNS,
  parentsOf,
  reassigned,
  runOf,
  type Spawn,
  shownRuns,
  spawnOpened,
  spawnSettled,
  stepped,
  summarized,
  turnEnded,
  turnStarted,
  weakOf,
} from './model/runs'
import { rolledUp } from './model/nesting'
import { callsOf } from './model/tools'
import { atSpawn, HELPER, isCustomType, isPickable, rememberedOf, toolsSeen } from './roles/rules'
import { changeOf, mergePrefs, type Prefs, parseWords, readPrefs, SETTING_NAMES, SETTINGS, settingsText } from './settings'
import { galleryOf } from './sprites'
import { ART } from './sprites/data'
import { STRINGS } from './strings'
import { movedPart, partsOf, shownPart } from './view/gallery'
import { panel } from './view/panel'
import { rowData } from './view/runs'
import { askedToast, endedToasts } from './view/toasts'

export const PANE = 'possum-squad'
// Bump the shape when View's fields change: an older value then reads as absent.
export const NO_FLAGS: View = { isClosedByPerson: false, isGalleryOpen: false }
export const view = atom({ plugin: 'possum-squad', key: 'view' } as const, NO_FLAGS, { shape: 'view-5' })
// Bump the shape when Runs or Run change their fields.
export const runs = atom({ plugin: 'possum-squad', key: 'runs' } as const, NO_RUNS, { shape: 'runs-9' })
// Bump the shape when Lead changes its fields.
export const lead = atom({ plugin: 'possum-squad', key: 'lead' } as const, NO_LEAD, { shape: 'lead-2' })

// A clear, a resume or a fork of the session starts the list over.
const STARTS_OVER = new Set(['clear', 'resume', 'fork'])

// The plan's limits last measured, in module memory: the engine empties `$.state` at a clear, and the limits are the
// account's, so the Lead starts over with them. A reload drops them until a measure or a drawing brings them back.
let knownLimits: Limit[] | undefined

// The running main turn and its start by the clock, in module memory: no state write per turn. A reload or a clear
// drops it; the turn's end counts the turn all the same.
let mainTurn: { turnId: string; at: number } | undefined
// The main turn whose end was heard last, so a start that lands after its own end is not kept.
let endedTurnId: string | undefined

// What the beat, the recording hooks and the list's read reach; a toast needs the panes and the store.
type Watching = Pick<EngineInterface, 'agent' | 'clock' | 'state' | 'store' | 'ui'>

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

function armClock($: Watching) {
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

// The clock runs while a main turn runs, or a run is live or may still fall back to Helper.
const keepsTime = (held: Runs) => mainTurn !== undefined || shownRuns(held).some(keepsClock)

// A closed pane, or nothing that keeps time, stops the clock. A pane open behind another keeps it, undrawn, so its times are right
// the moment it shows. A role settled here redraws the pane by its write. The gallery's sprites move inside themselves,
// so a beat leaves it undrawn: a redraw would send every one of its sprites again for the header's time alone.
async function tick($: Watching, own: number) {
  if (own !== generation) return
  beats++
  try {
    const pane = (await $.ui.panes()).find(one => one.id === PANE)
    isPaneOpen = pane !== undefined
    if (pane === undefined) return stopClock(own)
    // A refused read says nothing of the runs: a main turn still keeps time, as a drawing does.
    const held = await read($, runs).catch(error => {
      if (mainTurn === undefined) throw error
      return NO_RUNS
    })
    if (!keepsTime(held)) return stopClock(own)
    const flags = await read($, view).catch(() => NO_FLAGS)
    const hasSettled = await settleHelpers($, held)
    if (hasKept(held)) await settleHeld($, held)
    // One list read a beat at most: for a kept end, else for the summaries of the live rows shown.
    else if (pane.isShown && !flags.isGalleryOpen && shownRuns(held).some(isLive)) void readList($)
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

// While a turn's end is kept, each beat ends a hold past its bound, then reads the list; a fault leaves the clock running.
async function settleHeld($: Watching, held: Runs) {
  try {
    const now = await $.clock.now()
    if (heldOut(held, now) !== held) {
      let toasts: string[] = []
      await update($, runs, latest => {
        const ended = heldOut(latest, now)
        const next = ended === latest ? latest : fellBack(ended, now, HELPER)
        toasts = endedToasts(latest, next)
        return next
      })
      for (const text of toasts) void toastUnseen($, text)
    }
  } catch {
    // the next beat tries again
  }
  void readList($)
}

// Reads start unawaited each beat, so one answered late must not undo a later one's: each is numbered.
let readsStarted = 0
let readApplied = 0

// The engine's fallback label is its own description, which may not be the row's (a resume's, another plugin's): no summary.
const labelOf = (agent: { label?: unknown; description?: unknown }) =>
  typeof agent.label !== 'string' ? undefined : agent.label === agent.description ? '' : agent.label

// The engine's list settles each kept turn's end (`listed`) and gives each live row its progress summary
// (`summarized`); a list that cannot be read leaves the summaries be. Nothing awaits it (N-07), so every fault ends here.
async function readList($: Watching) {
  const own = ++readsStarted
  let statuses: Map<string, string> | undefined
  const labels = new Map<string, string>()
  try {
    const agents: unknown = await $.agent.list()
    const known = Array.isArray(agents) ? agents.filter(isListed) : undefined
    statuses = known === undefined ? undefined : new Map(known.map(agent => [agent.id, agent.status] as const))
    for (const agent of known ?? []) {
      const label = labelOf(agent)
      if (label !== undefined) labels.set(agent.id, label)
    }
  } catch {
    statuses = undefined
  }
  const now = await timeOrNone($)
  if (own < readApplied) return
  readApplied = own
  let toasts: string[] = []
  const settle = (latest: Runs) => {
    if (own < readApplied) return latest
    const ended = listed(latest, statuses, now)
    return summarized(now === undefined || ended === latest ? ended : fellBack(ended, now, HELPER), labels)
  }
  try {
    const held = await read($, runs)
    if (settle(held) === held) return
    await update($, runs, latest => {
      const next = settle(latest)
      toasts = endedToasts(latest, next)
      return next
    })
  } catch {
    return
  }
  for (const text of toasts) void toastUnseen($, text)
}

const isListed = (agent: unknown): agent is { id: string; status: string; label?: unknown; description?: unknown } =>
  typeof agent === 'object' &&
  agent !== null &&
  typeof (agent as { id?: unknown }).id === 'string' &&
  typeof (agent as { status?: unknown }).status === 'string'

// Where the pane is open and a run works, the clock starts, or starts again after the engine ended it. `every` is
// synchronous, so no event waits on it.
function keepTime($: Watching) {
  if (!isPaneOpen) return
  try {
    armClock($)
  } catch {
    // the times move on events alone
  }
}

async function armIfLive($: Watching, isFresh = false) {
  if (mainTurn === undefined && !keepsTime(await read($, runs))) return
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
async function showPane($: Watching, mayClose: boolean): Promise<CommandRunResult> {
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
// undrawn (too narrow for an unasked open) is open, so it starts the clock too: a drawing never does.
async function autoOpen($: Watching, isFirst: boolean) {
  try {
    const { autoOpen: when } = readPrefs(await $.store.get('prefs'))
    if (when === 'never' || (when === 'first' && !isFirst)) return
    if ((await read($, view)).isClosedByPerson) return
    if ((await $.ui.panes()).some(one => one.id === PANE)) return
    await $.ui.open({ id: PANE, title: STRINGS.title, columns: PANE_COLUMNS })
    isPaneOpen = true
    await armIfLive($)
  } catch {
    // the pane waits for /possums
  }
}

// A toast only where the person cannot see the list: the pane closed, behind another's tab, waiting undrawn, or showing
// the gallery or the collapsed view. The event that raised it does not wait for it (N-07), so every fault here ends
// quietly.
async function toastUnseen($: Pick<EngineInterface, 'ui' | 'state' | 'store'>, text: string) {
  try {
    const isShown = (await $.ui.panes()).some(one => one.id === PANE && one.isShown)
    if (isShown && !(await read($, view).catch(() => NO_FLAGS)).isGalleryOpen && !(await prefsOrDefaults($)).collapsed) return
    $.ui.toast(text)
  } catch {
    // the row says it when the pane is next seen
  }
}

const withoutPicker = ({ pickerFor: _, ...flags }: View): View => flags
const withoutPeek = ({ peekFor: _, ...flags }: View): View => flags
const withoutGallery = ({ galleryPart: _, ...flags }: View): View => ({ ...flags, isGalleryOpen: false })

// A row's role button opens its picker, or closes it when it is that row's already.
async function toggleRole($: Pick<EngineInterface, 'state'>, order: number) {
  try {
    await update($, view, flags => (flags.pickerFor === order ? withoutPicker(flags) : { ...flags, pickerFor: order }))
  } catch {
    // the picker stays as it was
  }
}

// A row's Peek button opens its Peek, or closes it when it is that row's already; one is open at a time.
async function togglePeek($: Pick<EngineInterface, 'state'>, order: number) {
  try {
    await update($, view, flags => (flags.peekFor === order ? withoutPeek(flags) : { ...flags, peekFor: order }))
  } catch {
    // Peek stays as it was
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
// so the pane's first drawing is the gallery; a pane that cannot be shown takes it back. A gallery already open keeps
// its part; every close drops it, so one opening starts on the first.
async function showGallery($: Watching): Promise<CommandRunResult> {
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
    await update($, view, withoutGallery)
  } catch {
    // the gallery stays until the pane closes
  }
}

// The gallery's previous and next, one part either way, wrapping at the ends.
async function moveGallery($: Pick<EngineInterface, 'state'>, step: 1 | -1) {
  const gallery = galleryOf(ART, ART.defaultSet)
  try {
    await update($, view, flags =>
      flags.isGalleryOpen ? { ...flags, galleryPart: movedPart(shownPart(gallery, flags.galleryPart ?? 0), step, partsOf(gallery)) } : flags,
    )
  } catch {
    // the part stays as it was
  }
}

// The header's collapse button and the collapsed view's way back: the person's choice, kept across sessions.
async function collapse($: Pick<EngineInterface, 'store' | 'ui'>, isCollapsed: boolean) {
  try {
    await writeStore($, { key: 'prefs', change: { collapsed: isCollapsed } })
  } catch {
    return
  }
  redraw($)
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
// the panel's record, never the event. While a turn's end is kept, each record reads the list, the pane closed or not.
async function record($: Watching, change: (held: Runs) => Runs) {
  try {
    listAfter($, await update($, runs, change))
  } catch {
    // the event goes on as the engine gave it
  }
}

function listAfter($: Watching, written: Runs) {
  if (hasKept(written)) void readList($)
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
async function recordAt($: Watching, change: (held: Runs, at: number) => Runs) {
  try {
    const at = await $.clock.now()
    listAfter($, await update($, runs, held => change(held, at)))
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
  if (typeof e.prompt === 'string') spawn.brief = e.prompt
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

async function prefsOrDefaults($: Pick<EngineInterface, 'store'>): Promise<Prefs> {
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
  e: Parameters<EngineInterface['ui']['resolve']>[0] & { surface: string; props?: { placement?: unknown } },
) {
  isPaneOpen = true
  const table = $.ui.resolve(e)
  const readRuns = await read($, runs).catch(() => undefined)
  const held = readRuns ?? NO_RUNS
  const main = await read($, lead).catch(() => NO_LEAD)
  if (main.limits !== undefined) knownLimits = main.limits
  const flags = await read($, view).catch(() => NO_FLAGS)
  const prefs = await prefsOrDefaults($)
  const now = await $.clock.now().catch(() => Number.NaN)
  const shown = shownRuns(held)
  if (keepsTime(held)) noteBeat(now)
  // A refused read says nothing of the runs, so it leaves the clock alone.
  else if (readRuns !== undefined) stopClock()
  const keyOf = (run: (typeof shown)[number]) => run.agentId ?? `spawn-${run.order}`
  // The estimate is drawn only when asked for, so with `cost` off no dollar figure is in the tree at all.
  const isEstimate = prefs.cost === 'estimate'
  const sum = totals(main, held, now, mainTurn?.at)
  const parents = parentsOf(held.rows)
  const family = rolledUp(held)
  const rowOf = (run: (typeof shown)[number]) => {
    const rolled = family.get(run.order)
    const row = rowData(run, keyOf(run), { ...figures(run, now), ...(rolled === undefined ? {} : { tokens: rolled.tokens }) }, now, run.order === flags.peekFor)
    const parent = parents.get(run.order)
    if (parent !== undefined) row.parent = parent
    if (isEstimate) row.usd = rolled?.usd ?? run.usd
    return row
  }
  return panel(
    table,
    e.surface === 'terminal',
    {
      lead: leadFigures(main),
      session: {
        tokens: sum.tokens,
        workedMs: sum.workedMs,
        ...(main.limits === undefined ? {} : { limits: main.limits }),
        ...(isEstimate ? { usd: sum.usd } : {}),
      },
      rows: shown.map(rowOf),
      isFinishedOpen: prefs.finishedOpen,
      look: { set: prefs.theme, motion: prefs.motion },
      ...(flags.isGalleryOpen ? { gallery: galleryOf(ART, prefs.theme), galleryPart: flags.galleryPart ?? 0 } : {}),
      ...(flags.pickerFor === undefined ? {} : { pickerFor: flags.pickerFor }),
      ...(flags.peekFor === undefined ? {} : { peekFor: flags.peekFor }),
      isCollapsed: prefs.collapsed,
      // Any seat but the minimized pane draws in full.
      isWidget: e.props?.placement === 'widget',
    },
    {
      onToggleFinished: () => void showFinished($, !prefs.finishedOpen),
      onCloseGallery: () => void closeGallery($),
      onMoveGallery: step => void moveGallery($, step),
      onToggleRole: order => void toggleRole($, order),
      onPickRole: (order, value) => void pickRole($, order, value),
      onCancelRole: () => void closePicker($),
      onTogglePeek: order => void togglePeek($, order),
      onCollapse: isCollapsed => void collapse($, isCollapsed),
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
    // Any close ends the gallery, the role picker and Peek, so the pane opens on the list; the person's is also kept. A
    // close that changes none of them writes nothing.
    const isPerson = e.origin.kind === 'person'
    try {
      const held = isPerson ? undefined : await read($, view)
      if (held === undefined || held.isGalleryOpen || held.pickerFor !== undefined || held.peekFor !== undefined) {
        await update($, view, flags => ({ ...withoutGallery(withoutPeek(withoutPicker(flags))), ...(isPerson ? { isClosedByPerson: true } : {}) }))
      }
    } catch {
      // the close stands; only the flags are lost
    }
    return closed
  }).catch((_$, e, next) => next(e))

  // Each event passes on exactly what the engine gave; subagents' events are recorded, and of the main loop's, its turn's
  // start and end alone. A tool call's start is read from its step's result: `tool.call` and `tool.run` stay unhooked, since
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

  // The main loop's turn start is timed, and starts the clock in an open pane, so the session line moves through the turn.
  on('turn.start', async ($, e, next) => {
    const started = await next(e)
    const { agentId } = e
    if (agentId !== undefined) {
      const at = await timeOrNone($)
      await record($, held => turnStarted(held, agentId, at))
      keepTime($)
    } else {
      const at = await timeOrNone($)
      if (at !== undefined && e.turnId !== endedTurnId) {
        mainTurn = { turnId: e.turnId, at }
        keepTime($)
      }
    }
    return started
  }).catch((_$, e, next) => next(e))

  // The main session's turn counts once, at its end: its tokens and time are the Lead's, its running time dropped. A
  // subagent's end, its Helper and its toast wait for the engine's list.
  on('turn.complete', async ($, e, next) => {
    const { agentId } = e
    if (agentId !== undefined) {
      const completed = await next(e)
      await recordAt($, (held, at) =>
        fellBack(turnEnded(held, agentId, { reason: e.reason, hasText: e.answer.trim() !== '', answer: e.answer }, at), at, HELPER),
      )
      return completed
    }
    // The start kept is dropped whatever `next` does; one from a turn whose end went unheard times nothing.
    endedTurnId = e.turnId
    const kept = mainTurn
    try {
      const completed = await next(e)
      const startedAt = kept?.turnId === e.turnId ? kept.at : undefined
      const now = startedAt === undefined ? undefined : await timeOrNone($)
      await recordLead($, held => turnCounted(held, e.usage, e.durationMs, now === undefined || startedAt === undefined ? undefined : now - startedAt))
      return completed
    } finally {
      if (mainTurn === kept) mainTurn = undefined
    }
  }).catch((_$, e, next) => next(e))

  on('classic.SessionStart', async ($, e, next) => {
    const started = await next(e)
    if (STARTS_OVER.has(e.source)) {
      mainTurn = undefined
      stopClock()
      await record($, held => cleared(held))
      await recordLead($, () => startedOver(knownLimits))
    }
    return started
  }).catch((_$, e, next) => next(e))

  // The Lead's context and the plan's limits, after each main turn and when a limit moves a point.
  on('session.measure', async ($, e, next) => {
    const echoed = await next(e)
    knownLimits = limitsOf(e.rateLimits) ?? knownLimits
    await recordLead($, held => measured(held, e.context, e.rateLimits))
    return echoed
  }).catch((_$, e, next) => next(e))

  // A subagent's call waits on a person's answer: its row needs them until the call moves on, at that agent's next step
  // or its end. An answer another hook gave shows no prompt; a request without `agent_id` is the main session's, which
  // the person already sees.
  on('classic.PermissionRequest', async ($, e, next) => {
    const answered = await next(e)
    const { agent_id: agentId } = e
    if (typeof agentId === 'string' && answered.decision === undefined) {
      const at = await timeOrNone($)
      let toast: string | undefined
      await record($, held => {
        const moved = asked(held, agentId, at)
        toast = askedToast(held, moved, agentId)
        return moved
      })
      if (toast !== undefined) void toastUnseen($, toast)
    }
    return answered
  }).catch((_$, e, next) => next(e))

  // Every chunk is delegated untouched; the step is read once its stream has ended.
  on('turn.step', async function* ($, e, next) {
    const { agentId } = e
    // A subagent's step is timed at its start too: the engine checks its calls before its stream ends.
    const began = agentId === undefined ? undefined : await timeOrNone($)
    const result = yield* next(e)
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
          ...(result.usage?.ephemeral_1h_input_tokens === undefined ? {} : { hourWrites: result.usage.ephemeral_1h_input_tokens }),
          activity: calls.activity,
          actions: calls.actions,
          files: calls.files,
          calls: calls.count,
          tools: toolsSeen(weakOf(due, agentId), calls.clues),
          hasBackground: calls.hasBackground,
          ...(at === undefined ? {} : { at }),
          ...(began === undefined ? {} : { began }),
        })
      })
      keepTime($)
    }
    return result
  }).catch(async function* (_$, e, next) {
    return yield* next(e)
  })
}
