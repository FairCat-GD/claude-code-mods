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

// A call as the role rules read it: the tool's name, and a shell command after it. Read, never stored.
function clueOf(use: { name: string; input?: unknown }): string {
  if (use.name !== 'Bash' || typeof use.input !== 'object' || use.input === null) return use.name
  const command = (use.input as Record<string, unknown>).command
  return typeof command === 'string' ? `Bash:${command}` : use.name
}

// The calls a model request asked for: the last shown one as a row's activity, how many are shown, and each as a clue
// to the role.
export function callsOf(uses: unknown): { activity?: Activity; count: number; clues: string[] } {
  if (!Array.isArray(uses)) return { count: 0, clues: [] }
  const shown = uses.filter(
    (use): use is { name: string; input?: unknown } => typeof use === 'object' && use !== null && typeof use.name === 'string' && !UNSHOWN.has(use.name),
  )
  const last = shown[shown.length - 1]
  if (last === undefined) return { count: 0, clues: [] }
  const target = targetOf(last.name, last.input)
  return { activity: target === undefined ? { tool: last.name } : { tool: last.name, target }, count: shown.length, clues: shown.map(clueOf) }
}
