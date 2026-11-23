import type { StateId } from '../../types/index'
import {
  blank,
  type Dress,
  dressed,
  type Frame,
  flippedRow,
  frameGrid,
  type Grid,
  type Loop,
  layerGrid,
  NONE,
  type Offset,
  type Part,
  painted,
  propOffset,
  rowsOf,
} from './compose'
import type { Art, RecipeFrame } from './types'

// What a sprite shows: a run's state, `planned` (no run is planned yet, so only the gallery draws it), or `idle` for
// the Lead, who has none.
export type Pose = StateId | 'planned' | 'idle'

// Each pose's still frame, from the art's recipes. A state the art has no recipe for takes the nearest:
// arriving is idle, and dozing is the blink, eyes closed.
export const STILL: Readonly<Record<Pose, string>> = {
  idle: 'idle',
  planned: 'planned',
  starting: 'idle',
  working: 'working',
  'needs-you': 'needs-you',
  quiet: 'blink',
  finished: 'finished',
  failed: 'failed',
  stopped: 'stopped',
}

// The tongue of a run that failed, by the base's nose row before the flip: red beside the nose, then darker.
export const TONGUE = { noseRow: 21, marks: { R: [15, -1, 16, -1, 16, -2], r: [16, -3] } } as const

// Marks the art gives in words, drawn here; each takes the frame it is drawn on.
export const WORDED_MARKS: Readonly<Record<string, (frame: RecipeFrame) => Record<string, string>>> = {
  tongue: frame => {
    const nose = typeof frame.body === 'object' ? flippedRow(TONGUE.noseRow, frame.body) : TONGUE.noseRow
    const at = (pairs: readonly number[]) => pairs.flatMap((value, index) => (index % 2 === 0 ? [`${value} ${nose + (pairs[index + 1] ?? 0)}`] : [])).join(', ')
    return { R: at(TONGUE.marks.R), r: at(TONGUE.marks.r) }
  },
}

// Colourings the art gives in words: `greyed` is 70% luminance grey and 30% colour, then 45% toward the background.
export type Colouring = { grey: number; fade: number }
export const COLOURINGS: Readonly<Record<string, Colouring>> = { greyed: { grey: 0.7, fade: 0.45 } }

// The work loop: 20 steps of T-01, the bob on every other one, and a blink on one still step.
export const LOOP_STEPS = 20
export const BLINK_STEP = 18

// A recipe's frame ready to draw: marks in words as pixels, and no prop on its back, as the reference drew it.
export function resolved(frame: RecipeFrame): Frame {
  const { marks, ...rest } = frame
  const out: Frame = { ...rest }
  if (typeof marks === 'string') {
    const drawn = WORDED_MARKS[marks]
    if (drawn !== undefined) out.marks = drawn(frame)
  } else if (marks !== undefined) out.marks = marks
  if (typeof frame.body === 'object') out.prop = 'hidden'
  return out
}

export function stillFrame(art: Art, pose: Pose): Frame {
  const frame = art.recipes[STILL[pose] ?? 'idle']?.frames[0] ?? art.recipes.idle?.frames[0] ?? { body: 'none' }
  return resolved(frame)
}

// Where a pose's one-off ends, when that is not its still: a startle settles idle.
export const SETTLED: Readonly<Partial<Record<Pose, Pose>>> = { stopped: 'idle' }
export const settledFrame = (art: Art, pose: Pose): Frame => stillFrame(art, (Object.hasOwn(SETTLED, pose) ? SETTLED[pose] : undefined) ?? pose)

// The work loop as parts: the body above the bob's lowest row, that row, the rows that stay, the closed eyelids and the
// prop, each placed per step. The eyelids skip a pupil the outfit covers, and are drawn under the prop.
export function workLoop(art: Art, dress: Dress | undefined): Loop {
  const [still, bob] = (art.recipes.working?.frames ?? []).map(resolved)
  const { width, height } = art.canvas
  const body = dressed(art, dress, false)
  const seamRow = art.bob.bottom - art.bob.by + 1
  const outfit = dress === undefined ? blank(width, height) : layerGrid(dress.outfit, width, height)
  const lids = painted(blank(width, height), { [art.eyes.closed]: art.eyes.pupils }).map((row, y) =>
    row.map((key, x) => (outfit[y]?.[x] === NONE ? key : NONE)),
  )
  const steps = Array.from({ length: LOOP_STEPS }, (_, step) => (step % 2 === 0 ? still : bob))
  const isBob = (frame: Frame | undefined) => frame?.body === 'bob'
  const still0: Offset = { x: 0, y: 0 }
  const parts = [
    { grid: rowsOf(body, art.bob.top, seamRow - 1), at: steps.map(frame => (isBob(frame) ? { x: 0, y: art.bob.by } : still0)) },
    { grid: rowsOf(body, seamRow, art.bob.bottom), at: steps.map(frame => (isBob(frame) ? undefined : still0)) },
    {
      grid: body.map((row, y) => (y < art.bob.top || y > art.bob.bottom ? [...row] : row.map(() => NONE))),
      at: steps.map(() => still0),
    },
    { grid: lids, at: steps.map((_, step) => (step === BLINK_STEP ? still0 : undefined)) },
  ]
  if (dress !== undefined) {
    parts.push({ grid: layerGrid(dress.prop, width, height), at: steps.map(frame => (frame === undefined ? still0 : propOffset(frame, dress))) })
  }
  return { parts, steps: LOOP_STEPS }
}

// A one-off a sprite plays around its moment: a run's arrival, its dressing when its role settles, or its ending.
export type Moment = 'arrival' | 'dressing' | 'ending'

const PLACED: Offset = { x: 0, y: 0 }
// A hop: up 2 for one step.
export const HOP: Offset = { x: 0, y: -2 }
// The arrival: the plain opossum slides in from the left over three steps.
export const SLIDE: readonly Offset[] = [-24, -16, -8].map(x => ({ x, y: 0 }))
// The cheer: hop, land, hop, land; then asleep, the "z" rising from 2 px low, then 1 px, into place at 3 s.
export const CHEER_HOPS: readonly Offset[] = [HOP, PLACED, HOP, PLACED]
export const Z_RISE: readonly number[] = [2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1]
// The startle: startled for 1 s, then idle.
export const STARTLE_STEPS = 5
// The gallery's one-offs rest this many steps, then play again.
export const REST_STEPS = 10
// The poses that bob whole, held prop or sign with them: the steps on each frame of the bob.
export const BOB_PACE: Readonly<Partial<Record<Pose, number>>> = { 'needs-you': 2, quiet: 4 }

// Each one-off's steps before it holds: an arrival's with its hop, an ending's by the pose it ends in.
export const MOMENT_STEPS = { arrival: SLIDE.length + 2, dressing: 1, finished: CHEER_HOPS.length + Z_RISE.length, stopped: STARTLE_STEPS } as const

// The poses a run is live in, which arrive and are dressed.
const LIVE: readonly Pose[] = ['starting', 'working', 'needs-you', 'quiet']

// The moment a pose plays: an arrival or a dressing while live, an ending when finished or stopped.
export function playable(pose: Pose, moment: Moment | undefined): Moment | undefined {
  if (moment === 'ending') return pose === 'finished' || pose === 'stopped' ? moment : undefined
  return moment !== undefined && LIVE.includes(pose) ? moment : undefined
}

const hidden = (steps: number): (Offset | undefined)[] => Array<Offset | undefined>(steps).fill(undefined)
const held = (steps: number, offset: Offset = PLACED): (Offset | undefined)[] => Array<Offset | undefined>(steps).fill(offset)
const stillLoop = (grid: Grid): Loop => ({ parts: [{ grid, at: [PLACED] }], steps: 1 })

// Steps played once, then a tail: the intro's parts hide when the tail starts, and the tail's until then. A held tail
// drawn like an intro part is that part.
function then(intro: { parts: readonly Part[]; steps: number }, tail: Loop): Loop {
  const parts: Part[] = intro.parts.map(part => ({ grid: part.grid, at: [...part.at, ...hidden(tail.steps)] }))
  for (const part of tail.parts) {
    const at = [...hidden(intro.steps), ...part.at]
    const twin = tail.parts.length === 1 ? parts.find(one => one.grid.every((row, y) => row.join('') === part.grid[y]?.join(''))) : undefined
    if (twin === undefined) parts.push({ grid: part.grid, at })
    else twin.at = twin.at.map((offset, step) => offset ?? at[step])
  }
  return { parts, steps: intro.steps + tail.steps, once: intro.steps }
}

// A pose's still, bobbing whole with what it holds: `pace` steps in place, then `pace` down.
export function bobLoop(art: Art, grid: Grid, pace: number): Loop {
  const seamRow = art.bob.bottom - art.bob.by + 1
  const isBob = Array.from({ length: 2 * pace }, (_, step) => step >= pace)
  return {
    parts: [
      { grid: rowsOf(grid, art.bob.top, seamRow - 1), at: isBob.map(bob => (bob ? { x: 0, y: art.bob.by } : PLACED)) },
      { grid: rowsOf(grid, seamRow, art.bob.bottom), at: isBob.map(bob => (bob ? undefined : PLACED)) },
      { grid: grid.map((row, y) => (y < art.bob.top || y > art.bob.bottom ? [...row] : row.map(() => NONE))), at: isBob.map(() => PLACED) },
    ],
    steps: 2 * pace,
  }
}

const standing = (art: Art, dress: Dress | undefined) => frameGrid(art, dress, stillFrame(art, 'idle'))

// The plain opossum slides in; with a role it rests a step, hops, and lands dressed. Then it stands.
export function arrival(art: Art, dress: Dress | undefined): Loop {
  const plain = standing(art, undefined)
  if (dress === undefined) return then({ parts: [{ grid: plain, at: SLIDE }], steps: SLIDE.length }, stillLoop(plain))
  return then({ parts: [{ grid: plain, at: [...SLIDE, PLACED, HOP] }], steps: SLIDE.length + 2 }, stillLoop(standing(art, dress)))
}

// The plain opossum hops, and lands dressed in its pose.
export const dressing = (art: Art, tail: Loop): Loop => then({ parts: [{ grid: standing(art, undefined), at: [HOP] }], steps: 1 }, tail)

// Two hops standing, then asleep as the "z" rises into place; then it holds.
export function cheer(art: Art, dress: Dress | undefined): Loop {
  const { extra, ...asleep } = stillFrame(art, 'finished')
  const { width, height } = art.canvas
  const hops = CHEER_HOPS.length
  const rise = Z_RISE.length
  const parts: Part[] = [
    { grid: standing(art, dress), at: [...CHEER_HOPS, ...hidden(rise + 1)] },
    { grid: frameGrid(art, dress, { ...asleep, prop: 'hidden' }), at: [...hidden(hops), ...held(rise + 1)] },
  ]
  const z = extra === undefined ? undefined : art.extras[extra]
  if (z !== undefined) parts.push({ grid: layerGrid(z, width, height), at: [...hidden(hops), ...Z_RISE.map(y => ({ x: 0, y })), PLACED] })
  return { parts, steps: hops + rise + 1, once: hops + rise }
}

// Startled for a second, then standing as it settles.
export function startle(art: Art, dress: Dress | undefined): Loop {
  const startled = frameGrid(art, dress, stillFrame(art, 'stopped'))
  return then({ parts: [{ grid: startled, at: held(STARTLE_STEPS) }], steps: STARTLE_STEPS }, stillLoop(frameGrid(art, dress, settledFrame(art, 'stopped'))))
}

// The gallery's: a one-off that ends held plays again after a rest, as one loop.
export function repeated(loop: Loop): Loop {
  const once = loop.once ?? 0
  if (loop.steps - once !== 1) return loop
  return {
    parts: loop.parts.map(part => ({ grid: part.grid, at: [...part.at.slice(0, once), ...Array<Offset | undefined>(REST_STEPS).fill(part.at[once])] })),
    steps: once + REST_STEPS,
  }
}

// A pose's own loop, when it has one.
function loopOf(art: Art, dress: Dress | undefined, pose: Pose): Loop | undefined {
  if (pose === 'working') return workLoop(art, dress)
  const pace = Object.hasOwn(BOB_PACE, pose) ? BOB_PACE[pose] : undefined
  return pace === undefined ? undefined : bobLoop(art, frameGrid(art, dress, stillFrame(art, pose)), pace)
}

function oneOff(art: Art, dress: Dress | undefined, pose: Pose, moment: Moment | undefined): Loop | undefined {
  switch (playable(pose, moment)) {
    case 'arrival':
      return arrival(art, dress)
    case 'dressing':
      return dress === undefined ? undefined : dressing(art, loopOf(art, dress, pose) ?? stillLoop(frameGrid(art, dress, stillFrame(art, pose))))
    case 'ending':
      return pose === 'finished' ? cheer(art, dress) : startle(art, dress)
    default:
      return undefined
  }
}

// What moves in a sprite: the moment's one-off, played again after a rest when repeated, else the pose's own loop;
// nothing for a still pose.
export function animationOf(art: Art, dress: Dress | undefined, pose: Pose, moment?: Moment, isRepeated = false): Loop | undefined {
  const once = oneOff(art, dress, pose, moment)
  if (once !== undefined) return isRepeated ? repeated(once) : once
  return loopOf(art, dress, pose)
}
