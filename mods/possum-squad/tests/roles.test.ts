import { expect, test } from 'claude-code/testing'

import { WEAK_CALLS_FOR_SCOUT } from '../hooks/config'
import { atSpawn, detect, fromTools, HELPER, type ToolsSeen, toolsSeen } from '../hooks/roles/rules'
import { type Case, CORPUS } from './fixtures/role-corpus'

// A case as the reference's own runner reads it: the generic type when none is named, and no rule left to fire.
const judged = (item: Case) => detect({ description: item.description, type: item.type ?? 'general-purpose', tools: item.tools ?? [], timedOut: true })

test('every dev case gets its label, and at least 90% of holdout (F-05)', () => {
  expect(CORPUS.dev).toHaveLength(102)
  expect(CORPUS.holdout).toHaveLength(42)
  for (const item of CORPUS.dev) expect({ description: item.description, role: judged(item)?.id }).toEqual({ description: item.description, role: item.role })
  const right = CORPUS.holdout.filter(item => judged(item)?.id === item.role)
  expect(right.length / CORPUS.holdout.length).toBeGreaterThanOrEqual(0.9)
})

test("the port reads holdout as the reference does: its only misses are the reference's three, with its answers", () => {
  const misses = CORPUS.holdout.filter(item => judged(item)?.id !== item.role).map(item => ({ description: item.description, got: judged(item) }))
  expect(misses).toEqual([
    { description: 'Draft an implementation plan', got: { id: 'writer', source: 'keywords' } },
    { description: 'Add pagination to the list', got: { id: 'scout', source: 'keywords' } },
    { description: 'Hook up analytics events', got: { id: 'analyst', source: 'keywords' } },
  ])
})

test('the built-in types settle by type whatever their case; a custom type by its name, read as words', () => {
  expect(atSpawn('Explore', 'Find where reports are built')).toEqual({ id: 'scout', source: 'type' })
  expect(atSpawn('Plan', 'Add export feature')).toEqual({ id: 'planner', source: 'type' })
  expect(atSpawn('EXPLORE', 'Add export feature')).toEqual({ id: 'scout', source: 'type' })
  expect(atSpawn('senior-code-reviewer', 'Look at the API')).toEqual({ id: 'reviewer', source: 'name' })
  // The generic types are skipped, so the words decide.
  expect(atSpawn('general-purpose', 'Look at the API')).toBeUndefined()
  expect(atSpawn('fork', 'Fix lint errors')).toEqual({ id: 'janitor', source: 'keywords' })
})

test('the words decide: the three generic agents, the leading verb, and a look or a system to design', () => {
  const roles = (descriptions: string[]) => descriptions.map(description => atSpawn('general-purpose', description)?.id)
  expect(roles(['Research competitor launches', 'Design the launch graphics', 'Build the landing page'])).toEqual(['researcher', 'artist', 'builder'])
  expect(roles(['Document the test setup', 'Research testing frameworks', 'Review the migration plan'])).toEqual(['writer', 'researcher', 'reviewer'])
  expect(roles(['Design onboarding screens', 'Design database schema'])).toEqual(['artist', 'planner'])
})

test('reads and searches are weak: no clue in the words waits for a decisive call, or the sixth weak one', () => {
  expect(atSpawn('general-purpose', 'Take care of it')).toBeUndefined()
  const searched = toolsSeen(0, ['Read', 'Grep', 'Grep'])
  expect(searched).toEqual({ weak: 3 })
  expect(toolsSeen(searched.weak, ['Edit']).role).toEqual({ id: 'builder', source: 'tools' })

  const five = toolsSeen(0, ['Read', 'Grep', 'Read', 'Glob', 'Read'])
  expect(five).toEqual({ weak: WEAK_CALLS_FOR_SCOUT - 1 })
  expect(toolsSeen(five.weak, ['Grep']).role).toEqual({ id: 'scout', source: 'tools' })

  // Any other shell command is no evidence; with no rule left to fire, the run is Helper.
  expect(toolsSeen(0, ['Bash:ls -la', 'Read'])).toEqual({ weak: 1 })
  expect(detect({ description: 'Do task 3', type: 'general-purpose', tools: ['Bash:ls -la', 'Read'], timedOut: false })).toBeUndefined()
  expect(detect({ description: 'Do task 3', type: 'general-purpose', tools: ['Bash:ls -la', 'Read'], timedOut: true })).toEqual(HELPER)
})

test("a shell command is read whole after the first colon, and a runner's name only as a whole word", () => {
  expect(fromTools(['Bash:PATH=/opt/a:/opt/b npm test'])).toBe('tester')
  expect(fromTools(['Bash:git commit -m "trim: hedges"'])).toBe('courier')
  // Next to a letter or a number in any script, as in the reference, the word is not the runner's.
  expect(fromTools(['Bash:npm testé'])).toBeUndefined()
  expect(fromTools(['Bash:éjest --watch'])).toBeUndefined()
  expect(fromTools(['Bash:npm test2'])).toBeUndefined()
  expect(fromTools(['Bash:npm test -- shed'])).toBe('tester')
  expect(fromTools(['mcp__garden-browser__open'])).toBe('pilot')
})

test('the stated and remembered rules come first; a remembered role skips the generic and built-in types', () => {
  expect(detect({ description: 'Fix lint errors', type: 'Explore', stated: 'tester', timedOut: false })).toEqual({ id: 'tester', source: 'stated' })
  expect(detect({ description: 'Fix lint errors', type: 'hedge-trimmer', remembered: 'artist', timedOut: false })).toEqual({
    id: 'artist',
    source: 'remembered',
  })
  expect(detect({ description: 'Fix lint errors', type: 'general-purpose', remembered: 'artist', timedOut: false })?.source).toBe('keywords')
  expect(detect({ description: 'Fix lint errors', type: 'Explore', remembered: 'artist', timedOut: false })?.source).toBe('type')
})

test('input that is not text settles nothing and never throws', () => {
  expect(atSpawn(undefined, 7)).toBeUndefined()
  expect(detect({ description: null, type: 5, tools: [null, 3, {}], timedOut: false })).toBeUndefined()
  expect(toolsSeen(0, [undefined, 'Read'])).toEqual({ weak: 1 })
})

test("calls arriving one at a time settle as the whole list does, for every corpus case's calls", () => {
  const withCalls = [...CORPUS.dev, ...CORPUS.holdout].filter(item => item.tools !== undefined)
  expect(withCalls.length).toBeGreaterThan(0)
  for (const item of withCalls) {
    const calls = item.tools ?? []
    let seen: ToolsSeen = { weak: 0 }
    for (const call of calls) if (seen.role === undefined) seen = toolsSeen(seen.weak, [call])
    expect({ description: item.description, role: seen.role?.id }).toEqual({ description: item.description, role: fromTools(calls) })
  }
})
