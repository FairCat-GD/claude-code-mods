import type { Activity, Excerpt, Run } from '../../types/index'
import { ANIMATION_STEP_MS, DESCRIPTION_CHARS, MOMENT_GRACE_MS, PEEK_CHARS } from '../config'
import { cutTo, isLive, quietMs } from '../model/runs'
import { MOMENT_STEPS, type Moment } from '../sprites/recipes'
import { STRINGS } from '../strings'
import type { PeekData, RowData } from './row'

// "Reading shed/rack.txt"; an MCP tool by its own last name.
export function activityText(activity: Activity): string {
  const verb = Object.hasOwn(STRINGS.activity, activity.tool) ? STRINGS.activity[activity.tool] : undefined
  if (verb !== undefined && activity.target !== undefined) return `${verb} ${activity.target}`
  return STRINGS.using(activity.tool.split('__').pop() || activity.tool)
}

// The one-off a row's sprite plays while its moment is fresh: its ending, its dressing when the role came after its
// arrival, or its arrival, which dresses a role settled meanwhile. A time that cannot be read plays none.
export function momentOf(run: Run, now: number): Moment | undefined {
  const isFresh = (at: number | undefined, steps: number) => at !== undefined && now >= at && now - at < steps * ANIMATION_STEP_MS + MOMENT_GRACE_MS
  if (run.state === 'finished' || run.state === 'stopped') return isFresh(run.endedAt, MOMENT_STEPS[run.state]) ? 'ending' : undefined
  if (run.state === 'failed') return undefined
  const settledAt = run.role?.at
  if (settledAt !== undefined && settledAt - run.startedAt >= MOMENT_STEPS.arrival * ANIMATION_STEP_MS && isFresh(settledAt, MOMENT_STEPS.dressing)) {
    return 'dressing'
  }
  return isFresh(run.startedAt, MOMENT_STEPS.arrival) ? 'arrival' : undefined
}

// A description past one line's worth is cut, so one agent's text never takes the pane past what the desktop draws.
// It is cut by whole characters, so an emoji is never split.
export function shortened(text: string, characters = DESCRIPTION_CHARS): string {
  const cut = cutTo(text, characters)
  return cut.isCut ? `${cut.text}${STRINGS.cut}` : text
}

const excerpt = (kept: Excerpt) => (kept.isCut === true ? `${kept.text}${STRINGS.cut}` : kept.text)

// What Peek shows of a run: its description whole up to Peek's length, and what the model kept. An answer kept from an
// earlier turn while the run works again is said to be the last, not this turn's.
export function peekData(run: Run): PeekData {
  const peek: PeekData = {
    description: shortened(run.description, PEEK_CHARS),
    actions: (run.actions ?? []).map(activityText),
    files: (run.files ?? []).map(file => (file.isCut === true ? `${STRINGS.cut}${file.text}` : file.text)),
  }
  if (run.brief !== undefined) peek.brief = excerpt(run.brief)
  if (run.answer !== undefined) {
    peek.answer = excerpt(run.answer)
    if (isLive(run)) peek.isEarlierAnswer = true
  }
  return peek
}

// A run as its row shows it, given the figures the model worked out for it and the time it is drawn at; with its Peek
// when that is open.
export function rowData(
  run: Run,
  key: string,
  figures: { tokens: number; elapsedMs: number; contextPercent?: number },
  now: number,
  isPeeked = false,
): RowData {
  const quiet = quietMs(run, now)
  const row: RowData = { id: key, order: run.order, state: quiet === undefined ? run.state : 'quiet', description: shortened(run.description), ...figures }
  const moment = momentOf(run, now)
  if (moment !== undefined) row.moment = moment
  if (run.role !== undefined) {
    row.role = STRINGS.roles[run.role.id]
    row.roleId = run.role.id
  }
  if (run.model !== undefined) row.model = run.model
  if (run.effort !== undefined) row.effort = run.effort
  if (quiet !== undefined) row.activity = STRINGS.row.quietFor(Math.floor(quiet / 60_000))
  else if (run.activity !== undefined) row.activity = activityText(run.activity)
  if (run.round > 1) row.round = run.round
  if (isPeeked) row.peek = peekData(run)
  return row
}
