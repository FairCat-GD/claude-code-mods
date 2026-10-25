// Cartoon effects drawn as animated SVG (SMIL, no script), one per moment the
// mod celebrates. The same seed always draws the same picture, so a redraw
// does not reshuffle it. Every effect fits the same 440 × 190 box.

import type { FxKind } from '../types'

export const WIDTH = 440
export const HEIGHT = 190
// What is shown of that box: its middle, where the action is. A piece that
// flies past the sides leaves the frame, as in a cartoon.
const VIEW_X = 90
const VIEW_WIDTH = 260
// Drawn this many times larger; a surface narrower than that shrinks it to fit.
export const SCALE = 3.2
const CX = WIDTH / 2
const CY = 118

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
}

export const COLORS = ['#FF5E5B', '#FFD23F', '#3BCEAC', '#4D96FF', '#B76EF0', '#FF9F1C', '#FF70A6', '#7BE04A']
const INK = '#3A2200'
const CLOUD = '#FFF6E8'
const CLOUD_EDGE = '#F4A261'
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

// Hidden until `begin`, shown, then faded out by the end of `dur`.
const fadeGroup = (content: string, begin: number, dur: number, holdUntil = 0.8) =>
  `<g opacity="0">${animate('opacity', [0, 1, 1, 0], { dur, begin, keyTimes: [0, 0.03, holdUntil, 1] })}${content}</g>`

// Springs `content` in from nothing at (x, y), around its own origin.
const pop = (content: string, x: number, y: number, begin: number, rotate = 0, dur = 0.5) =>
  `<g transform="translate(${n(x)} ${n(y)})${rotate ? ` rotate(${rotate})` : ''}"><g transform="scale(0)">` +
  animateTransform('scale', ['0.2', '1.28', '0.9', '1.05', '1'], { dur, begin, keyTimes: [0, 0.35, 0.6, 0.8, 1] }) +
  `${content}</g></g>`

// ---- shared pieces ---------------------------------------------------------

type LabelOptions = { y: number; fill: string; begin: number; dur: number; size?: number; rotate?: number }

// The word that pops out, tilted like a cartoon sound effect.
function label(title: string, subtitle: string, { y, fill, begin, dur, size = 30, rotate = -6 }: LabelOptions): string {
  const ink = `stroke="${INK}" stroke-linejoin="round" paint-order="stroke"`
  const sub = subtitle
    ? `<text y="${n(size * 0.8)}" text-anchor="middle" ${FONT} font-size="14" font-weight="800" fill="#FFFFFF" ` +
      `stroke-width="4" ${ink}>${escapeXml(subtitle)}</text>`
    : ''
  const text =
    `<text text-anchor="middle" dominant-baseline="middle" ${FONT} font-size="${size}" font-weight="900" ` +
    `fill="${fill}" stroke-width="6" ${ink}>${escapeXml(title)}</text>${sub}`

  return fadeGroup(pop(text, CX, y, begin, rotate), begin, dur)
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

// A puff of smoke: overlapping circles that swell and fade. Drawn twice, the
// edge layer under the fill layer, so only the cloud's outer rim is outlined.
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
        const t = { dur, begin: b.begin, keyTimes: [0, 0.25, 1] }
        return (
          `<circle cx="${n(cx)}" cy="${n(cy)}" r="0" fill="${color}">` +
          animate('cx', [cx, b.x, b.x + b.dx], t) +
          animate('cy', [cy, b.y, b.y + b.dy], t) +
          animate('r', [0, b.r + grow, b.r * 1.2 + grow], t) +
          animate('opacity', [1, 1, 0], { dur, begin: b.begin, keyTimes: [0, 0.45, 1] }) +
          `</circle>`
        )
      })
      .join('')

  return layer(edge, 2.5) + layer(fill, 0)
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

// ---- push: confetti --------------------------------------------------------

// One piece of confetti: bursts out, slows in the air, then flutters down.
function confettiPiece(rnd: () => number, color: string): string {
  const up = 260 + rnd() * 260
  const side = (rnd() * 2 - 1) * 540
  const drag = 2.6 + rnd() * 1.4
  const gravity = 430
  const dur = 1.7 + rnd() * 0.6
  const begin = 0.04 + rnd() * 0.1
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
    `<g transform="translate(${CX} ${CY})" opacity="0">` +
    `<animateMotion values="${path}" ${t}/>` +
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.03;0.72;1" ${t}/>` +
    `<g><animateTransform attributeName="transform" type="rotate" from="0" to="${n(spin)}" ${t}/>` +
    `<g>${animateTransform('scale', ['1 1', '1 0.2', '1 1'], { dur: flip, begin, repeat: true })}${shape}</g></g></g>`
  )
}

function confetti(rnd: () => number, title: string, subtitle: string): string {
  const pieces = Array.from({ length: 46 }, (_, i) => confettiPiece(rnd, COLORS[i % COLORS.length] ?? INK)).join('')
  return (
    rays(rnd, { cx: CX, cy: CY, count: 12, from: [20, 30], to: [70, 92], begin: 0.02 }) +
    pieces +
    cloud(rnd, { cx: CX, cy: CY, count: 9, spread: [16, 26], radius: [13, 22] }) +
    label(title, subtitle, { y: CY - 4, fill: '#FFD23F', begin: 0.1, dur: 2.2 })
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

  const inkText = `${FONT} font-size="34" font-weight="900" letter-spacing="3" fill="${STAMP_INK}"`
  const sub = subtitle
    ? `<text y="50" text-anchor="middle" ${FONT} font-size="14" font-weight="800" fill="#FFFFFF" stroke="${INK}" ` +
      `stroke-width="4" stroke-linejoin="round" paint-order="stroke">${escapeXml(subtitle)}</text>`
    : ''
  const imprint =
    `<g transform="translate(${CX} 104) rotate(-8)"><g transform="scale(0)">` +
    animateTransform('scale', ['1.35', '0.94', '1.02', '1'], { dur: 0.3, begin: 0.42, keyTimes: [0, 0.5, 0.8, 1] }) +
    `<g opacity="0.92"><rect x="-84" y="-31" width="168" height="62" rx="10" fill="none" stroke="${STAMP_INK}" stroke-width="5"/>` +
    `<rect x="-76" y="-23" width="152" height="46" rx="6" fill="none" stroke="${STAMP_INK}" stroke-width="2"/>` +
    `<text text-anchor="middle" dominant-baseline="central" ${inkText}>${escapeXml(word)}</text></g>${sub}</g></g>`

  return (
    fadeGroup(imprint, 0.42, 1.8) +
    cloud(rnd, { cx: CX - 62, cy: floor - 4, count: 4, spread: [6, 12], radius: [7, 11], begin: 0.28, dur: 0.6 }) +
    cloud(rnd, { cx: CX + 62, cy: floor - 4, count: 4, spread: [6, 12], radius: [7, 11], begin: 0.28, dur: 0.6 }) +
    rays(rnd, { cx: CX, cy: floor - 6, count: 10, from: [54, 62], to: [80, 96], flat: 0.45, begin: 0.28 }) +
    theStamp
  )
}

// ---- tests: a checkmark badge ----------------------------------------------

function check(rnd: () => number, title: string, subtitle: string): string {
  const cy = 76
  const tick =
    `<path d="M-15,1 L-5,12 L16,-11" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" ` +
    `stroke-linejoin="round" stroke-dasharray="48" stroke-dashoffset="48">` +
    animate('stroke-dashoffset', [48, 0], { dur: 0.3, begin: 0.32 }) +
    `</path>`
  const badge =
    `<circle r="34" fill="#2FBF71" stroke="#155E37" stroke-width="4"/>` +
    `<path d="M-24,-12 A26,26 0 0 1 -8,-25" fill="none" stroke="#86E5AE" stroke-width="5" stroke-linecap="round"/>` +
    tick
  const ring =
    `<circle cx="${CX}" cy="${cy}" r="34" fill="none" stroke="#7BE04A" stroke-width="5" opacity="0">` +
    animate('r', [34, 80], { dur: 0.55, begin: 0.3 }) +
    animate('opacity', [0.9, 0], { dur: 0.55, begin: 0.3 }) +
    `</circle>`
  const twinkles = ['#FFD23F', '#7BE04A', '#3BCEAC', '#FF9F1C']
  const sparkles = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.3
    const r = 54 + rnd() * 26
    const color = twinkles[i % twinkles.length] ?? INK
    return sparkle(CX + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.8, 6 + rnd() * 6, color, 0.45 + rnd() * 0.35)
  }).join('')

  return (
    ring +
    fadeGroup(pop(badge, CX, cy, 0.05, 0, 0.45), 0.05, 2.2) +
    sparkles +
    label(title, subtitle, { y: 146, fill: '#7BE04A', begin: 0.5, dur: 1.8, size: 28, rotate: -4 })
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

// ---- helpers: ninja helpers dash out of a smoke bomb -----------------------

const BODY = '#D97757'
const EYES = '#2B1A12'

// A tiny pixel helper in a ninja headband, facing right, its feet at (0, 0).
function ninja(band: string): string {
  const px = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`
  return (
    `<g transform="scale(3) translate(-6.5 -8)" shape-rendering="crispEdges">` +
    px(1, 0, 11, 6, BODY) +
    px(0, 2, 1, 2, BODY) +
    px(12, 2, 1, 2, BODY) +
    [2, 4, 8, 10].map(x => px(x, 6, 1, 2, BODY)).join('') +
    px(1, 1, 11, 1, band) +
    px(-1, 1, 2, 1, band) +
    px(-2, 0, 1, 1, band) +
    px(4, 2, 1, 2, EYES) +
    px(9, 2, 1, 2, EYES) +
    `</g>`
  )
}

function helper(rnd: () => number, i: number): string {
  const dir = i % 2 === 0 ? 1 : -1
  const dist = 70 + Math.floor(i / 2) * 28 + rnd() * 10
  const begin = 0.18 + i * 0.08
  const dur = 1.5
  const hops: [number, number][] = [
    [0, 0],
    [0.22, -20],
    [0.45, 0],
    [0.68, -14],
    [0.86, 0],
    [1.25, -8],
  ]
  const keyTimes = [0, 0.18, 0.36, 0.54, 0.7, 1]
  const band = COLORS[(i * 3) % COLORS.length] ?? INK
  const trail = [-6, -11, -16]
    .map(
      (y, k) =>
        `<line x1="${-24 - k * 3}" y1="${y * 1.25}" x2="${-40 - k * 5}" y2="${y * 1.25}" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`,
    )
    .join('')
  return (
    `<g transform="translate(${CX} 146)" opacity="0">` +
    animate('opacity', [1, 1, 0], { dur, begin, keyTimes: [0, 0.7, 1] }) +
    `<g>${animateTransform(
      'translate',
      hops.map(([f, h]) => `${n(dir * dist * f)} ${h}`),
      { dur, begin, keyTimes },
    )}` +
    `<g transform="scale(${dir} 1)">${trail}${ninja(band)}</g></g></g>`
  )
}

function helpers(rnd: () => number, title: string, subtitle: string, count: number): string {
  const crew = Array.from({ length: Math.max(1, Math.min(count, 5)) }, (_, i) => helper(rnd, i)).join('')
  return (
    crew +
    cloud(rnd, {
      cx: CX,
      cy: 128,
      count: 11,
      spread: [18, 32],
      radius: [15, 24],
      dur: 1,
      fill: '#F1F1F6',
      edge: '#8E8EA6',
      stretch: [1.6, 0.7],
    }) +
    label(title, subtitle, { y: 44, fill: '#FF9F1C', begin: 0.3, dur: 2 })
  )
}

// ---- review: a magnifying glass sweeps a page of code ----------------------

function review(rnd: () => number, title: string, subtitle: string, findings: number): string {
  const top = 38
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

  // The glass zigzags down the page, then leaves to the right.
  const lens =
    `<line x1="19" y1="19" x2="40" y2="40" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` +
    `<line x1="21" y1="21" x2="38" y2="38" stroke="#B07438" stroke-width="5" stroke-linecap="round"/>` +
    `<circle r="26" fill="#BFE3FF" fill-opacity="0.45" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M-15,-8 A17,17 0 0 1 -5,-17" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>`
  const path = [
    [CX - 120, top + 10],
    [CX + 24, top + 18],
    [CX - 30, top + 40],
    [CX + 30, top + 62],
    [CX - 14, top + 80],
    [CX + 150, top + 40],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(';')
  const theLens =
    `<g opacity="0">${animate('opacity', [1, 1, 0], { dur: 1.7, begin: 0.15, keyTimes: [0, 0.9, 1] })}` +
    `<g transform="translate(${CX - 120} ${top + 10})"><animateMotion values="${path}" dur="1.6s" begin="0.15s" fill="freeze" ` +
    `keyTimes="0;0.2;0.42;0.62;0.8;1" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.5 0 1 1"/>` +
    `${lens}</g></g>`

  // A red "!" beside each line with a finding, as the glass passes; a clean
  // page gets a green check instead.
  const flagged = [1, 3, 4, 2]
  const marks =
    findings > 0
      ? flagged
          .slice(0, Math.min(findings, flagged.length))
          .map((line, i) =>
            fadeGroup(
              pop(
                `<circle r="8" fill="#FF5E5B" stroke="${INK}" stroke-width="2.5"/>` +
                  `<text y="4.5" text-anchor="middle" ${FONT} font-size="13" font-weight="900" fill="#FFFFFF">!</text>`,
                CX + 50,
                lineY(line),
                0.45 + i * 0.22,
              ),
              0.45 + i * 0.22,
              2.1 - i * 0.22,
            ),
          )
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

  return thePage + marks + theLens + twinkles + label(title, subtitle, { y: 162, fill: '#6FB6FF', begin: 1.3, dur: 1.4, size: 26, rotate: -4 })
}

// ---- fixes: a bug walks in and gets swatted -------------------------------

const BUG = '#6E4BD8'
const GROUND = 128

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
    label(title, subtitle, { y: 164, fill: '#7BE04A', begin: 0.85, dur: 1.8, size: 26, rotate: -4 })
  )
}

// ---- plan: a film clapperboard snaps shut ---------------------------------

function clapper(rnd: () => number, title: string, subtitle: string): string {
  const cy = 94
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
    label(title, subtitle, { y: 162, fill: '#FF9F1C', begin: 0.6, dur: 1.9, size: 26, rotate: -4 })
  )
}

// ---- context: a gauge swings into the yellow, or slams into the red --------

const YELLOW_ZONE = '#FFD23F'
const RED_ZONE = '#FF5E5B'

function gauge(rnd: () => number, title: string, subtitle: string, percent: number, isRed: boolean): string {
  const gx = CX
  const gy = 116
  const R = 64
  const zone = isRed ? RED_ZONE : YELLOW_ZONE
  const at = (p: number, r = R): [number, number] => {
    const a = Math.PI * (1 - p / 100)
    return [gx + r * Math.cos(a), gy - r * Math.sin(a)]
  }
  const arc = (p1: number, p2: number, color: string, pulse = '') => {
    const [x1, y1] = at(p1)
    const [x2, y2] = at(p2)
    return `<path d="M${n(x1)},${n(y1)} A${R},${R} 0 0 1 ${n(x2)},${n(y2)}" fill="none" stroke="${color}" stroke-width="14">${pulse}</path>`
  }
  // The yellow band throbs twice; the red one keeps throbbing, faster.
  const pulse = isRed
    ? animate('stroke-width', [14, 22, 14], { dur: 0.5, begin: 1.05, repeat: true })
    : animate('stroke-width', [14, 21, 14, 21, 14], { dur: 0.9, begin: 1.05 })
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const [x1, y1] = at(i * 10, R - 13)
    const [x2, y2] = at(i * 10, R - 7)
    return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${INK}" stroke-width="2"/>`
  }).join('')
  const rot = -90 + 1.8 * Math.min(Math.max(percent, 0), 100)
  // Into the yellow the needle swings and settles; into the red it slams past
  // the end stop and bounces back.
  const swing = isRed
    ? { values: [-90, 96, rot - 10, rot + 6, rot - 3, rot], keyTimes: [0, 0.4, 0.6, 0.75, 0.88, 1] }
    : { values: [-90, rot + 14, rot - 7, rot + 3, rot], keyTimes: [0, 0.45, 0.7, 0.85, 1] }
  const needle =
    `<g transform="translate(${gx} ${gy})"><g transform="rotate(-90)">` +
    animateTransform('rotate', swing.values.map(String), { dur: 0.9, begin: 0.2, keyTimes: swing.keyTimes }) +
    `<path d="M-5,0 L0,${-(R - 8)} L5,0 Z" fill="${INK}"/></g>` +
    `<circle r="8" fill="${INK}" stroke="${zone}" stroke-width="3"/></g>`
  const dial =
    `<path d="M${gx - R - 14},${gy} A${R + 14},${R + 14} 0 0 1 ${gx + R + 14},${gy} Z" fill="${CLOUD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    arc(0, 60, '#2FBF71') +
    arc(60, 90, YELLOW_ZONE, isRed ? '' : pulse) +
    arc(90, 100, RED_ZONE, isRed ? pulse : '') +
    ticks +
    needle
  // The red one rattles on its base as the needle hits the stop.
  const rattle = isRed
    ? animateTransform(
        'rotate',
        ['0', '-4', '4', '-4', '3', '-2', '0'].map(a => `${a} ${gx} ${gy}`),
        { dur: 0.7, begin: 1.05 },
      )
    : ''
  const theGauge =
    `<g transform="translate(${gx} ${gy})"><g transform="scale(0)">` +
    animateTransform('scale', ['0.5', '1.1', '0.97', '1'], { dur: 0.3, begin: 0, keyTimes: [0, 0.5, 0.8, 1] }) +
    `<g transform="translate(${-gx} ${-gy})"><g>${rattle}${dial}</g></g></g></g>`

  const sign = (fill: string, mark: string) =>
    `<g><g transform="rotate(0)">` +
    animateTransform('rotate', ['0', '-14', '12', '-8', '6', '0'], { dur: 0.7, begin: 1.15 }) +
    `<path d="M0,-22 L22,16 L-22,16 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<text y="9" text-anchor="middle" ${FONT} font-size="24" font-weight="900" fill="${mark}">!</text></g></g>`
  const signs = isRed
    ? fadeGroup(pop(sign(RED_ZONE, '#FFFFFF'), gx + R + 28, gy - 58, 0.95), 0.95, 2.2) +
      fadeGroup(pop(sign(RED_ZONE, '#FFFFFF'), gx - R - 28, gy - 58, 1.05), 1.05, 2.1)
    : fadeGroup(pop(sign(YELLOW_ZONE, INK), gx + R + 28, gy - 58, 0.95), 0.95, 2)
  const steam = isRed
    ? [-1, 1]
        .map((side, i) =>
          cloud(rnd, {
            cx: gx + side * 40,
            cy: gy - R - 20,
            count: 4,
            spread: [5, 10],
            radius: [6, 10],
            begin: 1.1 + i * 0.15,
            dur: 0.8,
            fill: '#F1F1F6',
            edge: '#8E8EA6',
          }),
        )
        .join('')
    : ''

  return (
    fadeGroup(theGauge, 0, isRed ? 3.1 : 2.9, 0.85) +
    steam +
    signs +
    label(title, subtitle, { y: 150, fill: zone, begin: 0.9, dur: isRed ? 2.2 : 2, size: 26, rotate: -3 })
  )
}

// ---- the one entry point ---------------------------------------------------

// `value` is the helper count for `helpers`, the context percentage for `context` and
// `redzone`, and the number of findings for `review`.
export function drawFx(kind: FxKind, seed: number, title: string, subtitle = '', value = 0): string {
  const rnd = random(seed)
  const body =
    kind === 'push'
      ? confetti(rnd, title, subtitle)
      : kind === 'commit'
        ? stamp(rnd, title, subtitle)
        : kind === 'tests'
          ? check(rnd, title, subtitle)
          : kind === 'compact'
            ? squish(rnd, title, subtitle)
            : kind === 'helpers'
              ? helpers(rnd, title, subtitle, value)
              : kind === 'plan'
                ? clapper(rnd, title, subtitle)
                : kind === 'fixes'
                  ? swat(rnd, title, subtitle)
                  : kind === 'review'
                    ? review(rnd, title, subtitle, value)
                    : gauge(rnd, title, subtitle, value, kind === 'redzone')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_X} 0 ${VIEW_WIDTH} ${HEIGHT}" width="${VIEW_WIDTH * SCALE}" height="${HEIGHT * SCALE}">` +
    `${body}</svg>`
  )
}
