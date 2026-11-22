import assert from 'node:assert/strict'
import { test } from 'node:test'

// Under tools/fixtures/, so neither typed nor run: its type error and its failure would show.
const count: number = 'three'

test('a spec under tools/fixtures/ ran', () => assert.equal(count, 3))
