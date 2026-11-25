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

// The tools that change the file they name: Peek lists these files, and leaves reads to the last actions.
const CHANGING = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit'])

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

const isBackground = (use: { input?: unknown }) =>
  typeof use.input === 'object' && use.input !== null && (use.input as Record<string, unknown>).run_in_background === true

const activityOf = (use: { name: string; input?: unknown }): Activity => {
  const target = targetOf(use.name, use.input)
  return target === undefined ? { tool: use.name } : { tool: use.name, target }
}

export type Calls = { activity?: Activity; actions: Activity[]; files: string[]; count: number; clues: string[]; hasBackground: boolean }

const NO_CALLS: Calls = { actions: [], files: [], count: 0, clues: [], hasBackground: false }

// The calls a model request asked for: the last shown one as a row's activity, each shown one as an action, the files
// they change, how many are shown, each as a clue to the role, and whether any went to the background.
export function callsOf(uses: unknown): Calls {
  if (!Array.isArray(uses)) return NO_CALLS
  const shown = uses.filter(
    (use): use is { name: string; input?: unknown } => typeof use === 'object' && use !== null && typeof use.name === 'string' && !UNSHOWN.has(use.name),
  )
  const last = shown[shown.length - 1]
  if (last === undefined) return NO_CALLS
  const actions = shown.map(activityOf)
  return {
    activity: activityOf(last),
    actions,
    files: actions.flatMap(action => (CHANGING.has(action.tool) && action.target !== undefined ? [action.target] : [])),
    count: shown.length,
    clues: shown.map(clueOf),
    hasBackground: shown.some(isBackground),
  }
}
