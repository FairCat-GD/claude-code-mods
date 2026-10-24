import type { Register } from 'claude-code'

import { greeting } from './greeting'

export const register: Register = on => {
  on('command.run', { command: 'alpha' }, async () => ({ text: greeting }))
}
