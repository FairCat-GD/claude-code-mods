// Like the engine's own, the built-in tools' table is an addition to 'claude-code', not a module.
declare module 'claude-code' {
  interface BuiltinToolInputs {
    Fictional: { input: string }
  }
}
