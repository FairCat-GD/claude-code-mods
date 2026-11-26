// Fictional events and the results the engine's stand-in gives them.
const agentId = 'agent-fixture-1'
const usage = { input_tokens: 120, output_tokens: 30, cache_read_input_tokens: 4000, cache_creation_input_tokens: 0, model: 'claude-haiku-5-5' }

export const SESSION_START = { cwd: '/fixture/orchard', surface: 'terminal', isInteractive: true } as const
export const STARTED = { cwd: '/fixture/orchard' }

export const SPAWN = {
  tool_use_id: 'toolu_fixture_spawn',
  prompt: 'Count the shovels in the garden shed and list their colours.',
  description: 'Count the shovels',
  subagentType: 'Explore',
  provider: { plugin: 'engine', tier: 'core' },
  parentModel: 'claude-opus-5-5',
  background: false,
  fork: false,
} as const
export const SPAWNED = { model: 'claude-haiku-5-5', agentId }

export const TURN_START = { text: 'Count the shovels', turnId: 'turn-fixture-1', agentId } as const
export const TURN_STARTED = { turnId: 'turn-fixture-1' }

export const TURN_COMPLETE = {
  reason: 'answer',
  answer: 'Seven shovels: four red, three green.',
  durationMs: 4200,
  isAborted: false,
  turnId: 'turn-fixture-1',
  agentId,
  usage,
} as const
export const TURN_COMPLETED = { text: 'Seven shovels: four red, three green.', usage }

// The main loop's turn: no `agentId`.
export const MAIN_START = { text: 'Sort the seed packets', turnId: 'turn-main-1' } as const
const { agentId: _, ...mainEnd } = TURN_COMPLETE
export const MAIN_COMPLETE = { ...mainEnd, turnId: 'turn-main-1' } as const

export const MEASURE = {
  context: { tokens: 18000, window: 200000, percent: 9 },
  rateLimits: [{ kind: 'five_hour', percentUsed: 12, resetsAt: '2030-01-01T05:00:00Z' }],
  changed: ['context' as const],
}
export const MEASURED = { changed: ['context'] as ('context' | 'rateLimits' | 'cost')[] }

export const CLEARED = {}

export const PERMISSION = { tool_name: 'Bash', tool_input: { command: 'ls shed' } } as const
export const PERMITTED = { decision: { behavior: 'allow' } } as const

export const STEP = { turnId: 'turn-fixture-1', index: 0, model: 'claude-haiku-5-5', effort: 'medium', messageCount: 3, agentId } as const
export const STEP_CHUNKS = [
  { kind: 'text', index: 0, text: 'Seven ' },
  { kind: 'text', index: 0, text: 'shovels: four red, ' },
  { kind: 'text', index: 0, text: 'three green.' },
  { kind: 'stop', stopReason: 'end_turn', usage },
] as const
export const STEPPED = {
  turnId: 'turn-fixture-1',
  index: 0,
  answer: 'Seven shovels: four red, three green.',
  toolUses: [],
  stopReason: 'end_turn',
  usage,
} as const

// A subagent's call waiting on the person, and the engine's answer, which comes back empty while the prompt still waits.
export const PERMISSION_FROM_AGENT = { ...PERMISSION, agent_id: agentId, agent_type: 'Explore', hook_event_name: 'PermissionRequest' } as const
export const WAITING = {}
