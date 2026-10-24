// Written by Claude Code 0.0.0.
// A fictional stand-in for the API declarations the engine lays beside a mod.

declare module 'claude-code' {
  export type Register = (on: (event: string, ...rest: unknown[]) => void) => void
}

declare module 'claude-code/testing' {
  export const test: (name: string, body: () => Promise<void>) => void
  export const expect: (value: unknown) => { toMatch: (pattern: RegExp) => void }
}
