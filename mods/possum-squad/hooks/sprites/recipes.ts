import type { StateId } from '../../types/index'
import { blank, type Dress, dressed, type Frame, flippedRow, type Loop, layerGrid, NONE, type Offset, painted, propOffset, rowsOf } from './compose'
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
