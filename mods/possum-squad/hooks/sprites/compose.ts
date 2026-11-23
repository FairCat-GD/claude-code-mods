import type { Art, Flip, Layer, RecipeFrame } from './types'

// Rows of palette keys, `.` for none.
export type Grid = string[][]
export const NONE = '.'

export type Offset = { x: number; y: number }

// What a role wears: absent for the plain opossum.
export type Dress = { outfit: Layer; prop: Layer; propWorkDy: number }

// A frame whose marks are all pixels: `recipes.ts` turns marks given in words into these.
export type Frame = Omit<RecipeFrame, 'marks'> & { marks?: Readonly<Record<string, string>> }

// Parts drawn in order, each at its offset on every step, or hidden there. The first `once` steps play once and the
// rest loop; a single step left holds.
export type Part = { grid: Grid; at: readonly (Offset | undefined)[] }
export type Loop = { parts: readonly Part[]; steps: number; once?: number }

export const blank = (width: number, height: number): Grid => Array.from({ length: height }, () => Array<string>(width).fill(NONE))

const sizeOf = (grid: Grid) => ({ width: grid[0]?.length ?? 0, height: grid.length })

export function layerGrid(layer: Layer, width: number, height: number): Grid {
  const grid = blank(width, height)
  for (const [at, row] of layer.rows.split('\n').slice(1).entries()) {
    const line = grid[layer.top + at]
    if (line !== undefined) for (const [x, key] of [...row].entries()) if (x < width) line[x] = key
  }
  return grid
}

// `top` laid over `under`, moved by the offset; what falls off the canvas is dropped.
export function over(under: Grid, top: Grid, offset: Offset = { x: 0, y: 0 }): Grid {
  const out = under.map(row => [...row])
  for (const [y, row] of top.entries()) {
    const line = out[y + offset.y]
    if (line === undefined) continue
    for (const [x, key] of row.entries()) if (key !== NONE && x + offset.x >= 0 && x + offset.x < line.length) line[x + offset.x] = key
  }
  return out
}

// Only the rows from `top` to `bottom`, the rest empty.
export function rowsOf(grid: Grid, top: number, bottom: number): Grid {
  return grid.map((row, y) => (y >= top && y <= bottom ? [...row] : row.map(() => NONE)))
}

// The bob: rows top..bottom move down `by`, the lowest of them covered; the rows below stay.
export function bobbed(grid: Grid, bob: Art['bob']): Grid {
  const out = grid.map(row => [...row])
  for (let y = bob.bottom; y >= bob.top; y--) {
    const from = grid[y - bob.by]
    out[y] = y - bob.by >= bob.top && from !== undefined ? [...from] : (out[y]?.map(() => NONE) ?? [])
  }
  return out
}

export const flippedRow = (y: number, flip: Flip) => flip.top + flip.bottom - y + flip.down

// Upside down: rows top..bottom reversed and moved down; every other row is empty.
export function flipped(grid: Grid, flip: Flip): Grid {
  const { width, height } = sizeOf(grid)
  const out = blank(width, height)
  for (let y = flip.top; y <= flip.bottom; y++) {
    const to = flippedRow(y, flip)
    const from = grid[y]
    if (to >= 0 && to < height && from !== undefined) out[to] = [...from]
  }
  return out
}

// "x y, x y" as points.
export const points = (list: string): Offset[] =>
  list
    .split(',')
    .map(point => point.trim().split(/\s+/).map(Number))
    .map(([x = 0, y = 0]) => ({ x, y }))

export function painted(grid: Grid, marks: Readonly<Record<string, string>>): Grid {
  const out = grid.map(row => [...row])
  for (const [key, list] of Object.entries(marks)) {
    for (const { x, y } of points(list)) {
      const line = out[y]
      if (line !== undefined && x >= 0 && x < line.length) line[x] = key
    }
  }
  return out
}

// The base with the eyes open or closed: closing repaints the pupils' top row under the outfit, so glasses stay.
export function baseGrid(art: Art, isClosed: boolean): Grid {
  const base = layerGrid(art.base, art.canvas.width, art.canvas.height)
  return isClosed ? painted(base, { [art.eyes.closed]: art.eyes.pupils }) : base
}

// The body as dressed: the base, then the outfit.
export function dressed(art: Art, dress: Dress | undefined, isClosed: boolean): Grid {
  const base = baseGrid(art, isClosed)
  return dress === undefined ? base : over(base, layerGrid(dress.outfit, art.canvas.width, art.canvas.height))
}

export const propOffset = (frame: Frame, dress: Dress): Offset => ({
  x: 0,
  y: frame.propDy === 'propWorkDy' ? dress.propWorkDy : (frame.propDy ?? 0),
})

// One frame in the manifest's order: base (eyes as asked), outfit, the body's move, marks, then the prop or an extra.
export function frameGrid(art: Art, dress: Dress | undefined, frame: Frame): Grid {
  const body = dressed(art, dress, frame.eyes === 'closed')
  const moved = frame.body === 'none' ? body : frame.body === 'bob' ? bobbed(body, art.bob) : flipped(body, frame.body)
  const marked = frame.marks === undefined ? moved : painted(moved, frame.marks)
  const { width, height } = art.canvas
  const extra = frame.extra === undefined ? undefined : art.extras[frame.extra]
  if (extra !== undefined) return over(marked, layerGrid(extra, width, height))
  if (dress === undefined || frame.prop === 'hidden') return marked
  return over(marked, layerGrid(dress.prop, width, height), propOffset(frame, dress))
}

// The loop's frame at one step: every part shown there, at its offset.
export function placed(loop: Loop, step: number, width: number, height: number): Grid {
  return loop.parts.reduce(
    (grid, part) => {
      const offset = part.at[step]
      return offset === undefined ? grid : over(grid, part.grid, offset)
    },
    blank(width, height),
  )
}
