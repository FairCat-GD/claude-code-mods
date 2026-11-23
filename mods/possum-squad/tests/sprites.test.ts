import { expect, test } from 'claude-code/testing'

import { ANIMATION_STEP_MS } from '../hooks/config'
import { frameGrid, type Grid, NONE } from '../hooks/sprites/compose'
import { ART } from '../hooks/sprites/data'
import { drawSprite, dressOf, type Look, type Sprite, sprite, squad } from '../hooks/sprites/index'
import { BLINK_STEP, COLOURINGS, LOOP_STEPS, type Pose, resolved, STILL, stillFrame, WORDED_MARKS } from '../hooks/sprites/recipes'
import { STRINGS } from '../hooks/strings'

const POSES = Object.keys(STILL) as Pose[]
const SETS = Object.keys(ART.sets)
const ROLES = [undefined, ...Object.keys(ART.sets.classic?.roles ?? {})]
const MOTIONS = ['auto', 'off'] as const
const every = (motion: Look['motion']) => SETS.flatMap(set => ROLES.flatMap(role => POSES.map(pose => ({ set, role, pose, motion }))))

// The decision this checks: an outline on the light theme wherever an edge colour is under 3:1 against its panel.
const LIGHT = '#f8f6f0'
const OUTLINE = '#464650'
const linear = (hex: string, at: number) => {
  const value = Number.parseInt(hex.slice(at, at + 2), 16) / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}
const lum = (hex: string) => 0.2126 * linear(hex, 1) + 0.7152 * linear(hex, 3) + 0.0722 * linear(hex, 5)
const faint = (hex: string) => (Math.max(lum(hex), lum(LIGHT)) + 0.05) / (Math.min(lum(hex), lum(LIGHT)) + 0.05) < 3

// The decision for `planned`: 70% luminance grey and 30% colour, faded 45% toward the panel by its opacity.
const PLANNED_OPACITY = '0.55'
const rgb = (hex: string) => [1, 3, 5].map(at => Number.parseInt(hex.slice(at, at + 2), 16))
const hexOf = (channels: number[]) => `#${channels.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`
const grey = (hex: string) => {
  const [r = 0, g = 0, b = 0] = rgb(hex)
  const luma = Math.trunc(0.3 * r + 0.59 * g + 0.11 * b)
  return hexOf([r, g, b].map(value => 0.7 * luma + 0.3 * value))
}
// A colour at an opacity, as the light panel shows it.
const onLight = (hex: string, alpha: number) => {
  const panel = rgb(LIGHT)
  return hexOf(rgb(hex).map((value, at) => value * alpha + (panel[at] ?? 0) * (1 - alpha)))
}

// The test's own reading of a sprite: its elements as a tree, then the pixels and outline it shows at a step.
type Node = { name: string; attrs: Record<string, string>; children: Node[] }
function parse(source: string): Node {
  const root: Node = { name: 'root', attrs: {}, children: [] }
  const stack = [root]
  const body = source.replace(/<style>[^<]*<\/style>/, '')
  for (const [, close, name = '', raw = '', selfClosing] of body.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)) {
    if (close === '/') {
      stack.pop()
      continue
    }
    const attrs = Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key = '', value = '']) => [key, value]))
    const node: Node = { name, attrs, children: [] }
    stack[stack.length - 1]?.children.push(node)
    if (selfClosing !== '/') stack.push(node)
  }
  return root
}

const find = (node: Node, test: (one: Node) => boolean): Node | undefined =>
  test(node) ? node : node.children.map(child => find(child, test)).find(found => found !== undefined)

// One step of a node's SMIL: the value its animation holds there, checked to run one T-01 a value.
function valueAt(node: Node, attribute: string, step: number): string | undefined {
  const animation = node.children.find(child => child.name.startsWith('animate') && child.attrs.attributeName === attribute)
  if (animation === undefined) return attribute === 'transform' ? node.attrs.transform?.replace(/^translate\((.*)\)$/, '$1') : node.attrs[attribute]
  const values = (animation.attrs.values ?? '').split(';')
  expect(animation.attrs.dur).toBe(`${values.length * ANIMATION_STEP_MS}ms`)
  expect(animation.attrs.calcMode).toBe('discrete')
  expect(animation.attrs.keyTimes).toBeUndefined()
  return values[step % values.length]
}

// What a sprite shows at a step: each pixel's colour and the opacity it is drawn at, and where its outline is drawn,
// with the lowest opacity any of the outline is drawn at.
type Shown = { pixels: (string | undefined)[][]; alphas: number[][]; outline: Set<string>; outlineAlpha: number; subpaths: number }
function show(node: Node, step: number): Shown {
  const shown: Shown = {
    pixels: Array.from({ length: 32 }, () => Array<string | undefined>(32)),
    alphas: Array.from({ length: 32 }, () => Array<number>(32).fill(1)),
    outline: new Set(),
    outlineAlpha: 1,
    subpaths: 0,
  }
  const walk = (one: Node, dx: number, dy: number, fill: string | undefined, isOutline: boolean, alpha: number) => {
    const opacity = Number(valueAt(one, 'opacity', step) ?? 1)
    if (opacity === 0) return
    const [x = 0, y = 0] = (valueAt(one, 'transform', step) ?? '0 0').split(' ').map(Number)
    const colour = one.attrs.fill ?? fill
    const outline = isOutline || one.attrs.class === 'o'
    if (one.name === 'path') {
      for (const [, sx = '', sy = '', w = ''] of (one.attrs.d ?? '').matchAll(/M(\d+) (\d+)h(\d+)v1h-\3/g)) {
        shown.subpaths++
        for (let at = 0; at < Number(w); at++) {
          const [px, py] = [Number(sx) + at + dx + x, Number(sy) + dy + y]
          if (outline) {
            shown.outline.add(`${px} ${py}`)
            shown.outlineAlpha = Math.min(shown.outlineAlpha, alpha * opacity)
          } else if (shown.pixels[py] !== undefined) {
            ;(shown.pixels[py] as (string | undefined)[])[px] = colour
            ;(shown.alphas[py] as number[])[px] = alpha * opacity
          }
        }
      }
    }
    for (const child of one.children) walk(child, dx + x, dy + y, colour, outline, alpha * opacity)
  }
  walk(node, 0, 0, undefined, false, 1)
  return shown
}

// Every empty pixel beside one that is faint as the light panel shows it.
function exactOutline({ pixels, alphas }: Pick<Shown, 'pixels' | 'alphas'>): Set<string> {
  const seen = (x: number, y: number) => {
    const colour = pixels[y]?.[x]
    return colour === undefined ? undefined : onLight(colour, alphas[y]?.[x] ?? 1)
  }
  const out = new Set<string>()
  for (const [y, row] of pixels.entries()) {
    for (const [x, colour] of row.entries()) {
      const near = [seen(x + 1, y), seen(x - 1, y), seen(x, y + 1), seen(x, y - 1)]
      if (colour === undefined && near.some(one => one !== undefined && faint(one))) out.add(`${x} ${y}`)
    }
  }
  return out
}

const colours = (grid: Grid) => grid.map(row => row.map(key => (key === NONE ? undefined : ART.palette[key])))
const runs = (grid: Grid) => grid.reduce((sum, row) => sum + row.filter((key, x) => key !== NONE && key !== row[x - 1]).length, 0)
const sorted = (set: Set<string>) => [...set].sort()
const stillOf = (look: Look) => frameGrid(ART, dressOf(ART, look.set, look.role), stillFrame(ART, look.pose))

test('every role and the plain opossum of every set, in every pose and either motion, is under 16,000 characters (N-02)', () => {
  const sizes = MOTIONS.flatMap(every).map(look => sprite(look).source.length)
  expect(sizes).toHaveLength(SETS.length * ROLES.length * POSES.length * 2)
  expect(Math.max(...sizes)).toBeLessThan(16_000)
  expect(squad().source.length).toBeLessThan(16_000)
})

test('with motion off no sprite holds an animation element, and none moves (F-21)', () => {
  for (const look of every('off')) {
    const drawn = sprite(look)
    expect([look, drawn.isAnimated, /<(animate|animateTransform|animateMotion|set)\b/.test(drawn.source)]).toEqual([look, false, false])
  }
  // With motion on, only the work loop moves.
  expect(
    every('auto')
      .filter(look => sprite(look).isAnimated)
      .map(look => look.pose),
  ).toEqual(SETS.flatMap(() => ROLES.map(() => 'working')))
})

test('an animated sprite carries its still pose for reduced motion; a still one has neither style nor copy (F-21)', () => {
  for (const look of every('auto').filter(one => one.pose === 'working')) {
    const { source } = sprite(look)
    expect(source).toContain('.o,.s{display:none}')
    expect(source).toContain('@media (prefers-reduced-motion: reduce){.m{display:none}.s{display:inline}}')
    const stillCopy = source.slice(source.indexOf('<g class="s">') + '<g class="s">'.length, -'</g></svg>'.length)
    const off = sprite({ ...look, motion: 'off' }).source
    expect(stillCopy).toBe(off.slice(off.indexOf('</style>') + '</style>'.length, -'</svg>'.length))
  }
  for (const look of every('off')) {
    const { source } = sprite(look)
    expect([source.includes('prefers-reduced-motion'), source.includes('class="m"'), source.includes('class="s"')]).toEqual([false, false, false])
  }
})

test('on the light theme exactly the empty pixels beside a faint colour are outlined, and only there (N-06)', () => {
  const checkStill = (source: string, grid: Grid, what: Look) => {
    const shown = show(parse(source), 0)
    const isPlanned = what.pose === 'planned'
    const expected = colours(grid).map(row => row.map(colour => (colour !== undefined && isPlanned ? grey(colour) : colour)))
    expect([what, shown.pixels]).toEqual([what, expected])
    expect([what, sorted(shown.outline), shown.outlineAlpha]).toEqual([what, sorted(exactOutline(shown)), 1])
  }
  for (const look of every('off')) checkStill(sprite(look).source, stillOf(look), look)
  for (const look of every('auto').filter(one => one.pose === 'working')) {
    const tree = parse(sprite(look).source)
    const moving = find(tree, one => one.attrs.class === 'm') as Node
    const copy = find(tree, one => one.attrs.class === 's') as Node
    const stillShown = show(copy, 0)
    expect([look, sorted(stillShown.outline)]).toEqual([look, sorted(exactOutline(stillShown))])
    // Each step of the loop, as its own SMIL plays it: the recipe's frame, outlined exactly.
    const [first, bob] = (ART.recipes.working?.frames ?? []).map(resolved)
    const dress = dressOf(ART, look.set, look.role)
    for (let step = 0; step < LOOP_STEPS; step++) {
      const frame = step === BLINK_STEP ? { ...first, body: 'none' as const, eyes: 'closed' as const } : step % 2 === 0 ? first : bob
      const shown = show(moving, step)
      expect([look.role, step, shown.pixels]).toEqual([look.role, step, colours(frameGrid(ART, dress, frame ?? { body: 'none' }))])
      expect([look.role, step, sorted(shown.outline)]).toEqual([look.role, step, sorted(exactOutline(shown))])
    }
  }
  // The outline is the light theme's alone: hidden first, shown by the light query, and nowhere outside its group.
  for (const look of [...every('off'), ...every('auto')]) {
    const { source } = sprite(look)
    expect(source).toMatch(/<style>\.o(,\.s)?\{display:none\}@media \(prefers-color-scheme: light\)\{\.o\{display:inline\}\}/)
    expect(source.split(OUTLINE).length - 1).toBe(source.split(`<g class="o" fill="${OUTLINE}">`).length - 1)
  }
})

test('a sprite is one path per colour, each run of a row one rectangle in it', () => {
  for (const look of every('off')) {
    const { source } = sprite(look)
    const grid = stillOf(look)
    const fills = [...source.matchAll(/<path fill="(#[0-9a-f]{6})" d="([^"]*)"/g)]
    expect(new Set(fills.map(([, colour]) => colour)).size).toBe(fills.length)
    const subpaths = fills.reduce((sum, [, , d = '']) => sum + (d.match(/M/g)?.length ?? 0), 0)
    expect([look, subpaths]).toEqual([look, runs(grid)])
  }
})

test('the cache writes each look once, and a look differs from another', () => {
  const look: Look = { set: 'classic', role: 'builder', pose: 'working', motion: 'auto' }
  expect(sprite(look)).toBe(sprite({ ...look }))
  expect(sprite(look).source).not.toBe(sprite({ ...look, motion: 'off' }).source)
  expect(sprite(look).source).toBe(drawSprite(ART, look).source)
})

test('every recipe a pose draws has its words drawn, and the art dresses every role the strings name', () => {
  const used = new Set([...POSES.map(pose => STILL[pose]), 'working'])
  for (const name of used) {
    const recipe = ART.recipes[name]
    expect([name, recipe !== undefined]).toEqual([name, true])
    for (const frame of recipe?.frames ?? []) if (typeof frame.marks === 'string') expect(Object.keys(WORDED_MARKS)).toContain(frame.marks)
    if (recipe?.colour !== undefined) expect(Object.keys(COLOURINGS)).toContain(recipe.colour)
  }
  expect(Object.keys(ART.sets[ART.defaultSet]?.roles ?? {})).toEqual(Object.keys(STRINGS.roles))
})

test('a role no art knows, as a newer version might have stored, draws the plain opossum', () => {
  const plain: Sprite = sprite({ set: 'classic', pose: 'working', motion: 'off' })
  expect(sprite({ set: 'classic', role: 'mime', pose: 'working', motion: 'off' })).toEqual(plain)
  expect(sprite({ set: 'gone', role: 'scout', pose: 'idle', motion: 'off' })).toEqual(sprite({ set: 'classic', role: 'scout', pose: 'idle', motion: 'off' }))
  // Names every object inherits are no role, set or pose either.
  const idle = sprite({ set: 'classic', pose: 'idle', motion: 'off' })
  for (const inherited of ['constructor', 'toString', '__proto__']) {
    expect([inherited, sprite({ set: inherited, role: inherited, pose: inherited as Pose, motion: 'off' })]).toEqual([inherited, idle])
  }
})

test('planned is the idle frame greyed and faded inside its own group, its outline outside at full strength, and still', () => {
  for (const look of [...every('off'), ...every('auto')].filter(one => one.pose === 'planned')) {
    const drawn = sprite(look)
    expect([look, drawn.isAnimated, drawn.source.includes('<animate')]).toEqual([look, false, false])
    expect(drawn).toEqual(sprite({ ...look, motion: 'off' }))
    const tree = parse(drawn.source)
    const svg = tree.children[0] as Node
    const faded = svg.children.filter(child => child.attrs.opacity !== undefined)
    expect([look, faded.map(group => group.attrs.opacity)]).toEqual([look, [PLANNED_OPACITY]])
    // Every colour is inside the faded group, greyed; the outline is beside it, never inside.
    const outside = svg.children.filter(child => child.attrs.opacity === undefined)
    expect([look, outside.map(child => child.attrs.class)]).toEqual([look, ['o']])
    const idle = stillOf({ ...look, pose: 'idle' })
    const palette = new Set(colours(idle).flatMap(row => row.filter(colour => colour !== undefined).map(grey)))
    expect([look, new Set(faded[0]?.children.map(path => path.attrs.fill))]).toEqual([look, palette])
  }
  // Faded, almost every colour is faint on the light panel, so the outline is drawn round far more than idle's.
  const look: Look = { set: 'classic', role: 'helper', pose: 'planned', motion: 'off' }
  const outlined = (one: Look) => show(parse(sprite(one).source), 0).outline.size
  expect(outlined(look)).toBeGreaterThan(outlined({ ...look, pose: 'idle' }))
})
