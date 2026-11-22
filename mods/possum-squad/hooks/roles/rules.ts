import type { Role, RoleId } from '../../types/index'
import { WEAK_CALLS_FOR_SCOUT } from '../config'
import { BUILTIN_TYPES, DESIGN_AS_PLANNING, DESIGN_VERBS, GENERIC_TYPES, GIT_SHIP, GUARD, KEYWORDS, STRONG_VERBS, TEST_RUNNERS } from './words'

// The role rules, a port of the round's reference with its behaviour unchanged. Pure: text and call names in, a role
// out. A value that is not a string reads as empty, so a malformed event never throws here.

export const HELPER: Role = { id: 'helper', source: 'fallback' }

const textOf = (value: unknown) => (typeof value === 'string' ? value : '')

export const words = (text: unknown): string[] =>
  textOf(text)
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9+#.'-]*/g) ?? []

// A pattern's words against the tokens at any place, or at the start only.
export function hit(pattern: string, tokens: readonly string[], startOnly = false): boolean {
  const parts = pattern.trim().split(/\s+/)
  const last = startOnly ? 0 : tokens.length - parts.length
  for (let at = 0; at <= last; at++) {
    if (at + parts.length > tokens.length) continue
    const matches = parts.every((part, i) => {
      const token = tokens[at + i] ?? ''
      return part.endsWith('*') ? token.startsWith(part.slice(0, -1)) : token === part
    })
    if (matches) return true
  }
  return false
}

export function fromText(text: unknown): RoleId | undefined {
  const tokens = words(text)
  if (tokens.length === 0) return undefined
  if (GUARD.some(key => hit(key, tokens))) return 'guard'
  if (DESIGN_VERBS.has(tokens[0] ?? '')) return DESIGN_AS_PLANNING.some(key => hit(key, tokens)) ? 'planner' : 'artist'
  for (const [role, verbs] of STRONG_VERBS) if (verbs.some(verb => hit(verb, tokens, true))) return role
  for (const [role, keys] of KEYWORDS) if (keys.some(key => hit(key, tokens))) return role
  return undefined
}

const EDITS = new Set(['edit', 'write', 'notebookedit', 'multiedit'])
const WEB = new Set(['websearch', 'webfetch'])
const WEAK = new Set(['read', 'grep', 'glob', 'ls'])
const byTools = (id: RoleId): Role => ({ id, source: 'tools' })

export type ToolsSeen = { weak: number; role?: Role }

// Calls in order, each `Tool` or `Bash:<command>`, read on from the reads and searches already seen, so a run's calls
// can arrive a step at a time. A decisive call settles at once; any other shell command is no evidence.
export function toolsSeen(weak: number, calls: readonly unknown[]): ToolsSeen {
  let seen = weak
  for (const call of calls) {
    const text = textOf(call)
    const colon = text.indexOf(':')
    const name = (colon < 0 ? text : text.slice(0, colon)).toLowerCase()
    if (EDITS.has(name)) return { weak: seen, role: byTools('builder') }
    if (WEB.has(name)) return { weak: seen, role: byTools('researcher') }
    if (name.includes('chrome') || name.includes('browser') || name.includes('playwright') || name.includes('computer')) {
      return { weak: seen, role: byTools('pilot') }
    }
    if (name === 'bash') {
      const command = (colon < 0 ? '' : text.slice(colon + 1)).toLowerCase()
      if (TEST_RUNNERS.test(command)) return { weak: seen, role: byTools('tester') }
      if (GIT_SHIP.test(command)) return { weak: seen, role: byTools('courier') }
      continue
    }
    if (WEAK.has(name)) {
      seen++
      if (seen >= WEAK_CALLS_FOR_SCOUT) return { weak: seen, role: byTools('scout') }
    }
  }
  return { weak: seen }
}

export const fromTools = (calls: readonly unknown[]): RoleId | undefined => toolsSeen(0, calls).role?.id

export type Detection = {
  description: unknown
  // The agent type as the engine spells it (`Explore`, `general-purpose`, a plugin's agent).
  type?: unknown
  tools?: readonly unknown[]
  stated?: RoleId
  // The person's pick for this agent type.
  remembered?: RoleId
  // No rule can fire any more, so the fallback applies.
  timedOut: boolean
}

// The rules in order, stopping at the first hit; undefined while nothing has settled the role.
export function detect(detection: Detection): Role | undefined {
  const type = textOf(detection.type).toLowerCase()
  if (detection.stated) return { id: detection.stated, source: 'stated' }
  if (detection.remembered && !GENERIC_TYPES.has(type) && !BUILTIN_TYPES.has(type)) return { id: detection.remembered, source: 'remembered' }
  const builtin = BUILTIN_TYPES.get(type)
  if (builtin !== undefined) return { id: builtin, source: 'type' }
  if (!GENERIC_TYPES.has(type)) {
    const named = fromText(type.replaceAll('-', ' ').replaceAll('_', ' '))
    if (named !== undefined) return { id: named, source: 'name' }
  }
  const described = fromText(detection.description)
  if (described !== undefined) return { id: described, source: 'keywords' }
  const called = fromTools(detection.tools ?? [])
  if (called !== undefined) return { id: called, source: 'tools' }
  return detection.timedOut ? HELPER : undefined
}

// What a spawn's type and description settle, before any call.
export const atSpawn = (type: unknown, description: unknown): Role | undefined => detect({ description, type, timedOut: false })
