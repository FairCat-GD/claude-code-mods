import type { Register } from 'claude-code'

export const register: Register = on => {
  on('command.run', { command: 'tooled' }, async () => ({ text: 'A fictional mod with a tool.' }))
}
