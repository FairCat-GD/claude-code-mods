import assert from 'node:assert/strict'
import { test } from 'node:test'

import { half } from './half.ts'

test('the fictional spec fails on purpose', () => assert.equal(half(4), 3))
