import { expect, test } from 'claude-code/testing'

import { GREETING } from '../hooks/register'

test('a session declares /hello, and /hello answers that the mod is loaded', async ($, on) => {
  const registered: string[] = []
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => {
    registered.push(e.name)

    return { value: { command: e.name } }
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  expect(registered).toEqual(['hello'])

  const ran = await $.command.run({ command: 'hello', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
  expect(ran.text).toBe(GREETING)
})
