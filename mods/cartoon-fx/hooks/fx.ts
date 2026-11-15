// Cartoon effects drawn as animated SVG (SMIL, no script), one per moment the
// mod celebrates. The same seed always draws the same picture, so a redraw
// does not reshuffle it. Every effect fits the same 440 × 190 box.

import type { FxKind, Size } from '../types'

export const WIDTH = 440
export const HEIGHT = 190
// What is shown of that box: its middle, where the action is. A piece that
// flies past the sides leaves the frame, as in a cartoon.
const VIEW_X = 90
const VIEW_WIDTH = 260
// Drawn this many times larger at each size; a surface narrower than that shrinks it to fit.
export const SCALES: Record<Size, number> = { small: 1.6, medium: 2.1, large: 3.2 }
export const DEFAULT_SIZE: Size = 'medium'
const CX = WIDTH / 2

// How long each effect runs, its last piece faded.
export const FX_MS: Record<FxKind, number> = {
  push: 2600,
  commit: 2300,
  tests: 2400,
  compact: 2600,
  helpers: 2600,
  context: 3100,
  redzone: 3300,
  plan: 2600,
  fixes: 2700,
  review: 2800,
  cherry: 2600,
  merge: 2700,
  rebase: 2900,
  pr: 2600,
}

export const COLORS = ['#FF5E5B', '#FFD23F', '#3BCEAC', '#4D96FF', '#B76EF0', '#FF9F1C', '#FF70A6', '#7BE04A']
const INK = '#3A2200'
const CLOUD = '#FFF6E8'
const CLOUD_EDGE = '#F4A261'
const SMOKE = '#F1F1F6'
const SMOKE_EDGE = '#8E8EA6'
const FONT = `font-family="ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', system-ui, sans-serif"`

export function random(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (v: number) => String(Math.round(v * 10) / 10)

const escapeXml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] ?? c)

// ---- SMIL helpers ----------------------------------------------------------

type Timing = { dur: number; begin?: number; keyTimes?: number[]; splines?: string; repeat?: boolean }

function timing({ dur, begin = 0, keyTimes, splines, repeat }: Timing): string {
  return (
    `dur="${n(dur)}s" begin="${n(begin)}s" ` +
    (repeat ? 'repeatCount="indefinite"' : 'fill="freeze"') +
    (keyTimes ? ` keyTimes="${keyTimes.join(';')}"` : '') +
    (splines ? ` calcMode="spline" keySplines="${splines}"` : '')
  )
}

const animate = (attr: string, values: (string | number)[], t: Timing) =>
  `<animate attributeName="${attr}" values="${values.map(v => (typeof v === 'number' ? n(v) : v)).join(';')}" ${timing(t)}/>`

const animateTransform = (type: 'translate' | 'scale' | 'rotate', values: string[], t: Timing) =>
  `<animateTransform attributeName="transform" type="${type}" values="${values.join(';')}" ${timing(t)}/>`

// A keySpline, x1 y1 x2 y2: how a segment's progress eases over its time.
type Spline = [number, number, number, number]

// The share of a segment's time an eased motion takes to cover `part` of it.
function timeFor([x1, y1, x2, y2]: Spline, part: number): number {
  const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3
  let [lo, hi] = [0, 1]
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (at(y1, y2, mid) < part) lo = mid
    else hi = mid
  }
  return at(x1, x2, (lo + hi) / 2)
}

// Hidden until `begin`, shown, then faded out by the end of `dur`.
const fadeGroup = (content: string, begin: number, dur: number, holdUntil = 0.8) =>
  `<g opacity="0">${animate('opacity', [0, 1, 1, 0], { dur, begin, keyTimes: [0, 0.03, holdUntil, 1] })}${content}</g>`

// What pops springs to this size before it settles.
export const PEAK = 1.28

// Springs `content` in from nothing at (x, y); `cls` names it for the tests.
const pop = (content: string, x: number, y: number, begin: number, rotate = 0, dur = 0.5, cls = '') =>
  `<g${cls ? ` class="${cls}"` : ''} transform="translate(${n(x)} ${n(y)})${rotate ? ` rotate(${rotate})` : ''}"><g transform="scale(0)">` +
  animateTransform('scale', ['0.2', String(PEAK), '0.9', '1.05', '1'], { dur, begin, keyTimes: [0, 0.35, 0.6, 0.8, 1] }) +
  `${content}</g></g>`

// ---- words that fit --------------------------------------------------------

// What a label keeps clear of the view's edges at its peak.
const MARGIN = 4

// Ems per character, a little over the widest measured (docs/ARCHITECTURE.md); others count 1.
const EMS: [RegExp, number][] = [
  [/[ il.,:;'|!·Ij]/, 0.33],
  [/[ft/\\()[\]{}]/, 0.42],
  [/[r"*`-]/, 0.5],
  [/[acesvxyzk]/, 0.6],
  [/[bdghnopquFJL_?]/, 0.64],
  [/[0-9TPESZY+<=>^~$#×]/, 0.7],
  [/[mwM]/, 0.92],
  [/[A-Z&]/, 0.8],
]

type TextOptions = { spacing?: number; stroke?: number; isCentred?: boolean }

// A middle-anchored text's box, estimated: no text metrics reach a mod.
export function textBox(text: string, size: number, { spacing = 0, stroke = 0, isCentred = false }: TextOptions = {}) {
  const advance = [...text].reduce((sum, c) => sum + (EMS.find(([set]) => set.test(c))?.[1] ?? 1) * size + spacing, 0)
  const [top, bottom] = isCentred ? [-0.55 * size, 0.55 * size] : [-0.8 * size, 0.25 * size]

  return { width: advance + stroke, top: top - stroke / 2, bottom: bottom + stroke / 2 }
}

type Placed = { box: ReturnType<typeof textBox>; dy: number }

// How far texts reach from their origin, scaled by `peak` and turned by `rotate`.
function reach(texts: Placed[], peak: number, rotate: number) {
  const a = (rotate * Math.PI) / 180
  const corners = texts.flatMap(({ box, dy }) => [-box.width / 2, box.width / 2].flatMap(x => [dy + box.top, dy + box.bottom].map(y => [x, y] as const)))
  const across = corners.map(([x, y]) => Math.abs(peak * (x * Math.cos(a) - y * Math.sin(a))))
  const down = corners.map(([x, y]) => peak * (x * Math.sin(a) + y * Math.cos(a)))

  return { half: Math.max(...across), top: Math.min(...down), bottom: Math.max(...down) }
}

// The largest size down to `floor` that fits; past it, the text is cut with "…", to "…" alone.
function fit(text: string, size: number, floor: number, fits: (text: string, size: number) => boolean) {
  let s = size
  while (s - 0.5 >= floor && !fits(text, s)) s -= 0.5
  if (fits(text, s)) {
    return { text, size: s }
  }
  const chars = [...text]
  while (chars.length > 0 && !fits(`${chars.join('').trimEnd()}…`, s)) chars.pop()

  return { text: `${chars.join('').trimEnd()}…`, size: s }
}

// ---- shared pieces ---------------------------------------------------------

type LabelOptions = { y: number; fill: string; begin: number; dur: number; size?: number; rotate?: number }

// The word that pops out, tilted like a cartoon sound effect; it fits the view at its peak.
function label(title: string, subtitle: string, { y, fill, begin, dur, size = 30, rotate = -6 }: LabelOptions): string {
  const room = VIEW_WIDTH / 2 - MARGIN
  const titleAt = (text: string, s: number): Placed => ({ box: textBox(text, s, { stroke: 6, isCentred: true }), dy: 0 })
  const head = fit(title, size, size * 0.7, (text, s) => reach([titleAt(text, s)], PEAK, rotate).half <= room)
  const dy = head.size * 0.8
  const subAt = (text: string, s: number): Placed => ({ box: textBox(text, s, { stroke: 4 }), dy })
  const tail = subtitle ? fit(subtitle, 14, 10, (text, s) => reach([subAt(text, s)], PEAK, rotate).half <= room) : undefined
  const { top, bottom } = reach([titleAt(head.text, head.size), ...(tail ? [subAt(tail.text, tail.size)] : [])], PEAK, rotate)
  // A safety net for words longer than the drawing placed its label for.
  const at = Math.max(MARGIN - top, Math.min(y, HEIGHT - MARGIN - bottom))

  const ink = `stroke="${INK}" stroke-linejoin="round" paint-order="stroke"`
  const sub = tail
    ? `<text y="${n(dy)}" text-anchor="middle" ${FONT} font-size="${n(tail.size)}" font-weight="800" fill="#FFFFFF" ` +
      `stroke-width="4" ${ink}>${escapeXml(tail.text)}</text>`
    : ''
  const text =
    `<text text-anchor="middle" dominant-baseline="middle" ${FONT} font-size="${n(head.size)}" font-weight="900" ` +
    `fill="${fill}" stroke-width="6" ${ink}>${escapeXml(head.text)}</text>${sub}`

  return fadeGroup(pop(text, CX, at, begin, rotate, 0.5, 'label'), begin, dur)
}

type CloudOptions = {
  cx: number
  cy: number
  count: number
  spread: [number, number]
  radius: [number, number]
  begin?: number
  dur?: number
  fill?: string
  edge?: string
  stretch?: [number, number]
}

// A puff: circles that swell, drift and shrink away, never fading, so no edge shows through.
// The edge layer under the fill layer outlines only the cloud's rim.
function cloud(rnd: () => number, o: CloudOptions): string {
  const { cx, cy, count, begin = 0, dur = 0.8, fill = CLOUD, edge = CLOUD_EDGE, stretch = [1.5, 0.75] } = o
  const blobs = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + rnd() * 0.5
    const d = i === 0 ? 0 : o.spread[0] + rnd() * (o.spread[1] - o.spread[0])
    return {
      x: cx + Math.cos(a) * d * stretch[0],
      y: cy + Math.sin(a) * d * stretch[1],
      dx: Math.cos(a) * (8 + rnd() * 8),
      dy: Math.sin(a) * (8 + rnd() * 8),
      r: o.radius[0] + rnd() * (o.radius[1] - o.radius[0]),
      begin: begin + rnd() * 0.06,
    }
  })
  const layer = (color: string, grow: number) =>
    blobs
      .map(b => {
        const t = { dur, begin: b.begin, keyTimes: [0, 0.25, 0.6, 1] }
        return (
          `<circle cx="${n(cx)}" cy="${n(cy)}" r="0" fill="${color}">` +
          animate('cx', [cx, b.x, b.x + b.dx, b.x + b.dx * 1.4], t) +
          animate('cy', [cy, b.y, b.y + b.dy - 4, b.y + b.dy * 1.4 - 8], t) +
          animate('r', [0, b.r + grow, b.r * 1.05 + grow, 0], t) +
          `</circle>`
        )
      })
      .join('')

  return `<g class="puff">${layer(edge, 2.5)}${layer(fill, 0)}</g>`
}

type RayOptions = { cx: number; cy: number; count: number; from: [number, number]; to: [number, number]; begin: number; flat?: number; colors?: string[] }

// Short cartoon motion lines shooting out of a point.
function rays(rnd: () => number, o: RayOptions): string {
  const { cx, cy, count, begin, flat = 0.8, colors = ['#FFD23F', '#FF9F1C'] } = o
  let out = ''
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.3
    const at = (r: number): [string, string] => [n(cx + Math.cos(a) * r), n(cy + Math.sin(a) * flat * r)]
    const [ax1, ay1] = at(o.from[0])
    const [ax2, ay2] = at(o.from[1])
    const [bx1, by1] = at(o.to[0])
    const [bx2, by2] = at(o.to[1])
    const t = { dur: 0.38, begin, keyTimes: [0, 1], splines: '0.2 0.8 0.4 1' }
    out +=
      `<line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="${colors[i % colors.length] ?? INK}" ` +
      `stroke-width="4" stroke-linecap="round" opacity="0">` +
      animate('x1', [ax1, bx1], t) +
      animate('y1', [ay1, by1], t) +
      animate('x2', [ax2, bx2], t) +
      animate('y2', [ay2, by2], t) +
      animate('opacity', [1, 1, 0], { dur: 0.38, begin, keyTimes: [0, 0.5, 1] }) +
      `</line>`
  }
  return out
}

// A four-pointed twinkle that flashes in and out.
function sparkle(x: number, y: number, size: number, color: string, begin: number): string {
  const s = size
  const k = s * 0.28
  const d = `M0,${-s} L${k},${-k} L${s},0 L${k},${k} L0,${s} L${-k},${k} L${-s},0 L${-k},${-k} Z`
  return (
    `<g transform="translate(${n(x)} ${n(y)})"><g transform="scale(0)">` +
    animateTransform('scale', ['0', '1.25', '0'], { dur: 0.6, begin, keyTimes: [0, 0.4, 1] }) +
    `<path d="${d}" fill="${color}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></g></g>`
  )
}

// A metal rod, outlined so it reads on a dark background too.
const rod = (x1: number, y1: number, x2: number, y2: number) =>
  [
    [INK, 5.5],
    ['#9AA0AE', 2.5],
  ]
    .map(([color, width]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`)
    .join('')

// A "!" warning sign that pops in at (x, y) and wags, gone by `end`.
const sign = (fill: string, mark: string, x: number, y: number, begin: number, end: number) =>
  fadeGroup(
    pop(
      `<g><g transform="rotate(0)">${animateTransform('rotate', ['0', '-14', '12', '-8', '6', '0'], { dur: 0.7, begin: begin + 0.2 })}` +
        `<path d="M0,-22 L22,16 L-22,16 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
        `<text y="9" text-anchor="middle" ${FONT} font-size="24" font-weight="900" fill="${mark}">!</text></g></g>`,
      x,
      y,
      begin,
    ),
    begin,
    end - begin,
  )

// A sweat drop that slides by (dx, dy) and fades.
const sweat = (x: number, y: number, dx: number, dy: number, begin: number) =>
  `<g transform="translate(${x} ${y})" opacity="0">${animate('opacity', [1, 1, 0], { dur: 0.6, begin, keyTimes: [0, 0.6, 1] })}` +
  `<g>${animateTransform('translate', ['0 0', `${dx} ${dy}`], { dur: 0.6, begin, keyTimes: [0, 1], splines: '0.3 0 0.7 1' })}` +
  `<path d="M0,-7 C3,-2 5,1 5,3 A5,5 0 0 1 -5,3 C-5,1 -3,-2 0,-7Z" fill="#8FD0FF" stroke="${INK}" stroke-width="1.5"/></g></g>`

// Quick horizontal streaks on both sides of a squash.
function streaks(cx: number, ys: number[], gap: number, begin: number): string {
  return [-1, 1]
    .flatMap(side =>
      ys.map(y => {
        const x1 = cx + side * gap
        const t = { dur: 0.35, begin, keyTimes: [0, 1] }
        return (
          `<line x1="${n(x1)}" y1="${n(y)}" x2="${n(x1 + side * 10)}" y2="${n(y)}" stroke="${INK}" stroke-width="3" ` +
          `stroke-linecap="round" opacity="0">` +
          animate('x1', [x1, x1 + side * 26], t) +
          animate('x2', [x1 + side * 10, x1 + side * 44], t) +
          animate('opacity', [1, 1, 0], { dur: 0.35, begin, keyTimes: [0, 0.5, 1] }) +
          `</line>`
        )
      }),
    )
    .join('')
}

// ---- push: a rocket blasts off ---------------------------------------------

// One piece of confetti: bursts out of (x, y) from `start`, slows in the air, then flutters down.
function confettiPiece(rnd: () => number, color: string, x: number, y: number, start: number): string {
  const up = 260 + rnd() * 260
  const side = (rnd() * 2 - 1) * 540
  const drag = 2.6 + rnd() * 1.4
  const gravity = 430
  // It falls for at most two seconds, so a burst at lift-off still ends with the push.
  const dur = 1.5 + rnd() * 0.5
  const begin = start + rnd() * 0.1
  const sway = 6 + rnd() * 10
  const swayRate = 4 + rnd() * 4
  const phase = rnd() * Math.PI * 2

  const steps = 12
  const path = Array.from({ length: steps + 1 }, (_, i) => {
    const t = (dur * i) / steps
    const slow = 1 - Math.exp(-drag * t)
    const x = (side / drag) * slow + sway * Math.sin(swayRate * t + phase) * (t / dur)
    const height = ((up + gravity / drag) / drag) * slow - (gravity / drag) * t
    return `${n(x)},${n(-height)}`
  }).join(';')

  const kind = rnd()
  let shape: string
  if (kind < 0.5) {
    const w = 5 + rnd() * 3
    const h = 9 + rnd() * 5
    shape = `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="1" fill="${color}"/>`
  } else if (kind < 0.7) {
    shape = `<circle r="${n(3 + rnd() * 1.5)}" fill="${color}"/>`
  } else if (kind < 0.85) {
    shape = `<path d="M0,-5 L5,4 L-5,4 Z" fill="${color}"/>`
  } else {
    shape = `<path d="M-8,0 q2,-5 4,0 t4,0 t4,0 t4,0" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
  }

  const spin = (rnd() < 0.5 ? -1 : 1) * (360 + rnd() * 900)
  const flip = 0.25 + rnd() * 0.35
  const t = `dur="${n(dur)}s" begin="${n(begin)}s" fill="freeze"`
  return (
    `<g transform="translate(${n(x)} ${n(y)})" opacity="0">` +
    `<animateMotion values="${path}" ${t}/>` +
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.03;0.72;1" ${t}/>` +
    `<g><animateTransform attributeName="transform" type="rotate" from="0" to="${n(spin)}" ${t}/>` +
    `<g>${animateTransform('scale', ['1 1', '1 0.2', '1 1'], { dur: flip, begin, repeat: true })}${shape}</g></g></g>`
  )
}

const PAD_Y = 160
const LIFT_OFF = 0.45

// Shakes on its pad, lifts off through its smoke and speeds out of the top; confetti bursts from the pad.
function rocket(rnd: () => number, title: string, subtitle: string): string {
  const pad =
    `<g class="pad">${rod(CX - 22, PAD_Y + 8, CX - 30, PAD_Y + 24)}${rod(CX + 22, PAD_Y + 8, CX + 30, PAD_Y + 24)}` +
    `<rect x="${CX - 30}" y="${PAD_Y}" width="60" height="8" rx="3" fill="#8E8E9A" stroke="${INK}" stroke-width="3"/></g>`
  const flame =
    `<g class="flame" transform="translate(0 2)"><g transform="scale(1 0.4)">${animateTransform('scale', ['1 0.4', '1 1.1', '1 0.8', '1 1.3', '1 0.9'], { dur: 0.2, begin: 0.12, repeat: true })}` +
    `<path d="M-9,0 Q0,36 9,0Z" fill="#FF9F1C" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M-4,0 Q0,18 4,0Z" fill="#FFD23F"/></g></g>`
  const body =
    `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">` +
    `<path d="M-12,-18 L-26,4 L-11,0Z" fill="#FF5E5B"/><path d="M12,-18 L26,4 L11,0Z" fill="#FF5E5B"/>` +
    `<path d="M0,-64 C16,-48 17,-20 13,0 L-13,0 C-17,-20 -16,-48 0,-64Z" fill="#FFFFFF"/>` +
    `<path d="M0,-64 C8,-57 12,-49 14,-42 L-14,-42 C-12,-49 -8,-57 0,-64Z" fill="#FF5E5B"/>` +
    `<circle cy="-24" r="8" fill="#4D96FF"/></g>` +
    `<path d="M-4,-28 A5,5 0 0 1 1,-31" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`
  const shake = animateTransform('translate', ['0 0', '-1.5 0', '1.5 0', '-1.5 0', '1.5 0', '-1 0', '1 0', '0 0'], { dur: 0.42, begin: 0.03 })
  const lift = { dur: 1.3, keyTimes: [0, 0.35, 1], splines: '0 0 1 1;0.55 0 1 1' }
  const ship =
    `<g transform="translate(${CX} ${PAD_Y - 4})"><g class="rocket">${animateTransform('translate', ['0 0', '0 0', '0 -320'], lift)}` +
    `<g>${shake}${flame}${body}</g></g></g>`

  // A puff left at each height as the rocket passes it.
  const trail = [0, 1, 2, 3]
    .map(k =>
      cloud(rnd, { cx: CX, cy: PAD_Y - 32 - k * 34, count: 3, spread: [3, 7], radius: [6, 9], begin: 0.7 + k * 0.08, dur: 0.6, fill: SMOKE, edge: SMOKE_EDGE }),
    )
    .join('')
  const pieces = Array.from({ length: 30 }, (_, i) => confettiPiece(rnd, COLORS[i % COLORS.length] ?? INK, CX, PAD_Y - 14, LIFT_OFF)).join('')

  return (
    fadeGroup(pad, 0, 2.4, 0.85) +
    ship +
    cloud(rnd, {
      cx: CX,
      cy: PAD_Y + 2,
      count: 9,
      spread: [14, 28],
      radius: [11, 18],
      begin: 0.3,
      dur: 1.2,
      fill: SMOKE,
      edge: SMOKE_EDGE,
      stretch: [1.9, 0.5],
    }) +
    trail +
    rays(rnd, { cx: CX, cy: PAD_Y - 6, count: 10, from: [30, 38], to: [58, 72], flat: 0.5, begin: LIFT_OFF }) +
    pieces +
    label(title, subtitle, { y: 96, fill: '#FFD23F', begin: 0.85, dur: 1.7 })
  )
}

// ---- commit: a rubber stamp ------------------------------------------------

const STAMP_INK = '#E5484D'

function stamp(rnd: () => number, word: string, subtitle: string): string {
  const floor = 140
  const body =
    `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">` +
    `<rect x="-46" y="-11" width="92" height="11" rx="2" fill="${STAMP_INK}"/>` +
    `<rect x="-42" y="-35" width="84" height="25" rx="5" fill="#4A4A55"/>` +
    `<rect x="-10" y="-54" width="20" height="20" fill="#8B5A2B"/>` +
    `<ellipse cx="0" cy="-66" rx="23" ry="16" fill="#B07438"/></g>` +
    `<rect x="-37" y="-31" width="40" height="5" rx="2" fill="#6E6E7C"/>` +
    `<ellipse cx="-8" cy="-71" rx="8" ry="4" fill="#D39A5C"/>`
  const drop = { dur: 1, keyTimes: [0, 0.28, 0.42, 0.6, 1], splines: '0.55 0 1 1;0 0 1 1;0.2 0 0.6 1;0.5 0 1 1' }
  const theStamp =
    `<g transform="translate(${CX} ${floor})" opacity="0">` +
    animate('opacity', [1, 1, 1, 0], { dur: 1, keyTimes: [0, 0.6, 0.9, 1] }) +
    `<g transform="translate(0 -170)">` +
    animateTransform('translate', ['0 -170', '0 0', '0 0', '0 -36', '0 -210'], drop) +
    `<g>${animateTransform('scale', ['1 1', '1 1', '1.1 0.84', '0.97 1.04', '1 1'], { dur: 1, keyTimes: [0, 0.27, 0.31, 0.4, 1] })}` +
    `${body}</g></g></g>`

  // The word fits inside the imprint's inner frame, and the hash under it;
  // AMENDED needs the floor this low.
  const stamped = fit(word, 34, 20, (text, s) => textBox(text, s, { spacing: 3 }).width <= 140)
  const hash = fit(subtitle, 14, 10, (text, s) => textBox(text, s, { stroke: 4 }).width <= 160)
  const inkText = `${FONT} font-size="${n(stamped.size)}" font-weight="900" letter-spacing="3" fill="${STAMP_INK}"`
  const sub = subtitle
    ? `<text y="50" text-anchor="middle" ${FONT} font-size="${n(hash.size)}" font-weight="800" fill="#FFFFFF" stroke="${INK}" ` +
      `stroke-width="4" stroke-linejoin="round" paint-order="stroke">${escapeXml(hash.text)}</text>`
    : ''
  const imprint =
    `<g class="label" transform="translate(${CX} 104) rotate(-8)"><g transform="scale(0)">` +
    animateTransform('scale', ['1.35', '0.94', '1.02', '1'], { dur: 0.3, begin: 0.42, keyTimes: [0, 0.5, 0.8, 1] }) +
    `<g opacity="0.92"><rect x="-84" y="-31" width="168" height="62" rx="10" fill="none" stroke="${STAMP_INK}" stroke-width="5"/>` +
    `<rect x="-76" y="-23" width="152" height="46" rx="6" fill="none" stroke="${STAMP_INK}" stroke-width="2"/>` +
    `<text text-anchor="middle" dominant-baseline="central" ${inkText}>${escapeXml(stamped.text)}</text></g>${sub}</g></g>`

  return (
    fadeGroup(imprint, 0.42, 1.8) +
    cloud(rnd, { cx: CX - 62, cy: floor - 4, count: 4, spread: [6, 12], radius: [7, 11], begin: 0.28, dur: 0.6 }) +
    cloud(rnd, { cx: CX + 62, cy: floor - 4, count: 4, spread: [6, 12], radius: [7, 11], begin: 0.28, dur: 0.6 }) +
    rays(rnd, { cx: CX, cy: floor - 6, count: 10, from: [54, 62], to: [80, 96], flat: 0.45, begin: 0.28 }) +
    theStamp
  )
}

// ---- tests: a pencil ticks off a clipboard ---------------------------------

const BOARD_TOP = 22
const BOARD_MID = BOARD_TOP + 60
const BOARD_TILT = -3
// The checklist's rows, the boxes' left edge, and when each box is ticked.
const CHECK_ROWS = [50, 70, 90, 110]
const CHECK_X = CX - 34
const TICKED = CHECK_ROWS.map((_, i) => 0.36 + i * 0.17)
const STAR_AT = 1.05

// Where a point on the board sits once the board is tilted.
function onBoard(x: number, y: number): [number, number] {
  const a = (BOARD_TILT * Math.PI) / 180
  const [dx, dy] = [x - CX, y - BOARD_MID]
  return [CX + dx * Math.cos(a) - dy * Math.sin(a), BOARD_MID + dx * Math.sin(a) + dy * Math.cos(a)]
}

const starPoints = (outer: number, inner: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    return `${n(Math.cos(a) * r)},${n(Math.sin(a) * r)}`
  }).join(' ')

function clipboard(rnd: () => number, title: string, subtitle: string): string {
  const lines = [24, 12, 30, 18]
  const board =
    `<rect x="${CX - 50}" y="${BOARD_TOP}" width="100" height="120" rx="8" fill="#C98B4E" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="${CX - 42}" y="${BOARD_TOP + 10}" width="84" height="102" rx="3" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="${CX - 18}" y="${BOARD_TOP - 6}" width="36" height="14" rx="4" fill="#C9CCD6" stroke="${INK}" stroke-width="3"/>` +
    CHECK_ROWS.map(
      (y, i) =>
        `<rect class="box" x="${CHECK_X}" y="${y - 6}" width="12" height="12" rx="2" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>` +
        `<line x1="${CHECK_X + 20}" y1="${y}" x2="${CHECK_X + 40 + (lines[i] ?? 0)}" y2="${y}" stroke="#C9C2B0" stroke-width="4" stroke-linecap="round"/>`,
    ).join('')
  const ticks = CHECK_ROWS.map(
    (y, i) =>
      `<path class="tick" d="M${CHECK_X + 1},${y} L${CHECK_X + 5},${y + 5} L${CHECK_X + 15},${y - 8}" pathLength="10" fill="none" ` +
      `stroke="#2FBF71" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="10 10" stroke-dashoffset="10">` +
      animate('stroke-dashoffset', [10, 0], { dur: 0.12, begin: TICKED[i] ?? 0 }) +
      `</path>`,
  ).join('')
  // The star slaps on from 2.4 times its size.
  const sticker =
    `<g class="sticker" transform="translate(${CX + 44} ${BOARD_TOP + 16}) rotate(-14)"><g transform="scale(0)">` +
    animateTransform('scale', ['2.4', '0.88', '1.06', '1'], { dur: 0.3, begin: STAR_AT, keyTimes: [0, 0.5, 0.8, 1] }) +
    `<polygon points="${starPoints(24, 11)}" fill="#FFD23F" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M-6,-9 L-2,-14" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/></g></g>`

  const pencil =
    `<g transform="rotate(35)" stroke="${INK}" stroke-width="2" stroke-linejoin="round">` +
    `<rect x="-4.5" y="-46" width="9" height="34" fill="#FFD23F"/><rect x="-4.5" y="-53" width="9" height="8" rx="2" fill="#FF70A6"/>` +
    `<path d="M-4.5,-12 L0,0 L4.5,-12Z" fill="#F4D3A8"/><path d="M-1.5,-4 L0,0 L1.5,-4Z" fill="${INK}"/></g>`
  // In from the right, through each box as its tick draws, then off the top.
  const stops: [number, [number, number]][] = [
    [0, [360, 150]],
    [0.08, [360, 150]],
    ...CHECK_ROWS.flatMap((y, i): [number, [number, number]][] => [
      [TICKED[i] ?? 0, onBoard(CHECK_X + 1, y)],
      [(TICKED[i] ?? 0) + 0.12, onBoard(CHECK_X + 15, y - 8)],
    ]),
    [1.3, [380, -30]],
  ]
  const thePencil =
    `<g transform="translate(360 150)">` +
    animateTransform(
      'translate',
      stops.map(([, [x, y]]) => `${n(x)} ${n(y)}`),
      { dur: 1.3, keyTimes: stops.map(([t]) => Math.round((t / 1.3) * 1000) / 1000) },
    ) +
    `${pencil}</g>`

  const [starX, starY] = onBoard(CX + 44, BOARD_TOP + 16)
  const twinkles = ['#FFD23F', '#7BE04A', '#3BCEAC']
  const sparkles = [
    [300, 20],
    [312, 64],
    [152, 40],
  ]
    .map(([x = 0, y = 0], i) => sparkle(x, y, 6 + rnd() * 5, twinkles[i % twinkles.length] ?? INK, STAR_AT + 0.08 + i * 0.08))
    .join('')

  return (
    fadeGroup(
      pop(`<g class="clipboard" transform="translate(${-CX} ${-BOARD_MID})">${board}${ticks}${sticker}</g>`, CX, BOARD_MID, 0, BOARD_TILT, 0.35),
      0,
      2.35,
      0.85,
    ) +
    thePencil +
    rays(rnd, { cx: starX, cy: starY, count: 8, from: [26, 32], to: [42, 52], flat: 1, begin: STAR_AT + 0.02 }) +
    sparkles +
    label(title, subtitle, { y: 145, fill: '#7BE04A', begin: 1.1, dur: 1.25, size: 28, rotate: -4 })
  )
}

// ---- compact: a press squishes a pile of pages into a cube -----------------

function squish(rnd: () => number, title: string, subtitle: string): string {
  const floor = 152
  const pile = Array.from({ length: 6 }, (_, i) => {
    const dx = (rnd() - 0.5) * 10
    const tilt = (rnd() - 0.5) * 5
    return (
      `<g transform="translate(${n(dx)} ${-(i + 1) * 16}) rotate(${n(tilt)})">` +
      `<rect x="-40" y="0" width="80" height="14" rx="2" fill="#FFFFFF" stroke="#A89F88" stroke-width="2"/>` +
      `<line x1="-30" y1="7" x2="${n(10 + rnd() * 18)}" y2="7" stroke="#C9C2B0" stroke-width="2" stroke-linecap="round"/></g>`
    )
  }).join('')
  const crush = '0 0 1 1;0.3 0 0.7 1;0 0 1 1'
  const thePile =
    `<g transform="translate(${CX} ${floor})" opacity="0">` +
    animate('opacity', [1, 1, 0, 0], { dur: 1, keyTimes: [0, 0.75, 0.85, 1] }) +
    `<g>${animateTransform('scale', ['1 1', '1 1', '1.14 0.35', '1.14 0.35'], { dur: 1, keyTimes: [0, 0.2, 0.45, 1], splines: crush })}` +
    `${pile}</g></g>`

  const pressAt = floor - 34
  const press =
    `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">` +
    `<rect x="-7" y="-150" width="14" height="134" fill="#8E8E9A"/>` +
    `<rect x="-62" y="-18" width="124" height="18" rx="3" fill="#5B5B66"/></g>` +
    `<rect x="-56" y="-15" width="70" height="4" rx="2" fill="#7C7C88"/>`
  const thePress =
    `<g transform="translate(${CX} ${pressAt})"><g transform="translate(0 -122)">` +
    animateTransform('translate', ['0 -122', '0 -62', '0 0', '0 0', '0 -200'], {
      dur: 1,
      keyTimes: [0, 0.2, 0.45, 0.7, 1],
      splines: '0.4 0 1 1;0.3 0 0.7 1;0 0 1 1;0.5 0 1 1',
    }) +
    `${press}</g></g>`

  const cube =
    `<g stroke="#A89F88" stroke-width="2" stroke-linejoin="round">` +
    `<path d="M-30,-48 L-16,-60 L34,-60 L20,-48 Z" fill="#F6F1E4"/>` +
    `<path d="M20,-48 L34,-60 L34,-12 L20,0 Z" fill="#E4DCC8"/>` +
    `<rect x="-30" y="-48" width="50" height="48" fill="#FFFFFF"/></g>` +
    [1, 2, 3, 4, 5].map(k => `<line x1="-26" y1="${-48 + k * 8}" x2="16" y2="${-48 + k * 8}" stroke="#D8D0BC" stroke-width="1.5"/>`).join('') +
    `<g fill="#4D96FF" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round">` +
    `<rect x="-9" y="-48" width="8" height="48"/><path d="M-9,-48 L5,-60 L13,-60 L-1,-48 Z"/></g>`
  const theCube =
    `<g transform="translate(${CX - 2} ${floor})"><g transform="scale(0)">` +
    animateTransform('scale', ['0.3', '1.2', '0.94', '1.03', '1'], { dur: 0.4, begin: 0.78, keyTimes: [0, 0.4, 0.65, 0.85, 1] }) +
    `${cube}</g></g>`

  return (
    thePile +
    fadeGroup(theCube, 0.78, 1.7) +
    streaks(CX, [floor - 8, floor - 18, floor - 28], 54, 0.45) +
    cloud(rnd, { cx: CX - 58, cy: floor - 2, count: 4, spread: [6, 12], radius: [7, 11], begin: 0.45, dur: 0.6 }) +
    cloud(rnd, { cx: CX + 58, cy: floor - 2, count: 4, spread: [6, 12], radius: [7, 11], begin: 0.45, dur: 0.6 }) +
    thePress +
    label(title, subtitle, { y: 42, fill: '#6FB6FF', begin: 0.85, dur: 1.6, rotate: -5 })
  )
}

// ---- helpers: ninja helpers leap out of a smoke bomb and strike a pose -----

const BODY = '#D97757'
const EYES = '#2B1A12'
const FEET = 152

// A pixel ninja facing right, feet at (0, 0): mid-dash, or posed (arms up, eyes ^ ^).
function ninja(band: string, isPosed: boolean): string {
  const px = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`
  const legs = (isPosed ? [1, 3, 9, 11] : [2, 4, 8, 10]).map(x => px(x, 6, 1, 2, BODY)).join('')
  const arms = isPosed
    ? px(0, 1, 1, 1, BODY) + px(-1, -1, 1, 2, BODY) + px(12, 1, 1, 1, BODY) + px(13, -1, 1, 2, BODY)
    : px(0, 2, 1, 2, BODY) + px(12, 2, 1, 2, BODY)
  const tail = isPosed ? px(-2, 2, 2, 1, band) + px(-4, 3, 2, 1, band) : px(-1, 1, 2, 1, band) + px(-2, 0, 1, 1, band)
  const eyes = isPosed
    ? [3, 8].map(x => px(x, 3, 1, 1, EYES) + px(x + 1, 2, 1, 1, EYES) + px(x + 2, 3, 1, 1, EYES)).join('')
    : px(4, 2, 1, 2, EYES) + px(9, 2, 1, 2, EYES)

  return (
    `<g transform="scale(4) translate(-6.5 -8)" shape-rendering="crispEdges">` +
    px(1, 0, 11, 6, BODY) +
    arms +
    legs +
    px(1, 1, 11, 1, band) +
    tail +
    eyes +
    `</g>`
  )
}

// Where a crew of one to five lands, from the bomb: inside the view even mid-squash.
const SPOTS: number[][] = [[64], [64, -64], [92, -92, 0], [34, -34, 92, -92], [46, -46, 92, -92, 0]]

// Leaps from the smoke, squashes, hops, then holds its pose until the label goes.
function helper(rnd: () => number, i: number, x: number): string {
  const dir = x < 0 ? -1 : 1
  const begin = 0.36 + i * 0.07
  const band = COLORS[(i * 3) % COLORS.length] ?? INK
  const leap = { dur: 1, begin, keyTimes: [0, 0.22, 0.45, 0.58, 0.72, 0.86, 1] }
  const lift = x === 0 ? -48 : -30 - rnd() * 10
  const hops: [number, number][] = [
    [0, 0],
    [x / 2, lift],
    [x, 0],
    [x, 0],
    [x, -12],
    [x, 0],
    [x, 0],
  ]
  const squash = ['1 1', '1 1', '1.25 0.75', '0.9 1.12', '1 1', '1.12 0.9', '1 1']
  // The dashing sprite gives way to the posed one as it lands.
  const swap = { dur: 1, begin, keyTimes: [0, 0.44, 0.45, 1] }
  const dashing = `<g>${animate('opacity', [1, 1, 0, 0], swap)}${ninja(band, false)}</g>`
  const posed = `<g opacity="0">${animate('opacity', [0, 0, 1, 1], swap)}${ninja(band, true)}</g>`
  const trail = [-8, -16, -24]
    .map((y, k) => `<line x1="${-30 - k * 3}" y1="${y}" x2="${-50 - k * 6}" y2="${y}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`)
    .join('')
  const trails = `<g opacity="0">${animate('opacity', [0.6, 0.6, 0], { dur: 0.5, begin, keyTimes: [0, 0.7, 1] })}${trail}</g>`

  return (
    `<g class="helper" transform="translate(${CX} ${FEET})" opacity="0">` +
    animate('opacity', [1, 1, 0], { dur: 2.45 - begin, begin, keyTimes: [0, 0.88, 1] }) +
    `<g>${animateTransform(
      'translate',
      hops.map(([a, b]) => `${n(a)} ${n(b)}`),
      leap,
    )}` +
    `<g>${animateTransform('scale', squash, leap)}` +
    `<g transform="scale(${dir} 1)">${trails}${dashing}${posed}</g></g></g></g>` +
    sparkle(CX + x + dir * 20, FEET - 50, 7, COLORS[(i * 3 + 1) % COLORS.length] ?? INK, begin + 0.62)
  )
}

// A round bomb drops in, its fuse fizzing, and bursts into the smoke.
function bomb(): string {
  const body =
    `<circle r="12" fill="#2B2B33" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M-6,-4 A7,7 0 0 1 0,-9" fill="none" stroke="#6E6E7C" stroke-width="2.5" stroke-linecap="round"/>` +
    `<rect x="-4" y="-17" width="8" height="6" rx="1" fill="#6E6E7C" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M0,-17 q4,-7 10,-6" fill="none" stroke="#B07438" stroke-width="2.5" stroke-linecap="round"/>` +
    sparkle(10, -23, 6, '#FFD23F', 0)

  return (
    `<g transform="translate(${CX} 136)" opacity="0">` +
    animate('opacity', [1, 1, 0], { dur: 0.26, keyTimes: [0, 0.9, 1] }) +
    `<g>${animateTransform('translate', ['0 -80', '0 0', '0 -7', '0 0'], { dur: 0.22, keyTimes: [0, 0.6, 0.8, 1] })}${body}</g></g>`
  )
}

function helpers(rnd: () => number, title: string, subtitle: string, count: number): string {
  const spots = SPOTS[Math.max(1, Math.min(count, SPOTS.length)) - 1] ?? [0]
  return (
    bomb() +
    cloud(rnd, {
      cx: CX,
      cy: 134,
      count: 11,
      spread: [18, 32],
      radius: [15, 24],
      begin: 0.2,
      dur: 1,
      fill: SMOKE,
      edge: SMOKE_EDGE,
      stretch: [1.6, 0.7],
    }) +
    spots.map((x, i) => helper(rnd, i, x)).join('') +
    label(title, subtitle, { y: 44, fill: '#FF9F1C', begin: 0.4, dur: 2.05 })
  )
}

// ---- review: a magnifying glass with a googly eye sweeps a page of code ----

// The eye's white and iris, and how far the iris darts across and down.
const EYE_R = 24
const IRIS_R = 11
const LOOK_X = 7
const LOOK_Y = 2

function review(rnd: () => number, title: string, subtitle: string, findings: number): string {
  const top = 30
  const lines = [
    { indent: 0, length: 62, color: '#B76EF0' },
    { indent: 10, length: 74, color: '#4D96FF' },
    { indent: 10, length: 50, color: '#3BCEAC' },
    { indent: 20, length: 58, color: '#FF9F1C' },
    { indent: 10, length: 40, color: '#4D96FF' },
    { indent: 0, length: 26, color: '#B76EF0' },
  ]
  const lineY = (i: number) => top + 16 + i * 13
  const page =
    `<rect x="${CX - 62}" y="${top}" width="124" height="92" rx="8" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>` +
    lines
      .map((line, i) => {
        const x = CX - 48 + line.indent
        return (
          `<line x1="${x}" y1="${lineY(i)}" x2="${x + 10}" y2="${lineY(i)}" stroke="#8E8EA6" stroke-width="5" stroke-linecap="round"/>` +
          `<line x1="${x + 16}" y1="${lineY(i)}" x2="${x + line.length}" y2="${lineY(i)}" stroke="${line.color}" stroke-width="5" stroke-linecap="round"/>`
        )
      })
      .join('')
  const thePage = fadeGroup(pop(`<g transform="translate(${-CX} ${-(top + 46)})">${page}</g>`, CX, top + 46, 0, -3, 0.4), 0, 2.6)

  const path: [number, number][] = [
    [CX - 44, top + 14],
    [CX + 30, top + 24],
    [CX - 36, top + 44],
    [CX + 28, top + 62],
    [CX - 24, top + 80],
    [CX + 34, top + 46],
  ]
  const ease: Spline = [0.4, 0, 0.6, 1]
  const sweep = { begin: 0.3, dur: 1.35, keyTimes: [0, 0.2, 0.42, 0.62, 0.8, 1], splines: [ease, ease, ease, ease, [0.5, 0, 1, 1] as Spline] }

  // A giant eye in the glass looks the way the glass is heading, darting at each turn, then blinks.
  const darting = sweep.dur + 0.25
  const looks = path.slice(1).flatMap(([x, y], k): [number, string][] => {
    const [fromX, fromY] = path[k] ?? [x, y]
    const look = `${Math.sign(x - fromX) * LOOK_X} ${Math.sign(y - fromY) * LOOK_Y}`
    const [t0, t1] = [(sweep.keyTimes[k] ?? 0) * sweep.dur + 0.06, (sweep.keyTimes[k + 1] ?? 1) * sweep.dur]
    return [
      [t0 / darting, look],
      [t1 / darting, look],
    ]
  })
  const blink = sweep.begin + sweep.dur + 0.05
  const eye =
    `<g class="eye">${animateTransform('scale', ['1 1', '1 0.08', '1 1'], { dur: 0.2, begin: blink })}` +
    `<circle r="${EYE_R}" fill="#FFFFFF"/>` +
    `<g class="iris">${animateTransform('translate', ['0 0', ...looks.map(([, look]) => look), '0 0'], {
      dur: darting,
      begin: sweep.begin,
      keyTimes: [0, ...looks.map(([t]) => Math.round(t * 1000) / 1000), 1],
    })}` +
    `<circle r="${IRIS_R}" fill="#4D96FF" stroke="${INK}" stroke-width="2"/><circle r="5.5" fill="${INK}"/>` +
    `<circle cx="-3.5" cy="-3.5" r="2.2" fill="#FFFFFF"/></g></g>`
  const lens =
    `<line x1="19" y1="19" x2="40" y2="40" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` +
    `<line x1="21" y1="21" x2="38" y2="38" stroke="#B07438" stroke-width="5" stroke-linecap="round"/>` +
    eye +
    `<circle r="26" fill="none" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M-15,-8 A17,17 0 0 1 -5,-17" fill="none" stroke="#BFE3FF" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`

  // Its motion is offsets from its group's translate, so the start counts once.
  const [startX, startY] = path[0] ?? [CX, top]
  const theLens =
    `<g class="lens" transform="translate(${startX} ${startY})">` +
    `<animateMotion values="${path.map(([x, y]) => `${x - startX},${y - startY}`).join(';')}" dur="${sweep.dur}s" begin="${sweep.begin}s" ` +
    `fill="freeze" keyTimes="${sweep.keyTimes.join(';')}" calcMode="spline" ` +
    `keySplines="${sweep.splines.map(s => s.join(' ')).join(';')}"/><g transform="scale(0)">` +
    animateTransform('scale', ['0', '1.2', '1', '1', '1.15', '0'], { dur: 2, begin: 0.15, keyTimes: [0, 0.08, 0.13, 0.88, 0.93, 1] }) +
    `${lens}</g></g>`

  // When the glass's centre first reaches height `y`, read along its eased path.
  const reaches = (y: number) => {
    for (let k = 1; k < path.length; k++) {
      const [, from] = path[k - 1] ?? [0, y]
      const [, to] = path[k] ?? [0, y]
      const [t0, t1] = [sweep.keyTimes[k - 1] ?? 0, sweep.keyTimes[k] ?? 1]
      if (from !== to && (y - from) * (y - to) <= 0) {
        return sweep.begin + sweep.dur * (t0 + (t1 - t0) * timeFor(sweep.splines[k - 1] ?? ease, (y - from) / (to - from)))
      }
    }
    return sweep.begin + sweep.dur
  }

  // A "!" after each flagged line as the glass reaches it; these lines end too far apart to touch.
  const flagged = [1, 4, 2, 0]
  const marks =
    findings > 0
      ? flagged
          .slice(0, Math.min(findings, flagged.length))
          .map(line => {
            const { indent, length } = lines[line] ?? { indent: 0, length: 0 }
            const begin = reaches(lineY(line)) + 0.05
            return fadeGroup(
              pop(
                `<circle r="8" fill="#FF5E5B" stroke="${INK}" stroke-width="2.5"/>` +
                  `<text y="4.5" text-anchor="middle" ${FONT} font-size="13" font-weight="900" fill="#FFFFFF">!</text>`,
                CX - 48 + indent + length + 14,
                lineY(line),
                begin,
                0,
                0.5,
                'mark',
              ),
              begin,
              2.55 - begin,
            )
          })
          .join('')
      : fadeGroup(
          pop(
            `<circle r="17" fill="#2FBF71" stroke="#155E37" stroke-width="3"/>` +
              `<path d="M-8,0 L-2,6 L9,-6" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
            CX + 44,
            top + 78,
            1.3,
            -8,
          ),
          1.3,
          1.4,
        )
  const twinkles = Array.from({ length: 5 }, (_, i) =>
    sparkle(CX - 80 + i * 40 + rnd() * 10, top - 10 + rnd() * 16, 5 + rnd() * 4, i % 2 ? '#4D96FF' : '#FFD23F', 1.3 + rnd() * 0.3),
  ).join('')

  // The marks are drawn over the glass, whose eye would hide them as they pop.
  return thePage + theLens + marks + twinkles + label(title, subtitle, { y: 145, fill: '#6FB6FF', begin: 1.3, dur: 1.4, size: 26, rotate: -4 })
}

// ---- fixes: a bug walks in and gets swatted -------------------------------

const BUG = '#6E4BD8'
const GROUND = 116

// A cartoon beetle facing right, its feet at (0, 0); its eyes come apart so
// they can be swapped for crosses.
function beetle(): { body: string; eyesOpen: string; eyesCrossed: string } {
  const legs = [-13, -1, 11].map(x => `<path d="M${x},-7 L${x - 5},0" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`).join('')
  return {
    body:
      legs +
      `<path d="M25,-25 q5,-9 11,-10 M21,-26 q1,-11 6,-15" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` +
      `<ellipse cx="0" cy="-17" rx="22" ry="14" fill="${BUG}" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M-5,-30 Q-1,-17 -5,-4" fill="none" stroke="${INK}" stroke-width="2"/>` +
      `<ellipse cx="-10" cy="-23" rx="7" ry="3.5" fill="#9C82F0"/>` +
      `<circle cx="22" cy="-18" r="9" fill="${BUG}" stroke="${INK}" stroke-width="3"/>`,
    eyesOpen: `<circle cx="25" cy="-20" r="3.5" fill="#FFFFFF" stroke="${INK}" stroke-width="1.5"/>` + `<circle cx="26" cy="-20" r="1.6" fill="${INK}"/>`,
    eyesCrossed: `<path d="M22,-23 l6,6 M28,-23 l-6,6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  }
}

function swat(rnd: () => number, title: string, subtitle: string): string {
  // The bug scurries in; the swatter lands at 0.72 s; the bug is flat after.
  const bug = beetle()
  const run = { dur: 1.4, keyTimes: [0, 0.51, 0.52, 1] }
  const theBug =
    `<g transform="translate(${CX} ${GROUND})" opacity="0">` +
    animate('opacity', [1, 1, 1, 0], { dur: 2.5, keyTimes: [0, 0.2, 0.85, 1] }) +
    `<g transform="translate(-140 0)">` +
    animateTransform('translate', ['-140 0', '-104 -3', '-72 0', '-42 -3', '-14 0', '0 0', '0 0'], {
      dur: 1.4,
      keyTimes: [0, 0.1, 0.2, 0.3, 0.4, 0.46, 1],
    }) +
    `<g>${animateTransform('scale', ['1 1', '1 1', '1.5 0.28', '1.45 0.3'], run)}${bug.body}` +
    `<g>${animate('opacity', [1, 1, 0, 0], run)}${bug.eyesOpen}</g>` +
    `<g opacity="0">${animate('opacity', [0, 0, 1, 1], run)}${bug.eyesCrossed}</g></g></g></g>`

  const mesh =
    [-20, -8, 4, 16].map(x => `<line x1="${x}" y1="-46" x2="${x}" y2="-4" stroke="#FFB3B1" stroke-width="2"/>`).join('') +
    [-38, -26, -14].map(y => `<line x1="-28" y1="${y}" x2="28" y2="${y}" stroke="#FFB3B1" stroke-width="2"/>`).join('')
  const swatter =
    `<g transform="rotate(12)">` +
    `<rect x="-4" y="-160" width="8" height="114" rx="3" fill="#B07438" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="-32" y="-50" width="64" height="50" rx="10" fill="#FF5E5B" stroke="${INK}" stroke-width="3"/>` +
    `${mesh}<rect x="-32" y="-50" width="64" height="50" rx="10" fill="none" stroke="${INK}" stroke-width="3"/></g>`
  const theSwatter =
    `<g transform="translate(${CX + 4} ${GROUND})"><g transform="translate(0 -240)">` +
    animateTransform('translate', ['0 -240', '0 -240', '0 0', '0 0', '0 -40', '0 -260'], {
      dur: 1.6,
      keyTimes: [0, 0.38, 0.45, 0.6, 0.72, 1],
      splines: '0 0 1 1;0.55 0 1 1;0 0 1 1;0.2 0 0.6 1;0.5 0 1 1',
    }) +
    `${swatter}</g></g>`

  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 32 : 15
    const a = (i / 10) * Math.PI * 2
    return `${n(Math.cos(a) * r)},${n(Math.sin(a) * r)}`
  }).join(' ')
  const splat =
    `<g transform="translate(${CX} ${GROUND - 4})"><g transform="scale(0)">` +
    animateTransform('scale', ['0', '1.25', '1'], { dur: 0.25, begin: 0.72 }) +
    `<g transform="scale(1 0.55)"><polygon points="${star}" fill="#B5E655" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></g></g></g>`

  // Dizzy stars circling the flattened bug.
  const dizzy = [0, 1, 2]
    .map(i => {
      const begin = 0.95 + i * 0.27
      return (
        `<g transform="translate(${CX} ${GROUND - 22})" opacity="0">` +
        animate('opacity', [1, 1, 0], { dur: 1.5 - i * 0.27, begin, keyTimes: [0, 0.75, 1] }) +
        `<g><animateMotion path="M-20,0 a20,6 0 1,0 40,0 a20,6 0 1,0 -40,0" dur="0.8s" begin="${n(begin)}s" repeatCount="indefinite"/>` +
        `<path d="M0,-5 L1.5,-1.5 L5,0 L1.5,1.5 L0,5 L-1.5,1.5 L-5,0 L-1.5,-1.5 Z" fill="#FFD23F" stroke="${INK}" stroke-width="1"/></g></g>`
      )
    })
    .join('')

  return (
    fadeGroup(splat, 0.72, 1.8) +
    theBug +
    rays(rnd, { cx: CX, cy: GROUND - 14, count: 10, from: [34, 42], to: [58, 72], flat: 0.5, begin: 0.72 }) +
    cloud(rnd, { cx: CX - 46, cy: GROUND, count: 4, spread: [5, 10], radius: [6, 10], begin: 0.72, dur: 0.6 }) +
    cloud(rnd, { cx: CX + 46, cy: GROUND, count: 4, spread: [5, 10], radius: [6, 10], begin: 0.72, dur: 0.6 }) +
    theSwatter +
    dizzy +
    label(title, subtitle, { y: 148, fill: '#7BE04A', begin: 0.85, dur: 1.8, size: 26, rotate: -4 })
  )
}

// ---- plan: a film clapperboard snaps shut ---------------------------------

function clapper(rnd: () => number, title: string, subtitle: string): string {
  const cy = 84
  const bar = (y: number, id: string) =>
    `<clipPath id="${id}"><rect x="-56" y="${y}" width="112" height="14" rx="2"/></clipPath>` +
    `<rect x="-56" y="${y}" width="112" height="14" rx="2" fill="#2B2B33"/>` +
    `<g clip-path="url(#${id})">` +
    Array.from({ length: 8 }, (_, i) => {
      const x = -56 + i * 17
      return `<path d="M${x},${y} L${x + 9},${y} L${x + 3},${y + 14} L${x - 6},${y + 14} Z" fill="#FFFFFF"/>`
    }).join('') +
    `</g><rect x="-56" y="${y}" width="112" height="14" rx="2" fill="none" stroke="${INK}" stroke-width="3"/>`
  const board =
    `<rect x="-56" y="-26" width="112" height="70" rx="6" fill="#2B2B33" stroke="${INK}" stroke-width="4"/>` +
    bar(-40, 'base') +
    `<line x1="-44" y1="13" x2="44" y2="13" stroke="#5A5A66" stroke-width="2"/>` +
    `<text y="5" text-anchor="middle" ${FONT} font-size="24" font-weight="900" letter-spacing="2" fill="#FFFFFF">PLAN</text>` +
    `<text y="32" text-anchor="middle" ${FONT} font-size="12" font-weight="800" letter-spacing="2" fill="#FFD23F">APPROVED</text>`
  // The arm waits open on its hinge, then claps down and bounces.
  const snap = { dur: 1, keyTimes: [0, 0.45, 0.55, 0.63, 0.72, 1] }
  const arm =
    `<g transform="rotate(-24 -56 -41)">` +
    animateTransform(
      'rotate',
      ['-24', '-24', '3', '-2', '0', '0'].map(a => `${a} -56 -41`),
      snap,
    ) +
    bar(-56, 'arm') +
    `</g>`
  const shake = animateTransform('translate', ['0 0', '0 0', '0 4', '0 -2', '0 0', '0 0'], {
    dur: 1,
    keyTimes: [0, 0.54, 0.6, 0.67, 0.75, 1],
  })
  // Where the arm's tip meets the board, the board tilted -6°.
  const [clapX, clapY] = [CX + 51, cy - 47]
  const twinkles = ['#FFD23F', '#7BE04A', '#3BCEAC', '#FF9F1C']
  const sparkles = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.4
    const r = 70 + rnd() * 20
    return sparkle(CX + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 0.75, 6 + rnd() * 5, twinkles[i % twinkles.length] ?? INK, 0.6 + rnd() * 0.3)
  }).join('')

  return (
    fadeGroup(pop(`<g>${shake}${board}${arm}</g>`, CX, cy, 0, -6, 0.4), 0, 2.4) +
    rays(rnd, { cx: clapX, cy: clapY, count: 8, from: [10, 16], to: [28, 40], flat: 1, begin: 0.55 }) +
    cloud(rnd, { cx: clapX, cy: clapY, count: 4, spread: [4, 9], radius: [5, 8], begin: 0.55, dur: 0.6, fill: '#FFFFFF', edge: '#B9B9C6' }) +
    sparkles +
    label(title, subtitle, { y: 148, fill: '#FF9F1C', begin: 0.6, dur: 1.9, size: 26, rotate: -4 })
  )
}

// ---- context: a suitcase packed too full ------------------------------------

const CASE_TOP = 80
const CASE_BOTTOM = 124
// The lid's hinge, at the case's back edge.
const HINGE = `${CX - 60} ${CASE_TOP + 2}`
// The red one's lid bursts open a crack at these times, a sock springing out.
const BURSTS = [1.3, 1.75]

const sock = (color: string) =>
  `<path d="M-6,-14 L6,-14 L6,4 L14,4 Q18,4 18,10 L18,12 L-6,12Z" fill="${color}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`
// What drops in, in order: three things in the yellow, all five in the red.
const LOAD: [number, string][] = [
  [CX - 30, sock('#FF70A6')],
  [
    CX + 10,
    `<path d="M-14,-12 L-6,-16 Q0,-12 6,-16 L14,-12 L18,-4 L11,-1 L11,14 L-11,14 L-11,-1 L-18,-4Z" fill="#4D96FF" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
  ],
  [
    CX - 8,
    `<rect x="-14" y="-9" width="28" height="18" rx="2" fill="#7BE04A" stroke="${INK}" stroke-width="2.5"/><line x1="-14" y1="5" x2="14" y2="5" stroke="#FFFFFF" stroke-width="2"/>`,
  ],
  [
    CX + 32,
    `<circle cy="2" r="10" fill="#FFD23F" stroke="${INK}" stroke-width="2.5"/><circle cx="7" cy="-8" r="6" fill="#FFD23F" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M12,-9 L18,-7 L12,-5Z" fill="#FF9F1C" stroke="${INK}" stroke-width="1.5"/><circle cx="8" cy="-9" r="1.2" fill="${INK}"/>`,
  ],
  [CX - 40, sock('#B76EF0')],
]

function suitcase(rnd: () => number, title: string, subtitle: string, isRed: boolean): string {
  const end = isRed ? 3.1 : 2.9
  const count = isRed ? 5 : 3
  // Each thing drops onto the pile a beat after the last, and the slamming lid pushes the pile in.
  const shut = 0.25 + count * 0.15
  const fall = LOAD.slice(0, count)
    .map(([x, thing], i) => {
      const t = { dur: 0.4, begin: 0.1 + i * 0.15, keyTimes: [0, 0.7, 0.85, 1] }
      const pile = [`${x} -40`, `${x} ${CASE_TOP - 10}`, `${x} ${CASE_TOP - 16}`, `${x} ${CASE_TOP - 10}`]
      return (
        `<g class="load" transform="translate(${x} -40)">${animateTransform('translate', pile, t)}` +
        `<g>${animateTransform('translate', ['0 0', '0 18'], { dur: 0.05, begin: shut + 0.03 })}${thing}</g></g>`
      )
    })
    .join('')
  const turn = 2.4
  const at = (times: number[]) => times.map(t => Math.round((t / turn) * 1000) / 1000)
  const slam = { angles: ['-100', '-100', '8', '-4', '0', '0'], times: [0, shut, shut + 0.07, shut + 0.12, shut + 0.17, turn] }
  const lidMoves = isRed
    ? {
        angles: [...slam.angles.slice(0, -1), ...BURSTS.flatMap(() => ['0', '-24', '0']), '0'],
        times: [...slam.times.slice(0, -1), ...BURSTS.flatMap(t => [t, t + 0.08, t + 0.18]), turn],
      }
    : slam
  const lid =
    `<g>${animateTransform(
      'rotate',
      lidMoves.angles.map(a => `${a} ${HINGE}`),
      { dur: turn, keyTimes: at(lidMoves.times) },
    )}` +
    `<rect x="${CX - 62}" y="${CASE_TOP - 14}" width="124" height="18" rx="7" fill="#FFB347" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M${CX - 14},${CASE_TOP - 14} Q${CX},${CASE_TOP - 30} ${CX + 14},${CASE_TOP - 14}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>`
  const height = CASE_BOTTOM - CASE_TOP
  const body =
    `<rect x="${CX - 62}" y="${CASE_TOP}" width="124" height="${height}" rx="8" fill="#FF9F1C" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="${CX - 36}" y="${CASE_TOP}" width="10" height="${height}" fill="#E07B00"/>` +
    `<rect x="${CX + 26}" y="${CASE_TOP}" width="10" height="${height}" fill="#E07B00"/>` +
    `<rect x="${CX - 62}" y="${CASE_TOP}" width="124" height="${height}" rx="8" fill="none" stroke="${INK}" stroke-width="3"/>` +
    [CX - 37, CX + 25].map(x => `<rect x="${x}" y="${CASE_TOP - 3}" width="12" height="8" rx="2" fill="#C9CCD6" stroke="${INK}" stroke-width="2"/>`).join('')
  // A sleeve caught in the seam once the lid is shut.
  const sleeve =
    `<g transform="translate(${CX + 60} ${CASE_TOP - 1})" opacity="0">${animate('opacity', [0, 1], { dur: 0.05, begin: shut + 0.1 })}` +
    `<g>${animateTransform('rotate', ['0', '14', '-8', '12', '0'], { dur: 0.8, begin: shut + 0.2, repeat: isRed })}` +
    `<rect x="0" y="-5" width="22" height="10" rx="4" fill="#4D96FF" stroke="${INK}" stroke-width="2"/>` +
    `<line x1="16" y1="-4" x2="16" y2="4" stroke="#FFFFFF" stroke-width="2"/></g></g>`
  const spring = isRed
    ? `<g transform="translate(${CX + 20} ${CASE_TOP + 16})"><g>${animateTransform(
        'translate',
        ['0 0', ...BURSTS.flatMap(() => ['0 0', '0 -44', '0 0']), '0 0'],
        {
          dur: turn,
          keyTimes: at([0, ...BURSTS.flatMap(t => [t, t + 0.08, t + 0.2]), turn]),
        },
      )}${sock('#FF70A6')}</g></g>`
    : ''
  // It squashes as the lid slams, and stays bulging; the red one rattles on.
  const squash = animateTransform('scale', ['1 1', '1 1', '1.12 0.84', '0.96 1.08', '1.05 1.04'], {
    dur: shut + 0.5,
    keyTimes: [0, shut, shut + 0.1, shut + 0.25, shut + 0.5].map(t => Math.round((t / (shut + 0.5)) * 1000) / 1000),
  })
  const rattle = isRed ? animateTransform('rotate', ['0', '-3', '3', '-2', '2', '0'], { dur: 0.3, begin: shut + 0.3, repeat: true }) : ''
  const theCase =
    `<g class="suitcase" transform="translate(${CX} ${CASE_BOTTOM})"><g>${rattle}<g>${squash}` +
    `<g transform="translate(${-CX} ${-CASE_BOTTOM})">${fall}${spring}${body}${sleeve}${lid}</g></g></g></g>`

  const steam = isRed
    ? BURSTS.map(begin =>
        cloud(rnd, { cx: CX + 40, cy: CASE_TOP - 6, count: 4, spread: [5, 10], radius: [6, 10], begin, dur: 0.7, fill: SMOKE, edge: SMOKE_EDGE }),
      ).join('')
    : ''
  const zone = isRed ? '#FF5E5B' : '#FFD23F'
  const signs = isRed
    ? sign(zone, '#FFFFFF', 316, 40, shut + 0.2, end) + sign(zone, '#FFFFFF', 124, 40, shut + 0.3, end)
    : sign(zone, INK, 316, 44, shut + 0.2, end)
  const drop = isRed ? sweat(CX + 66, CASE_TOP + 6, 20, -10, 1.2) : sweat(CX + 64, CASE_TOP + 4, 6, 20, shut + 0.4)

  return (
    fadeGroup(theCase, 0, end, 0.85) +
    [-1, 1]
      .map(side => cloud(rnd, { cx: CX + side * 66, cy: CASE_BOTTOM - 6, count: 4, spread: [6, 12], radius: [7, 11], begin: shut + 0.06, dur: 0.6 }))
      .join('') +
    steam +
    drop +
    signs +
    label(title, subtitle, { y: 147, fill: zone, begin: shut + 0.3, dur: isRed ? 2 : 1.8, size: 26, rotate: -3 })
  )
}

// ---- cherry: a gloved hand plucks a pair of cherries -----------------------

const LEAF = 'M0,0 C8,-12 26,-12 32,-2 C22,6 8,6 0,0Z'
const leaf = (x: number, y: number, rotate: number, scale = 1) =>
  `<path transform="translate(${x} ${y}) rotate(${rotate})${scale === 1 ? '' : ` scale(${scale})`}" d="${LEAF}" fill="#7BE04A" ` +
  `stroke="${INK}" stroke-width="${n(2.5 / scale)}" stroke-linejoin="round"/>`

// Where the cherries hang from the branch, and how far the hand pulls them.
const STEM_X = 220
const STEM_Y = 31
const PULL = 19

function cherry(rnd: () => number, title: string, subtitle: string): string {
  // Comes in, grabs, pulls the branch down, snaps the stems, lifts the pair away.
  const hand = { dur: 1.3, keyTimes: [0, 0.32, 0.42, 0.58, 0.62, 0.73, 0.83, 1] }
  const handSplines = '0.2 0.8 0.4 1;0 0 1 1;0.5 0 0.5 1;0 0 1 1;0.2 0.8 0.4 1;0.4 0 0.6 1;0 0 1 1'
  const lift: [number, number][] = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, PULL],
    [0, PULL],
    [40, -6],
    [40, -14],
    [40, -14],
  ]
  // The branch bends with the pull, then springs back past straight and settles.
  const bend = { dur: 1.3, keyTimes: [0, 0.32, 0.42, 0.58, 0.62, 0.66, 0.73, 0.8, 1] }
  const sags = [34, 34, 34, 72, 72, 4, 44, 28, 34]
  const branch =
    `<path d="M80,30 Q${STEM_X},34 360,26" fill="none" stroke="#7A4A22" stroke-width="7" stroke-linecap="round">` +
    animate(
      'd',
      sags.map(c => `M80,30 Q${STEM_X},${c} 360,26`),
      bend,
    ) +
    `</path>`
  const leaves = `<g>${animateTransform(
    'translate',
    sags.map(c => `0 ${n((c - 34) * 0.4)}`),
    bend,
  )}${leaf(160, 31, -155)}${leaf(290, 29, -25)}</g>`

  const stem = (d: string) => `<path d="${d}" fill="none" stroke="#4E7A1E" stroke-width="3.5" stroke-linecap="round"/>`
  const berry = (x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="13" fill="#E5484D" stroke="${INK}" stroke-width="3"/>` +
    `<ellipse cx="${x - 5}" cy="${y - 5}" rx="3.5" ry="2.5" fill="#FFFFFF"/>`
  const cherries =
    `<g class="cherries">${animateTransform(
      'translate',
      lift.map(([dx, dy]) => `${dx} ${dy}`),
      { ...hand, splines: handSplines },
    )}` +
    stem(`M${STEM_X},${STEM_Y} Q214,52 204,80`) +
    stem(`M${STEM_X},${STEM_Y} Q228,56 237,84`) +
    leaf(STEM_X + 1, STEM_Y + 1, -35, 0.75) +
    berry(204, 92) +
    berry(237, 96) +
    `</g>`

  // A white cartoon glove pointing left, its pinch at (0, 0), its sleeve running off the right.
  const glove =
    `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">` +
    `<rect x="40" y="-9" width="90" height="18" fill="#4D96FF"/>` +
    `<rect x="-8" y="-11" width="30" height="9" rx="4.5" fill="#FFFFFF"/>` +
    `<rect x="-6" y="-2" width="28" height="9" rx="4.5" fill="#FFFFFF"/>` +
    `<rect x="-2" y="6" width="20" height="8" rx="4" fill="#FFFFFF"/>` +
    `<ellipse cx="20" cy="0" rx="15" ry="13" fill="#FFFFFF"/>` +
    `<rect x="30" y="-13" width="12" height="26" rx="4" fill="#FFFFFF"/></g>`
  const pinchY = STEM_Y + 9
  // The hand moves with the cherries, but comes in from off the right.
  const handAt = lift.map(([dx, dy], i) => (i === 0 ? `380 ${pinchY}` : `${STEM_X + dx} ${pinchY + dy}`))
  const theHand = `<g transform="translate(380 ${pinchY})">${animateTransform('translate', handAt, { ...hand, splines: handSplines })}${glove}</g>`

  const snap = 0.8
  const twinkles = ['#FFD23F', '#FF70A6', '#7BE04A']
  const sparkles = [
    [300, 66],
    [214, 112],
    [318, 112],
    [236, 46],
  ]
    .map(([x = 0, y = 0], i) => sparkle(x, y, 6 + rnd() * 5, twinkles[i % twinkles.length] ?? INK, 0.95 + i * 0.08))
    .join('')

  return (
    fadeGroup(branch + leaves + cherries + theHand, 0, 2.4, 0.85) +
    rays(rnd, { cx: STEM_X, cy: STEM_Y, count: 8, from: [8, 14], to: [20, 30], flat: 1, begin: snap }) +
    sparkles +
    label(title, subtitle, { y: 150, fill: '#FF5E5B', begin: 1, dur: 1.5, size: 26, rotate: -6 })
  )
}

// ---- merge: a zipper closes two strands into one ---------------------------

// Where the slider starts and lands, on the line the strands close into.
const ZIP_FROM = 110
const ZIP_TO = 300
const ZIP_Y = 95

function zipper(rnd: () => number, title: string, subtitle: string): string {
  const run = { dur: 1.4, keyTimes: [0, 0.21, 0.86, 1], splines: '0 0 1 1;0.45 0 0.55 1;0 0 1 1' }
  const at = [ZIP_FROM, ZIP_FROM, ZIP_TO, ZIP_TO]
  // A strand of teeth: its dashes are the teeth, and the other strand's sit in its gaps.
  const strand = (color: string, d: (s: number) => string, offset = 0) =>
    `<path d="${d(ZIP_FROM)}" fill="none" stroke="${color}" stroke-width="9" stroke-dasharray="5 3"` +
    `${offset ? ` stroke-dashoffset="${offset}"` : ''}>${animate('d', at.map(d), run)}</path>`
  const closed = (y: number) => (s: number) => `M80,${y} L${s},${y}`
  const open = (y: number, far: number) => (s: number) => `M${s},${y} C${s + 25},${y} ${s + 35},${far} ${s + 65},${far} L430,${far}`
  const strands =
    strand('#4D96FF', closed(ZIP_Y - 3)) +
    strand('#B76EF0', closed(ZIP_Y + 3), 4) +
    strand('#4D96FF', open(ZIP_Y - 3, 62)) +
    strand('#B76EF0', open(ZIP_Y + 3, 128))

  // The slider's wide end faces the open strands; its pull tab tilts up behind it.
  const body =
    `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">` +
    `<path d="M-13,-9 L11,-15 L11,15 L-13,9Z" fill="#C9CCD6"/>` +
    `<g transform="rotate(-35)"><rect x="12" y="-5" width="26" height="10" rx="5" fill="#9AA0AE"/>` +
    `<circle cx="31" cy="0" r="2" fill="${INK}" stroke="none"/></g></g>`
  const slider =
    `<g class="slider" transform="translate(${ZIP_FROM} ${ZIP_Y})">` +
    animateTransform(
      'translate',
      at.map(x => `${x} ${ZIP_Y}`),
      run,
    ) +
    `<g transform="scale(0)">` +
    animateTransform('scale', ['0.2', String(PEAK), '0.9', '1', '1', '1.25', '1', '1'], {
      dur: 1.4,
      keyTimes: [0, 0.1, 0.17, 0.22, 0.86, 0.89, 0.95, 1],
    }) +
    `${body}</g></g>`

  const landed = 1.2
  const twinkles = ['#7BE04A', '#FFD23F', '#3BCEAC']
  const sparkles = [
    [160, 50],
    [262, 44],
    [120, 132],
  ]
    .map(([x = 0, y = 0], i) => sparkle(x, y, 6 + rnd() * 5, twinkles[i % twinkles.length] ?? INK, landed + 0.05 + i * 0.09))
    .join('')

  return (
    fadeGroup(strands + slider, 0, 2.6, 0.85) +
    rays(rnd, { cx: ZIP_TO, cy: ZIP_Y, count: 8, from: [16, 22], to: [30, 42], flat: 1, begin: landed }) +
    sparkles +
    label(title, subtitle, { y: 150, fill: '#3BCEAC', begin: landed + 0.05, dur: 1.4, size: 30, rotate: -6 })
  )
}

// ---- pr: a jack-in-the-box springs out -------------------------------------

// The box's mouth, where the lid hinges and the spring rises from.
const BOX_X = 184
const BOX_TOP = 74
const BOX_FLOOR = 122
// Where the jack's head lands, and how far below it starts, hidden in the box.
const HEAD_Y = 46
const HEAD_R = 16
const RISE = { dur: 0.55, begin: 0.62, keyTimes: [0, 0.35, 0.6, 0.8, 1] }
const RISEN = [60, -6, 5, -2, 0]

function jack(rnd: () => number, title: string, subtitle: string): string {
  // The spring zigzags from the head's chin to the box floor, flat there while hidden.
  const spring = (drop: number) => {
    const top = HEAD_Y + HEAD_R + drop
    const at = (k: number) => n(top + ((BOX_FLOOR - top) * k) / 8)
    const zigs = [1, 2, 3, 4, 5, 6, 7].map(k => `L${k % 2 ? CX - 10 : CX + 10},${at(k)}`).join(' ')
    return `M${CX},${n(top)} ${zigs} L${CX},${BOX_FLOOR}`
  }
  const coil =
    `<path d="${spring(RISEN[0] ?? 0)}" fill="none" stroke="#9AA0AE" stroke-width="3.5" stroke-linejoin="round">` +
    `${animate('d', RISEN.map(spring), RISE)}</path>`
  const face =
    `<circle r="${HEAD_R}" fill="#FFD23F" stroke="${INK}" stroke-width="3"/>` +
    `<circle cx="-9" cy="4" r="3" fill="#FF70A6"/><circle cx="9" cy="4" r="3" fill="#FF70A6"/>` +
    `<ellipse cx="-5" cy="-3" rx="2" ry="3" fill="#2B1A12"/><ellipse cx="5" cy="-3" rx="2" ry="3" fill="#2B1A12"/>` +
    `<path d="M-6,4 Q0,11 6,4" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="M-9,-13 L0,-32 L9,-13Z" fill="#B76EF0" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<circle cy="-32" r="3.5" fill="#FF70A6" stroke="${INK}" stroke-width="2"/>`
  const head =
    `<g class="jack" transform="translate(0 ${RISEN[0]})">` +
    animateTransform(
      'translate',
      RISEN.map(dy => `0 ${dy}`),
      RISE,
    ) +
    `<g transform="translate(${CX} ${HEAD_Y})">${face}</g></g>`
  // Once up, the jack wobbles on its spring.
  const pivot = `${CX} ${BOX_TOP}`
  const wobble = animateTransform(
    'rotate',
    [0, 10, -8, 5, 0].map(a => `${a} ${pivot}`),
    { dur: 0.9, begin: 1.2 },
  )
  const theJack = `<g>${wobble}${coil}${head}</g>`

  const star = 'M0,-12 L2.9,-4 L11.4,-3.7 L4.8,1.5 L7.1,9.7 L0,5 L-7.1,9.7 L-4.8,1.5 L-11.4,-3.7 L-2.9,-4Z'
  const crankY = 99
  const crank =
    rod(BOX_X + 72, crankY, BOX_X + 82, crankY) +
    `<g transform="translate(${BOX_X + 82} ${crankY})"><g>${animateTransform('rotate', ['0', '720'], { dur: 0.55 })}` +
    `${rod(0, 0, 0, -11)}<circle cy="-11" r="3.5" fill="#4D96FF" stroke="${INK}" stroke-width="2"/></g></g>`
  // The lid flies over and flops open against the box's left side.
  const lid =
    `<g transform="translate(${BOX_X - 2} ${BOX_TOP})"><g>` +
    animateTransform('rotate', ['0', '-200', '-165', '-185', '-180'], { dur: 0.55, begin: 0.6, keyTimes: [0, 0.45, 0.7, 0.85, 1] }) +
    `<rect x="0" y="-8" width="76" height="8" rx="2" fill="#4D96FF" stroke="${INK}" stroke-width="3"/></g></g>`
  // The box shakes as the crank turns, just before the lid flies open.
  const box =
    `<g>${animateTransform('translate', ['0 0', '-2 0', '2 0', '-2 0', '2 0', '0 0'], { dur: 0.25, begin: 0.35 })}` +
    `<rect x="${BOX_X}" y="${BOX_TOP}" width="72" height="${BOX_FLOOR + 2 - BOX_TOP}" rx="3" fill="#FF5E5B" stroke="${INK}" stroke-width="3"/>` +
    `<path transform="translate(${CX} ${crankY})" d="${star}" fill="#FFD23F" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `${crank}${lid}</g>`

  const twinkles = ['#FF70A6', '#7BE04A', '#FFD23F', '#3BCEAC']
  const sparkles = [
    [150, 34],
    [292, 38],
    [304, 100],
    [136, 100],
  ]
    .map(([x = 0, y = 0], i) => sparkle(x, y, 6 + rnd() * 5, twinkles[i % twinkles.length] ?? INK, 0.95 + i * 0.08))
    .join('')

  return (
    fadeGroup(theJack + box, 0, 2.5, 0.85) +
    rays(rnd, { cx: CX, cy: BOX_TOP - 4, count: 8, from: [42, 50], to: [58, 70], flat: 0.55, begin: RISE.begin }) +
    sparkles +
    label(title, subtitle, { y: 150, fill: '#FF9F1C', begin: 1, dur: 1.5, size: 28, rotate: -6 })
  )
}

// ---- rebase: a claw moves the branch's blocks onto the tower ---------------

const BLOCK_W = 40
const BLOCK_H = 20
const GROUND_Y = 119
const OLD_X = 140
const TOWER_X = 232
// Where the claw carries the blocks: up clear of the tower, across, and down onto it.
const LIFT = -48
const LAND: [number, number] = [TOWER_X - OLD_X, -2 * BLOCK_H]

function claw(rnd: () => number, title: string, subtitle: string): string {
  const block = (x: number, top: number, fill: string, isCommit = true) =>
    `<rect x="${x}" y="${top}" width="${BLOCK_W}" height="${BLOCK_H}" rx="3" fill="${fill}" stroke="${INK}" stroke-width="3"/>` +
    (isCommit ? `<circle cx="${x + BLOCK_W / 2}" cy="${top + BLOCK_H / 2}" r="4" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>` : '')
  const level = (k: number) => GROUND_Y - 1 - BLOCK_H * (k + 1)
  const ground = rod(118, GROUND_Y, 322, GROUND_Y)
  const base = block(OLD_X, level(0), '#C9CCD6', false)
  const tower = [0, 1, 2].map(k => block(TOWER_X, level(k), '#4D96FF')).join('')

  // Grabbed, lifted, carried across, set down with a bump.
  const [landX, landY] = LAND
  const carried = ['0 0', '0 0', `0 ${LIFT}`, `${landX} ${LIFT}`, `${landX} ${landY}`, `${landX} ${landY + 3}`, `${landX} ${landY}`, `${landX} ${landY}`]
  const blocks =
    `<g class="blocks">` +
    animateTransform('translate', carried, {
      dur: 1.8,
      keyTimes: [0, 0.33, 0.47, 0.67, 0.75, 0.78, 0.81, 1],
      splines: '0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0.5 0 1 1;0.2 0 0.5 1;0.3 0 0.7 1;0 0 1 1',
    }) +
    `${block(OLD_X, level(1), '#B76EF0')}${block(OLD_X, level(2), '#B76EF0')}</g>`

  // The claw drops from above, grips, carries, lets go and rises out of frame.
  const gripY = level(2) - 6
  const reach = ['0 -80', '0 0', '0 0', `0 ${LIFT}`, `${landX} ${LIFT}`, `${landX} ${landY}`, `${landX} ${landY}`, `${landX} -120`]
  const arm = (side: 1 | -1) => {
    const d = `M${side * 8},0 L${side * 23},6 L${side * 23},24 L${side * 18},29`
    const open = `${side * 22} ${side * 8} 0`
    const shut = `0 ${side * 8} 0`
    return (
      `<g transform="rotate(${open})">` +
      animateTransform('rotate', [open, open, shut, shut, open, open], { dur: 1.8, keyTimes: [0, 0.27, 0.33, 0.78, 0.82, 1] }) +
      `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="#9AA0AE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></g>`
    )
  }
  const theClaw =
    `<g transform="translate(${OLD_X + BLOCK_W / 2} ${gripY})"><g class="claw" transform="translate(0 -80)">` +
    animateTransform('translate', reach, {
      dur: 1.8,
      keyTimes: [0, 0.25, 0.33, 0.47, 0.67, 0.75, 0.82, 1],
      splines: '0.3 0 0.5 1;0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0.5 0 1 1;0 0 1 1;0.5 0 0.8 1',
    }) +
    `${rod(0, -300, 0, -10)}${arm(-1)}${arm(1)}` +
    `<rect x="-12" y="-12" width="24" height="13" rx="3" fill="#FFD23F" stroke="${INK}" stroke-width="3"/></g></g>`

  const landed = 1.35
  const seam = level(2)
  const twinkles = ['#FF70A6', '#7BE04A', '#FFD23F']
  const sparkles = [
    [300, 26],
    [206, 18],
    [316, 70],
  ]
    .map(([x = 0, y = 0], i) => sparkle(x, y, 6 + rnd() * 5, twinkles[i % twinkles.length] ?? INK, landed + 0.1 + i * 0.08))
    .join('')

  return (
    fadeGroup(ground + base + tower + blocks + theClaw, 0, 2.85, 0.85) +
    // Six rays, none upright, start clear of the stack.
    rays(rnd, { cx: TOWER_X + BLOCK_W / 2, cy: seam, count: 6, from: [40, 46], to: [54, 66], flat: 0.35, begin: landed }) +
    sparkles +
    label(title, subtitle, { y: 150, fill: '#B76EF0', begin: 1.45, dur: 1.4, size: 30, rotate: -6 })
  )
}

// ---- the one entry point ---------------------------------------------------

type Draw = (rnd: () => number, title: string, subtitle: string, value: number) => string

// Every kind has its drawing; `value` is the helper count for `helpers` and the number
// of findings for `review`. The zones' percentage is in their words alone.
const DRAWINGS: Record<FxKind, Draw> = {
  push: rocket,
  commit: stamp,
  cherry,
  tests: clipboard,
  compact: squish,
  helpers,
  plan: clapper,
  fixes: swat,
  review,
  merge: zipper,
  rebase: claw,
  pr: jack,
  context: (rnd, title, subtitle) => suitcase(rnd, title, subtitle, false),
  redzone: (rnd, title, subtitle) => suitcase(rnd, title, subtitle, true),
}

// The width and height an effect is drawn at, in pixels.
export const pixelsOf = (size: Size) => [Math.round(VIEW_WIDTH * SCALES[size]), Math.round(HEIGHT * SCALES[size])] as const

export function drawFx(kind: FxKind, seed: number, title: string, subtitle = '', value = 0, size = DEFAULT_SIZE): string {
  const body = DRAWINGS[kind](random(seed), title, subtitle, value)
  const [width, height] = pixelsOf(size)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_X} 0 ${VIEW_WIDTH} ${HEIGHT}" width="${width}" height="${height}">${body}</svg>`
}

// ---- the terminal's row ----------------------------------------------------

// The terminal draws no SVG: the words between two rows of coloured glyphs.
const GLYPHS = ['✦', '•', '▪', '✶', '✧', '◆', '∗', '❋']
const TWINKLE = '✧'
export const SPARKS = 5

export type Spark = { glyph: string; color: string }

// One side's sparks at `frame`, nearest the words first. A new spark is born by
// the words each frame and the others step outward; a few twinkle.
function sparksAt(seed: number, frame: number, side: number): Spark[] {
  return Array.from({ length: SPARKS }, (_, at) => {
    const spark = random(seed + side * 7919 + (frame - at + SPARKS) * 104_729)
    const color = COLORS[Math.floor(spark() * COLORS.length)] ?? INK
    const glyph = GLYPHS[Math.floor(spark() * GLYPHS.length)] ?? TWINKLE
    const twinkles = random(seed + side * 31 + frame * 1009 + at * 131)() < 0.2

    return { glyph: twinkles ? TWINKLE : glyph, color }
  })
}

// The row's two sides at `frame`: the same seed and frame always draw the same sparks.
export function glyphRow(seed: number, frame: number): { left: Spark[]; right: Spark[] } {
  return { left: sparksAt(seed, frame, 0), right: sparksAt(seed, frame, 1) }
}
