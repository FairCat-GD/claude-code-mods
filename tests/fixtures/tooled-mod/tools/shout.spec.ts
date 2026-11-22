import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { shout } from './shout.ts'

test('the fictional tool shouts every word of its fixture', () => {
  const { words } = JSON.parse(readFileSync(new URL('fixtures/words.json', import.meta.url), 'utf8')) as { words: string[] }
  assert.deepEqual(words.map(shout), ['MURMUR!', 'HUSH!'])
})
