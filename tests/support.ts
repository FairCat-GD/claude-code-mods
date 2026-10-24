import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { fileURLToPath } from 'node:url'

export const FIXTURES = fileURLToPath(new URL('fixtures/', import.meta.url))

// A fresh folder of the test's own, removed when the test ends.
export const temporaryFolder = (t: TestContext) => {
  const dir = mkdtempSync(join(tmpdir(), 'claude-code-mods-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}
