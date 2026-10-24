import type { Register } from 'claude-code'

export const GREETING = 'mod-template is loaded.'

// A command is declared for each session, then answered by the module's own hook.
export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'hello', description: 'Says that mod-template is loaded.' })

    return next(e)
  })

  on('command.run', { command: 'hello' }, async () => ({ text: GREETING }))
}
