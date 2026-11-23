import { type Grid, type Loop, NONE, type Offset, placed } from './compose'

// The light theme's panel, as the art's reference drew it, and the outline drawn there around faint colours (N-06).
export const LIGHT_BACKGROUND = '#f8f6f0'
export const OUTLINE = '#464650'
export const MIN_CONTRAST = 3

// The outline shows only on the light theme; an animated sprite's still copy only under reduced motion.
const STILL_STYLE = '.o{display:none}@media (prefers-color-scheme: light){.o{display:inline}}'
const MOVING_STYLE = `.o,.s{display:none}@media (prefers-color-scheme: light){.o{display:inline}}@media (prefers-reduced-motion: reduce){.m{display:none}.s{display:inline}}`

const channel = (hex: string, at: number) => {
  const value = Number.parseInt(hex.slice(at, at + 2), 16) / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}
const luminance = (hex: string) => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)

const rgb = (hex: string) => [1, 3, 5].map(at => Number.parseInt(hex.slice(at, at + 2), 16)) as [number, number, number]
const toHex = (channels: readonly number[]) => `#${channels.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`

// A colour greyed, as the art's reference computes it: its luma, mixed with the colour itself.
export function greyed(hex: string, grey: number): string {
  const [r, g, b] = rgb(hex)
  const luma = Math.trunc(0.3 * r + 0.59 * g + 0.11 * b)
  return toHex([r, g, b].map(value => grey * luma + (1 - grey) * value))
}

// A colour drawn at an opacity over a background, as it is seen.
export function seenOver(hex: string, background: string, opacity: number): string {
  const under = rgb(background)
  return toHex(rgb(hex).map((value, at) => value * opacity + (under[at] ?? 0) * (1 - opacity)))
}

export function contrast(one: string, other: string): number {
  const [light, dark] = [luminance(one), luminance(other)].sort((a, b) => b - a) as [number, number]
  return (light + 0.05) / (dark + 0.05)
}

export const isFaint = (hex: string) => contrast(hex, LIGHT_BACKGROUND) < MIN_CONTRAST

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

// The outline: every empty pixel beside a faint one, as a grid of `o`.
export function outlineOf(grid: Grid, colourOf: (key: string) => string): Grid {
  return grid.map((row, y) =>
    row.map((key, x) => {
      if (key !== NONE) return NONE
      const touches = NEIGHBOURS.some(([dx, dy]) => {
        const near = grid[y + dy]?.[x + dx]
        return near !== undefined && near !== NONE && isFaint(colourOf(near))
      })
      return touches ? 'o' : NONE
    }),
  )
}

// Each run of one key in a row is a rectangle: a subpath, one path per key, in the order the keys first appear.
export function runsByKey(grid: Grid): Map<string, string> {
  const runs = new Map<string, string>()
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const key = row[x] ?? NONE
      let end = x + 1
      while (end < row.length && row[end] === key) end++
      if (key !== NONE) runs.set(key, `${runs.get(key) ?? ''}M${x} ${y}h${end - x}v1h-${end - x}`)
      x = end
    }
  })
  return runs
}

const fills = (grid: Grid, colourOf: (key: string) => string) => [...runsByKey(grid)].map(([key, d]) => `<path fill="${colourOf(key)}" d="${d}"/>`).join('')

const outlinePath = (grid: Grid, colourOf: (key: string) => string, inside = '') => {
  const d = runsByKey(outlineOf(grid, colourOf)).get('o')
  return d === undefined ? '' : `<path d="${d}"${inside === '' ? '/>' : `>${inside}</path>`}`
}

// A still pose: its outline, then its colours. A faded pose fades its colours alone, so the outline keeps its contrast,
// and is drawn round the colours that are faint as they are seen faded on the light panel.
export function stillBody(grid: Grid, colourOf: (key: string) => string, opacity = 1): string {
  if (opacity === 1) return `<g class="o" fill="${OUTLINE}">${outlinePath(grid, colourOf)}</g>${fills(grid, colourOf)}`
  const seen = (key: string) => seenOver(colourOf(key), LIGHT_BACKGROUND, opacity)
  return `<g class="o" fill="${OUTLINE}">${outlinePath(grid, seen)}</g><g opacity="${opacity}">${fills(grid, colourOf)}</g>`
}

const open = (grid: Grid) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid[0]?.length ?? 0} ${grid.length}" shape-rendering="crispEdges">`

export const stillSvg = (grid: Grid, colourOf: (key: string) => string, opacity = 1) =>
  `${open(grid)}<style>${STILL_STYLE}</style>${stillBody(grid, colourOf, opacity)}</svg>`

// The shortest run of steps that repeats through the whole loop.
function period<T>(values: readonly T[], same: (a: T, b: T) => boolean): number {
  for (let length = 1; length < values.length; length++) {
    if (values.length % length === 0 && values.every((value, at) => same(value, values[at % length] as T))) return length
  }
  return values.length
}

const timing = (count: number, stepMs: number) => `dur="${count * stepMs}ms" calcMode="discrete" repeatCount="indefinite"`
const shown = (visible: readonly boolean[], stepMs: number) =>
  `<animate attributeName="opacity" values="${visible.map(is => (is ? 1 : 0)).join(';')}" ${timing(visible.length, stepMs)}/>`

// A part's placement over the loop: a translate where it moves, an opacity where it hides. Before SMIL runs, the
// attributes hold step 0, so an image that never animates still shows the first frame.
function partSvg(content: string, at: readonly (Offset | undefined)[], stepMs: number): string {
  const steps = at.slice(
    0,
    period(at, (a, b) => a?.x === b?.x && a?.y === b?.y),
  )
  if (steps.every(offset => offset === undefined)) return ''
  const first = steps.find(offset => offset !== undefined) as Offset
  // A hidden step keeps the last place it was shown, so a part that only hides never moves.
  const places = steps.map(
    (offset, at) =>
      offset ??
      steps
        .slice(0, at)
        .reverse()
        .find(one => one !== undefined) ??
      first,
  )
  const isMoving = places.some(offset => offset.x !== first.x || offset.y !== first.y)
  const isHiding = steps.some(offset => offset === undefined)
  const start = places[0] as Offset
  const attributes = `${start.x !== 0 || start.y !== 0 ? ` transform="translate(${start.x} ${start.y})"` : ''}${steps[0] === undefined ? ' opacity="0"' : ''}`
  const moves = isMoving
    ? `<animateTransform attributeName="transform" type="translate" values="${places.map(offset => `${offset.x} ${offset.y}`).join(';')}" ${timing(places.length, stepMs)}/>`
    : ''
  const hides = isHiding
    ? shown(
        steps.map(offset => offset !== undefined),
        stepMs,
      )
    : ''
  return moves === '' && hides === '' && attributes === '' ? content : `<g${attributes}>${moves}${hides}${content}</g>`
}

// The loop's outline is each step's own, exactly: one path per distinct outline, shown on the steps it belongs to.
function loopOutline(loop: Loop, width: number, height: number, colourOf: (key: string) => string, stepMs: number): string {
  const byStep = Array.from({ length: loop.steps }, (_, step) => runsByKey(outlineOf(placed(loop, step, width, height), colourOf)).get('o') ?? '')
  const distinct = [...new Set(byStep)].filter(d => d !== '')
  return distinct
    .map(d => {
      const visible = byStep.map(one => one === d)
      if (visible.every(Boolean)) return `<path d="${d}"/>`
      const steps = visible.slice(
        0,
        period(visible, (a, b) => a === b),
      )
      return `<path d="${d}"${steps[0] ? '' : ' opacity="0"'}>${shown(steps, stepMs)}</path>`
    })
    .join('')
}

// A looping sprite: the parts with their SMIL, then its still pose, which reduced motion shows instead.
export function loopSvg(loop: Loop, still: Grid, colourOf: (key: string) => string, stepMs: number): string {
  const width = still[0]?.length ?? 0
  const height = still.length
  const parts = loop.parts.map(part => partSvg(fills(part.grid, colourOf), part.at, stepMs)).join('')
  const moving = `<g class="m"><g class="o" fill="${OUTLINE}">${loopOutline(loop, width, height, colourOf, stepMs)}</g>${parts}</g>`
  return `${open(still)}<style>${MOVING_STYLE}</style>${moving}<g class="s">${stillBody(still, colourOf)}</g></svg>`
}
