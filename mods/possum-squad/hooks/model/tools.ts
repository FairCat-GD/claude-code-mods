import type { Activity } from '../../types/index'

// About what one line of the pane shows; the rest of a command or path stays out of state other plugins read.
export const TARGET_CHARS = 80

// The argument that says what a call is about, by tool.
const TARGETS: Record<string, string> = {
  Read: 'file_path',
  Write: 'file_path',
  Edit: 'file_path',
  MultiEdit: 'file_path',
  NotebookEdit: 'notebook_path',
  Bash: 'command',
  Grep: 'pattern',
  Glob: 'pattern',
  WebFetch: 'url',
  WebSearch: 'query',
  Agent: 'description',
  Task: 'description',
  Skill: 'skill',
}

// The engine's own hand-back of a subagent's report: no work the row should show.
const UNSHOWN = new Set(['SubagentHandback'])

function targetOf(tool: string, input: unknown): string | undefined {
  const field = TARGETS[tool]
  if (field === undefined || typeof input !== 'object' || input === null) return undefined
  const value = (input as Record<string, unknown>)[field]
  if (typeof value !== 'string') return undefined
  const line = value.trim().split('\n')[0]?.trim() ?? ''
  if (line === '') return undefined
  return line.length > TARGET_CHARS ? line.slice(0, TARGET_CHARS) : line
}

// The calls a model request asked for, as a row's activity: the last shown one, and how many are shown.
export function callsOf(uses: unknown, at: number): { activity?: Activity; count: number } {
  if (!Array.isArray(uses)) return { count: 0 }
  const shown = uses.filter(
    (use): use is { name: string; input?: unknown } => typeof use === 'object' && use !== null && typeof use.name === 'string' && !UNSHOWN.has(use.name),
  )
  const last = shown[shown.length - 1]
  if (last === undefined) return { count: 0 }
  const target = targetOf(last.name, last.input)
  return { activity: target === undefined ? { tool: last.name, at } : { tool: last.name, target, at }, count: shown.length }
}
