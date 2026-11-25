import { expect, test } from 'claude-code/testing'

import { ANIMATION_STEP_MS } from '../hooks/config'
import { blank, bobbed, frameGrid, type Grid, layerGrid, NONE, over } from '../hooks/sprites/compose'
import { ART } from '../hooks/sprites/data'
import { drawSprite, dressOf, type Look, leadWith, type Moment, type Sprite, sprite, squad } from '../hooks/sprites/index'
import { BLINK_STEP, COLOURINGS, LOOP_STEPS, type Pose, resolved, STILL, stillFrame, WORDED_MARKS } from '../hooks/sprites/recipes'
import { STRINGS } from '../hooks/strings'

const POSES = Object.keys(STILL) as Pose[]
const SETS = Object.keys(ART.sets)
const ROLES = [undefined, ...Object.keys(ART.sets.classic?.roles ?? {})]
const MOTIONS = ['auto', 'off'] as const
// The motion table's poses: those a live run is in, which arrive and are dressed; those with an ending.
const LIVE: readonly Pose[] = ['starting', 'working', 'needs-you', 'quiet', 'waiting']
const ENDINGS: readonly Pose[] = ['finished', 'stopped']
// Each look a sprite is drawn in: every pose, then the moments it plays, once and again: ten arrivals and four endings,
// and five dressings for a role.
function looksOf(set: string, role: string | undefined, motion: Look['motion']): Look[] {
  const base = { set, motion, ...(role === undefined ? {} : { role }) }
  const moments: { pose: Pose; moment: Moment; isRepeated?: boolean }[] = [
    ...LIVE.flatMap(pose => [
      { pose, moment: 'arrival' as const },
      { pose, moment: 'arrival' as const, isRepeated: true },
    ]),
    ...(role === undefined ? [] : LIVE.map(pose => ({ pose, moment: 'dressing' as const }))),
    ...ENDINGS.flatMap(pose => [
      { pose, moment: 'ending' as const },
      { pose, moment: 'ending' as const, isRepeated: true },
    ]),
  ]
  return [...POSES.map(pose => ({ ...base, pose })), ...moments.map(one => ({ ...base, ...one }))]
}
const every = (motion: Look['motion']) => SETS.flatMap(set => ROLES.flatMap(role => looksOf(set, role, motion)))

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

// One step of a node's SMIL: the value it holds there, each animation checked to run one T-01 a value. An animation
// counts from its `begin`; once through, it holds its last value with `fill="freeze"`, or loops with
// `repeatCount="indefinite"`; the one begun last wins. Before any begins, the attribute holds the value.
function valueAt(node: Node, attribute: string, step: number): string | undefined {
  const base = attribute === 'transform' ? node.attrs.transform?.replace(/^translate\((.*)\)$/, '$1') : node.attrs[attribute]
  let value = base
  let latest = -1
  for (const animation of node.children.filter(child => child.name.startsWith('animate') && child.attrs.attributeName === attribute)) {
    const values = (animation.attrs.values ?? '').split(';')
    expect(animation.attrs.dur).toBe(`${values.length * ANIMATION_STEP_MS}ms`)
    expect(animation.attrs.calcMode).toBe('discrete')
    expect(animation.attrs.keyTimes).toBeUndefined()
    const begin = Number((animation.attrs.begin ?? '0ms').replace(/ms$/, '')) / ANIMATION_STEP_MS
    expect(Number.isInteger(begin)).toBe(true)
    if (step < begin) continue
    const at = step - begin
    const isLooping = animation.attrs.repeatCount === 'indefinite'
    const current = isLooping ? values[at % values.length] : at < values.length ? values[at] : animation.attrs.fill === 'freeze' ? values.at(-1) : undefined
    if (current !== undefined && begin >= latest) {
      value = current
      latest = begin
    }
  }
  return value
}

// Each path's rectangles, read once.
const rectangles = new WeakMap<Node, [number, number, number][]>()
const rectanglesOf = (path: Node) => {
  const known = rectangles.get(path)
  if (known !== undefined) return known
  const read = [...(path.attrs.d ?? '').matchAll(/M(\d+) (\d+)h(\d+)v1h-\3/g)].map(
    ([, x, y, w]) => [Number(x), Number(y), Number(w)] as [number, number, number],
  )
  rectangles.set(path, read)
  return read
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
      for (const [sx, sy, w] of rectanglesOf(one)) {
        shown.subpaths++
        for (let at = 0; at < w; at++) {
          const [px, py] = [sx + at + dx + x, sy + dy + y]
          if (px < 0 || px > 31 || py < 0 || py > 31) continue
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

// Every empty pixel beside one that is faint as the light panel shows it; each colour's faintness worked out once.
const faintness = new Map<string, boolean>()
function exactOutline({ pixels, alphas }: Pick<Shown, 'pixels' | 'alphas'>): Set<string> {
  const isFaintAt = (x: number, y: number) => {
    const colour = pixels[y]?.[x]
    if (colour === undefined) return false
    const alpha = alphas[y]?.[x] ?? 1
    const key = `${colour} ${alpha}`
    if (!faintness.has(key)) faintness.set(key, faint(onLight(colour, alpha)))
    return faintness.get(key) === true
  }
  const out = new Set<string>()
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < 32; x++) {
      if (pixels[y]?.[x] !== undefined) continue
      if (isFaintAt(x + 1, y) || isFaintAt(x - 1, y) || isFaintAt(x, y + 1) || isFaintAt(x, y - 1)) out.add(`${x} ${y}`)
    }
  }
  return out
}

const colours = (grid: Grid) => grid.map(row => row.map(key => (key === NONE ? undefined : ART.palette[key])))
const runs = (grid: Grid) => grid.reduce((sum, row) => sum + row.filter((key, x) => key !== NONE && key !== row[x - 1]).length, 0)
const sorted = (set: Set<string>) => [...set].sort()
const stillOf = (look: Look) => frameGrid(ART, dressOf(ART, look.set, look.role), stillFrame(ART, look.pose))

// The motion table's recipes as this test reads them: the frames a look shows, the first `once` played once, then
// the rest looping, or held when one is left. A hop is up 2 for one step; T-01 a step.
type Script = { frames: Grid[]; once: number }
const placedAt = (grid: Grid, x: number, y: number) => over(blank(32, 32), grid, { x, y })
const times = (count: number, grid: Grid): Grid[] => Array.from({ length: count }, () => grid)
function scriptOf(look: Look): Script | undefined {
  if (look.motion === 'off') return undefined
  const dress = dressOf(ART, look.set, look.role)
  const still = (pose: Pose) => frameGrid(ART, dress, stillFrame(ART, pose))
  const plain = frameGrid(ART, undefined, stillFrame(ART, 'idle'))
  const standing = still('idle')
  const bobbing = (grid: Grid, pace: number) => [...times(pace, grid), ...times(pace, bobbed(grid, ART.bob))]
  // The work loop: the bob on odd steps with the prop at its own offset, the blink on one still step.
  const [first, bob] = (ART.recipes.working?.frames ?? []).map(resolved)
  const work = () =>
    Array.from({ length: LOOP_STEPS }, (_, step) =>
      frameGrid(
        ART,
        dress,
        (step === BLINK_STEP ? { ...first, body: 'none' as const, eyes: 'closed' as const } : step % 2 === 0 ? first : bob) ?? { body: 'none' },
      ),
    )
  const own = (pose: Pose): Grid[] | undefined =>
    pose === 'working'
      ? work()
      : pose === 'needs-you'
        ? bobbing(still('needs-you'), 2)
        : pose === 'quiet' || pose === 'waiting'
          ? bobbing(still(pose), 4)
          : undefined
  const slide = [placedAt(plain, -24, 0), placedAt(plain, -16, 0), placedAt(plain, -8, 0)]
  const oneOff = (): Script | undefined => {
    if (look.moment === 'arrival' && LIVE.includes(look.pose)) {
      return dress === undefined ? { frames: [...slide, plain], once: 3 } : { frames: [...slide, plain, placedAt(plain, 0, -2), standing], once: 5 }
    }
    if (look.moment === 'dressing' && LIVE.includes(look.pose) && dress !== undefined) {
      return { frames: [placedAt(plain, 0, -2), ...(own(look.pose) ?? [still(look.pose)])], once: 1 }
    }
    if (look.moment === 'ending' && look.pose === 'finished') {
      const { extra = '', ...asleep } = stillFrame(ART, 'finished')
      const body = frameGrid(ART, dress, { ...asleep, prop: 'hidden' })
      const z = layerGrid(ART.extras[extra] ?? { top: 0, rows: '' }, 32, 32)
      const hops = [placedAt(standing, 0, -2), standing, placedAt(standing, 0, -2), standing]
      return { frames: [...hops, ...times(6, over(body, z, { x: 0, y: 2 })), ...times(5, over(body, z, { x: 0, y: 1 })), still('finished')], once: 15 }
    }
    if (look.moment === 'ending' && look.pose === 'stopped') return { frames: [...times(5, still('stopped')), standing], once: 5 }
    return undefined
  }
  const once = oneOff()
  if (once !== undefined && look.isRepeated === true) {
    // The gallery's: the one-off, then its last frame held for ten steps, round again.
    return { frames: [...once.frames.slice(0, once.once), ...times(10, once.frames[once.once] as Grid)], once: 0 }
  }
  if (once !== undefined) return once
  const loop = own(look.pose)
  return loop === undefined ? undefined : { frames: loop, once: 0 }
}
const frameAt = (script: Script, step: number) => {
  const loop = script.frames.slice(script.once)
  return (step < script.once ? script.frames[step] : loop[(step - script.once) % loop.length]) as Grid
}

test('every look of every set, the moments included, in either motion, is under 16,000 characters (N-02)', () => {
  const sizes = MOTIONS.flatMap(every).map(look => sprite(look).source.length)
  expect(sizes).toHaveLength(2 * SETS.length * (POSES.length + 14) * ROLES.length + 2 * SETS.length * 5 * (ROLES.length - 1))
  expect(Math.max(...sizes)).toBeLessThan(16_000)
  expect(squad().source.length).toBeLessThan(16_000)
})

test('with motion off no sprite holds an animation element, and none moves, whatever its moment (F-21)', () => {
  for (const look of every('off')) {
    const drawn = sprite(look)
    expect([look, drawn.isAnimated, /<(animate|animateTransform|animateMotion|set)\b/.test(drawn.source)]).toEqual([look, false, false])
    expect([look, drawn.source]).toEqual([
      look,
      sprite({ set: look.set, ...(look.role === undefined ? {} : { role: look.role }), pose: look.pose, motion: 'off' }).source,
    ])
  }
  // Asked with motion off, an arrival in any live pose is that pose's own still.
  for (const pose of LIVE) {
    const look: Look = { set: 'classic', role: 'guard', pose, motion: 'off' }
    expect([pose, sprite({ ...look, moment: 'arrival' }).source]).toEqual([pose, sprite(look).source])
  }
})

test('with motion on, a pose with its own loop moves, and so does every moment it plays; failed, planned and idle never', () => {
  const moving = (look: Look) => sprite(look).isAnimated
  for (const look of every('auto')) {
    expect([look, moving(look)]).toEqual([look, scriptOf(look) !== undefined])
  }
  const looping = every('auto').filter(look => look.moment === undefined && moving(look))
  expect(new Set(looping.map(look => look.pose))).toEqual(new Set(['working', 'needs-you', 'quiet', 'waiting']))
  for (const pose of ['failed', 'planned', 'idle'] as const) {
    for (const moment of ['arrival', 'dressing', 'ending'] as const)
      expect([pose, moment, moving({ set: 'classic', role: 'builder', pose, motion: 'auto', moment })]).toEqual([pose, moment, false])
  }
})

test("an arrival moves alike in every live pose, its still copy the pose's own; a moment its pose cannot play is none", () => {
  const look: Look = { set: 'steampunk', role: 'pilot', pose: 'starting', motion: 'auto', moment: 'arrival' }
  const moving = (one: Look) => sprite(one).source.slice(0, sprite(one).source.indexOf('<g class="s">'))
  // Working stands still as starting does, so a row that starts working inside its arrival draws the same string.
  expect(sprite({ ...look, pose: 'working' }).source).toBe(sprite(look).source)
  for (const pose of LIVE) expect([pose, moving({ ...look, pose })]).toEqual([pose, moving(look)])
  expect(sprite({ ...look, pose: 'needs-you' }).source).not.toBe(sprite(look).source)
  const bare = (pose: Pose, role?: string): Look => ({ set: 'classic', pose, motion: 'auto', ...(role === undefined ? {} : { role }) })
  expect(sprite({ ...bare('working', 'tester'), moment: 'ending' })).toBe(sprite(bare('working', 'tester')))
  expect(sprite({ ...bare('finished', 'tester'), moment: 'arrival' })).toBe(sprite(bare('finished', 'tester')))
  // A dressing needs a role to dress in; with none it is the plain pose.
  expect(sprite({ ...bare('working'), moment: 'dressing' })).toBe(sprite(bare('working')))
  // Repeating is the one-offs' alone.
  expect(sprite({ ...bare('quiet', 'guard'), isRepeated: true })).toBe(sprite(bare('quiet', 'guard')))
})

test('an animated sprite carries its still pose for reduced motion; a still one has neither style nor copy (F-21)', () => {
  for (const look of every('auto').filter(one => sprite(one).isAnimated)) {
    const { source } = sprite(look)
    expect(source).toContain('.o,.s{display:none}')
    expect(source).toContain('@media (prefers-reduced-motion: reduce){.m{display:none}.s{display:inline}}')
    const stillCopy = source.slice(source.indexOf('<g class="s">') + '<g class="s">'.length, -'</g></svg>'.length)
    const off = sprite({ ...look, motion: 'off' }).source
    expect([look, stillCopy]).toEqual([look, off.slice(off.indexOf('</style>') + '</style>'.length, -'</svg>'.length)])
  }
  for (const look of [...every('off'), ...every('auto').filter(one => !sprite(one).isAnimated)]) {
    const { source } = sprite(look)
    expect([source.includes('prefers-reduced-motion'), source.includes('class="m"'), source.includes('class="s"')]).toEqual([false, false, false])
  }
})

test('a stopped opossum is startled when still, and with motion on settles standing after its startle; a cheer ends asleep', () => {
  const look: Look = { set: 'horror', role: 'janitor', pose: 'stopped', motion: 'off' }
  const pixels = (one: Look) => show(parse(sprite(one).source), 0).pixels
  expect(pixels(look)).toEqual(colours(stillOf(look)))
  expect(pixels({ ...look, motion: 'auto' })).toEqual(colours(stillOf({ ...look, pose: 'idle' })))
  expect(pixels({ ...look, motion: 'auto' })).not.toEqual(pixels(look))
  const asleep: Look = { ...look, pose: 'finished', motion: 'auto' }
  const tree = parse(sprite({ ...asleep, moment: 'ending' }).source)
  expect(show(find(tree, one => one.attrs.class === 'm') as Node, 40).pixels).toEqual(pixels(asleep))
})

test('every still look shows its frame, and on the light theme exactly the empty pixels beside a faint colour are outlined (N-06)', () => {
  const checkStill = (source: string, grid: Grid, what: Look) => {
    const shown = show(parse(source), 0)
    const isPlanned = what.pose === 'planned'
    const expected = colours(grid).map(row => row.map(colour => (colour !== undefined && isPlanned ? grey(colour) : colour)))
    expect([what, shown.pixels]).toEqual([what, expected])
    expect([what, sorted(shown.outline), shown.outlineAlpha]).toEqual([what, sorted(exactOutline(shown)), 1])
  }
  for (const look of every('off')) checkStill(sprite(look).source, stillOf(look), look)
  // A still look with motion on is drawn where its one-off settles: a stopped one standing.
  for (const look of every('auto').filter(one => !sprite(one).isAnimated)) {
    checkStill(sprite(look).source, stillOf(look.pose === 'stopped' ? { ...look, pose: 'idle' } : look), look)
  }
  // The outline is the light theme's alone: hidden first, shown by the light query, and nowhere outside its group.
  for (const look of [...every('off'), ...every('auto')]) {
    const { source } = sprite(look)
    expect(source).toMatch(/<style>\.o(,\.s)?\{display:none\}@media \(prefers-color-scheme: light\)\{\.o\{display:inline\}\}/)
    expect(source.split(OUTLINE).length - 1).toBe(source.split(`<g class="o" fill="${OUTLINE}">`).length - 1)
  }
})

// Every step of every set's moving looks is played and read, so it is given longer than the kit's default.
test("each moving look shows its recipe's frame at every step as its SMIL plays, outlined exactly (F-08, N-06)", { timeoutMs: 30_000 }, () => {
  for (const look of every('auto').filter(one => sprite(one).isAnimated)) {
    const tree = parse(sprite(look).source)
    const moving = find(tree, one => one.attrs.class === 'm') as Node
    const copy = find(tree, one => one.attrs.class === 's') as Node
    const stillShown = show(copy, 0)
    expect([look, sorted(stillShown.outline)]).toEqual([look, sorted(exactOutline(stillShown))])
    // Each step as its own SMIL plays it, through the one-off and round the loop once more: the recipe's frame, outlined
    // exactly.
    const script = scriptOf(look) as Script
    const loop = script.frames.length - script.once
    for (let step = 0; step < script.once + Math.max(loop, 2) + 1; step++) {
      const shown = show(moving, step)
      expect([look, step, shown.pixels]).toEqual([look, step, colours(frameAt(script, step))])
      expect([look, step, sorted(shown.outline)]).toEqual([look, step, sorted(exactOutline(shown))])
    }
  }
})

test('a waiting opossum is drawn as a quiet one: the same doze, in every set, role, motion and moment', () => {
  for (const motion of MOTIONS) {
    for (const look of every(motion).filter(one => one.pose === 'waiting')) {
      expect([look, drawSprite(ART, look).source]).toEqual([look, drawSprite(ART, { ...look, pose: 'quiet' }).source])
    }
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
  expect(sprite({ ...look, moment: 'dressing' })).toBe(sprite({ ...look, moment: 'dressing' }))
  expect(sprite({ ...look, moment: 'dressing' }).source).not.toBe(sprite(look).source)
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

test("the collapsed Lead carries up to three joeys in every set, still and under 16,000 characters; with none it is the header's Lead", () => {
  for (const set of ['classic', 'steampunk', 'horror', 'prehistoric']) {
    const header = sprite({ set, role: 'lead', pose: 'idle', motion: 'auto' })
    expect(leadWith(set, 0, 'auto')).toBe(header)
    const carried = [1, 2, 3].map(joeys => leadWith(set, joeys, 'auto'))
    for (const one of carried) {
      expect(one.isAnimated).toBe(false)
      expect(one.source.length).toBeLessThan(16_000)
      expect(one.source).not.toBe(header.source)
    }
    expect(new Set(carried.map(one => one.source)).size).toBe(3)
    // Past three the numeral counts on; the Lead carries no more.
    expect(leadWith(set, 7, 'auto')).toBe(carried[2])
  }
})
