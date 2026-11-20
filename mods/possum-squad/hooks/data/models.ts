// T-11: each model's context window in tokens, as the engine reported it, and when.
export const WINDOWS: readonly { model: string; tokens: number; measured: string }[] = [
  { model: 'claude-haiku-5-5', tokens: 1_000_000, measured: '2026-11-20, $.agent.list, CLI 2.1.329' },
  { model: 'claude-opus-5-5', tokens: 1_000_000, measured: '2026-11-20, session.measure, CLI 2.1.329' },
  { model: 'claude-sonnet-5-5', tokens: 1_000_000, measured: '2026-11-20, $.agent.list, CLI 2.1.329' },
]

// For a model the table does not name: the window every measured model had.
export const DEFAULT_WINDOW = 1_000_000

// An id the engine dates or suffixes (`claude-opus-5-5-20261101`) still finds its model.
export function windowOf(model: string | undefined): number {
  if (model === undefined) return DEFAULT_WINDOW
  const found = WINDOWS.find(row => model === row.model) ?? WINDOWS.find(row => model.startsWith(`${row.model}-`))
  return found?.tokens ?? DEFAULT_WINDOW
}
