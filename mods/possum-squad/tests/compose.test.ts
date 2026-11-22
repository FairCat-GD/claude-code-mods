import { expect, test } from 'claude-code/testing'

import { bobbed, type Dress, dressed, frameGrid, type Grid, NONE, placed } from '../hooks/sprites/compose'
import { drawSprite, dressOf } from '../hooks/sprites/index'
import { BLINK_STEP, LOOP_STEPS, type Pose, resolved, STILL, stillFrame, workLoop } from '../hooks/sprites/recipes'
import { FIXTURE_ART as ART } from './fixtures/art'

const SCOUT = dressOf(ART, 'classic', 'scout') as Dress
const still = (pose: Pose, ...plain: ['plain'] | []) => frameGrid(ART, plain.length > 0 ? undefined : SCOUT, stillFrame(ART, pose))
const at = (grid: Grid, x: number, y: number) => grid[y]?.[x]
const keys = (grid: Grid) => new Set(grid.flat().filter(key => key !== NONE))
const POSES = Object.keys(STILL) as Pose[]

test('the bob moves the rows above the seam down one, covers the seam, and leaves the legs', () => {
  const body = dressed(ART, SCOUT, false)
  const bob = bobbed(body, ART.bob)
  expect(bob[0]?.every(key => key === NONE)).toBe(true)
  for (let y = 1; y <= 27; y++) expect(bob[y]).toEqual(body[y - 1])
  for (let y = 28; y < 32; y++) expect(bob[y]).toEqual(body[y])
})

test('failed turns rows 3..29 over and down two, keeping the hat and dropping what is above it', () => {
  const failed = still('failed')
  const body = dressed(ART, SCOUT, true)
  // Row y lands on 34 - y: the hat's rows 3 and 4 on 31 and 30, the legs' rows 28 and 29 on 6 and 5.
  for (let y = 3; y <= 29; y++) {
    const row = failed[34 - y] ?? []
    for (let x = 0; x < 32; x++) if (!(34 - y >= 10 && 34 - y <= 12 && (x === 15 || x === 16))) expect([y, x, row[x]]).toEqual([y, x, body[y]?.[x]])
  }
  expect(at(failed, 12, 31)).toBe('R')
  expect(failed.slice(0, 5).every(row => row.every(key => key === NONE))).toBe(true)
  expect(keys(failed).has('r')).toBe(true)
  expect(failed.flat().filter(key => key === 'r')).toHaveLength(1)
})

test('closing the eyes repaints the pupils under the outfit, so the glasses stay', () => {
  const open = still('idle')
  const closed = still('quiet')
  expect([at(open, 20, 17), at(closed, 20, 17)]).toEqual(['K', 'W'])
  expect([at(open, 11, 17), at(closed, 11, 17)]).toEqual(['B', 'B'])
})

test("marks and extras land after the body's move, in the canvas's place: the z does not bob", () => {
  expect(at(still('stopped'), 15, 24)).toBe('K')
  expect(at(still('stopped'), 26, 4)).toBe('Y')
  const finished = still('finished')
  expect([at(finished, 25, 6), at(finished, 25, 7)]).toEqual(['C', NONE])
  // The body under it did bob: the hat's rows 3..4 now sit on 4..5.
  expect([at(finished, 12, 3), at(finished, 12, 5)]).toEqual([NONE, 'R'])
})

test('the tongue of a run that failed sits beside the turned-over nose', () => {
  const failed = still('failed')
  // The nose's row 21 lands on 13: red one and two rows above it, dark red three above.
  expect([at(failed, 15, 12), at(failed, 16, 12), at(failed, 16, 11), at(failed, 16, 10)]).toEqual(['R', 'R', 'R', 'r'])
})

test('the prop is held only with no extra and not on its back; the plain opossum wears nothing', () => {
  const holding = (pose: Pose) => keys(still(pose)).has('G')
  expect(POSES.filter(holding).sort()).toEqual(['idle', 'quiet', 'starting', 'working'])
  expect(at(still('idle'), 2, 20)).toBe('G')
  for (const pose of POSES) {
    const plain = keys(still(pose, 'plain'))
    for (const worn of ['B', 'G']) expect([pose, plain.has(worn)]).toEqual([pose, false])
  }
  // Plain, failed still has its tongue.
  expect(keys(still('failed', 'plain')).has('r')).toBe(true)
})

test("the work loop's parts, placed at each step, are the recipe's frame there: still, bob, and the blink", () => {
  const [first, bob] = (ART.recipes.working?.frames ?? []).map(resolved)
  for (const dress of [SCOUT, undefined]) {
    const loop = workLoop(ART, dress)
    expect(loop.steps).toBe(LOOP_STEPS)
    for (let step = 0; step < LOOP_STEPS; step++) {
      const frame = step % 2 === 0 ? first : bob
      const expected =
        step === BLINK_STEP ? frameGrid(ART, dress, { ...first, body: 'none', eyes: 'closed' }) : frameGrid(ART, dress, frame ?? { body: 'none' })
      expect([step, placed(loop, step, 32, 32)]).toEqual([step, expected])
    }
  }
  // The prop rises two on the bob, against the body's one down.
  const loop = workLoop(ART, SCOUT)
  expect([at(placed(loop, 0, 32, 32), 2, 20), at(placed(loop, 1, 32, 32), 2, 18)]).toEqual(['G', 'G'])
})

test("a role a set lacks wears the default set's; an unknown role, set or pose draws, plain or idle, and never throws", () => {
  expect(dressOf(ART, 'odd', 'scout')).toBe(SCOUT)
  expect(dressOf(ART, 'gone', 'scout')).toBe(SCOUT)
  expect(dressOf(ART, 'classic', 'mime')).toBeUndefined()
  const odd = drawSprite(ART, { set: 'gone', role: 'mime', pose: 'dancing' as Pose, motion: 'auto' })
  expect(odd).toEqual(drawSprite(ART, { set: 'classic', pose: 'idle', motion: 'auto' }))
})
