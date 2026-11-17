// What the spike build hears: each event by the engine's word and by who raised it, how often, in
// what order its result came back, and the last shape seen. Field names and types, never a value.

export const EVENTS = [
  'agent.spawn',
  'turn.start',
  'turn.step',
  'turn.complete',
  'tool.call',
  'tool.check',
  'classic.PermissionRequest',
  'session.measure',
] as const
export type HookedEvent = (typeof EVENTS)[number]

export type Limit = { kind: string; percentUsed: number }
export type Entry = {
  event: HookedEvent
  word?: string
  isSubagent: boolean
  count: number
  first: number
  last: number
  input: string
  result: string
}
export type SpikeLog = { arrivals: number; entries: Map<string, Entry>; measured?: Limit[] }

// The engine's own words, shown only when they are one of these; anything else shows as `other`.
const WORDS: Partial<Record<HookedEvent, { from: 'input' | 'result'; field: string; known: readonly string[] }>> = {
  'tool.check': { from: 'result', field: 'decision', known: ['allow', 'ask', 'deny'] },
  'turn.complete': { from: 'input', field: 'reason', known: ['answer', 'aborted', 'error', 'refusal'] },
}
const OTHER = 'other'

// Fields the engine defines, opened one level; a tool's arguments keep their names, never what is inside.
const OPENED = new Set(['usage', 'context', 'cost', 'rateLimits', 'resume', 'toolUses', 'decision', 'effort', 'input', 'tool_input'])
const SUBAGENT_FIELDS = ['agentId', 'agent_id', 'parentAgentId']

const typeOf = (value: unknown) => (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value)
const fieldOf = (value: unknown, name: string): unknown => (typeOf(value) === 'object' ? (value as Record<string, unknown>)[name] : undefined)

const keysOf = (value: unknown) =>
  `{${Object.entries(value as Record<string, unknown>)
    .map(([name, field]) => `${name} ${typeOf(field)}`)
    .join(', ')}}`

const opened = (value: unknown) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return `[${typeOf(value[0]) === 'object' ? keysOf(value[0]) : typeOf(value[0])}]`
  }
  return typeOf(value) === 'object' ? keysOf(value) : typeOf(value)
}

export function shapeOf(value: unknown): string {
  if (typeOf(value) !== 'object') return typeOf(value)
  return Object.entries(value as Record<string, unknown>)
    .map(([name, field]) => `${name} ${OPENED.has(name) ? opened(field) : typeOf(field)}`)
    .join(', ')
}

const wordOf = (event: HookedEvent, input: unknown, result: unknown) => {
  const spec = WORDS[event]
  if (spec === undefined) return undefined
  const word = fieldOf(spec.from === 'input' ? input : result, spec.field)
  if (word === undefined) return undefined
  return typeof word === 'string' && spec.known.includes(word) ? word : OTHER
}

// The rate-limit windows an event or a usage answer carries, as kinds and percents only.
export function limitsOf(value: unknown): Limit[] | undefined {
  const windows = fieldOf(value, 'rateLimits')
  if (!Array.isArray(windows)) return undefined
  return windows.flatMap(window => {
    const kind = fieldOf(window, 'kind')
    const percentUsed = fieldOf(window, 'percentUsed')
    return typeof kind === 'string' && typeof percentUsed === 'number' ? [{ kind, percentUsed }] : []
  })
}

export const newLog = (): SpikeLog => ({ arrivals: 0, entries: new Map() })

export function note(log: SpikeLog, event: HookedEvent, input: unknown, result: unknown): void {
  const word = wordOf(event, input, result)
  const isSubagent = SUBAGENT_FIELDS.some(name => fieldOf(input, name) !== undefined)
  const key = `${event}|${word ?? ''}|${isSubagent}`
  const at = ++log.arrivals
  const was = log.entries.get(key)
  log.entries.set(key, {
    event,
    ...(word === undefined ? {} : { word }),
    isSubagent,
    count: (was?.count ?? 0) + 1,
    first: was?.first ?? at,
    last: at,
    input: shapeOf(input),
    result: shapeOf(result),
  })
  if (event === 'session.measure') log.measured = limitsOf(input) ?? []
}

// In the order the events are listed, the main session's before a subagent's, then by word.
export function entriesOf(log: SpikeLog): Entry[] {
  const rank = (entry: Entry) => EVENTS.indexOf(entry.event) * 2 + (entry.isSubagent ? 1 : 0)
  return [...log.entries.values()].sort((a, b) => rank(a) - rank(b) || (a.word ?? '').localeCompare(b.word ?? ''))
}
