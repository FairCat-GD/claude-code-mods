import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

import { ART_DIR, convert, DATA_FILE, dataText } from './art.ts'
import { LAYERS, MANIFEST, PALETTE } from './fixtures/art.ts'
import { encodePng } from './png.ts'

type Folder = { palette: Record<string, unknown>; layers: Record<string, string[]>; manifest: Record<string, unknown> }

const FIXTURE: Folder = { palette: PALETTE, layers: LAYERS, manifest: MANIFEST }
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// Writes a fictional art folder into a temporary one; a layer row's key outside the palette is written as grey.
function written(folder: Folder, extra?: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), 'possum-art-'))
  writeFileSync(join(dir, 'palette.json'), JSON.stringify(folder.palette))
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(folder.manifest))
  for (const [path, rows] of Object.entries(folder.layers)) {
    const width = rows[0]?.length ?? 0
    const pixels = new Uint8Array(width * rows.length * 4)
    rows.forEach((row, y) => {
      ;[...row].forEach((key, x) => {
        if (key === '.') return
        const hex = (folder.palette[key] as string | undefined) ?? '#808080'
        pixels.set([1, 3, 5].map(at => Number.parseInt(hex.slice(at, at + 2), 16)).concat(255), (y * width + x) * 4)
      })
    })
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), encodePng({ width, height: rows.length, pixels }))
  }
  extra?.(dir)
  return dir
}

function converted(folder: Folder, extra?: (dir: string) => void) {
  const dir = written(folder, extra)
  try {
    return convert(dir)
  } finally {
    rmSync(dir, { recursive: true })
  }
}

test('the fictional art converts to the model the sprite module reads', () => {
  const { model } = converted(FIXTURE)
  assert.deepEqual(model.canvas, { width: 8, height: 8 })
  assert.deepEqual(model.palette, { A: '#112233', B: '#ddeeff', C: '#ff8800' })
  assert.deepEqual(model.eyes, { pupils: '2 2, 5 2', closed: 'B' })
  assert.deepEqual(model.bob, { top: 0, bottom: 4, by: 1 })
  // A layer keeps only its band of drawn rows.
  assert.deepEqual(model.base, { top: 1, rows: ['..AAAA..', '.ABBBBA.', '.ABBBBA.', '..AAAA..', '..A..A..', '..A..A..'] })
  assert.deepEqual(model.extras, { mark: { top: 0, rows: ['AB', 'BA'] } })
  assert.deepEqual(model.sets.plain?.roles.baker?.prop, { top: 0, rows: [] })
  assert.deepEqual(model.recipes, {
    rest: { frames: [{ body: 'none' }] },
    wave: {
      frames: [
        { body: 'none', propDy: 0 },
        { body: 'bob', propDy: 'propWorkDy' },
      ],
    },
    flop: { frames: [{ body: { top: 1, bottom: 6, down: 1 }, eyes: 'closed', marks: 'splat' }] },
    shout: { frames: [{ body: 'none', extra: 'mark', prop: 'hidden', marks: { A: '1 1' } }], colour: 'faded' },
  })
  // Roles in `roleNames`' order in every set; a set that lacks one is kept, for the default set's to stand in.
  assert.deepEqual(Object.keys(model.sets.plain?.roles ?? {}), ['cook', 'baker'])
  assert.deepEqual(Object.keys(model.sets.odd?.roles ?? {}), ['cook'])
  assert.equal(model.sets.plain?.roles.cook?.costume, 'Chef')
  assert.equal(model.sets.plain?.roles.cook?.propWorkDy, -1)
  assert.equal(model.defaultSet, 'plain')
})

test("the text is the model as a module, a layer's rows one a line, and no words the manifest gives in prose", () => {
  const { model, text } = converted(FIXTURE)
  assert.equal(text, dataText(model))
  assert.ok(text.startsWith("import type { Art } from './types'\n"))
  assert.ok(text.includes('export const ART: Art = {\n'))
  assert.ok(text.includes('  base: {\n    top: 1,\n    rows: `\n..AAAA..\n.ABBBBA.\n'))
  assert.ok(text.includes('rows: ``'))
  for (const prose of ['see the script', 'half grey', 'carried nowhere', 'Words the converter']) assert.ok(!text.includes(prose), prose)
  assert.equal(converted(FIXTURE).text, text, 'the same art writes the same text')
})

// The fixture's manifest, reached into by the broken inputs below.
type Entry = Record<string, unknown>
const manifestOf = (f: Folder) => f.manifest as { sets: Record<string, { roles: Entry[] }>; recipes: Record<string, { frames: Entry[] }>; defaultSet: string }
const rolesOf = (f: Folder, set: string) => manifestOf(f).sets[set]?.roles ?? []
const oddCook = (f: Folder) => rolesOf(f, 'odd')[0] ?? {}
const restFrames = (f: Folder) => manifestOf(f).recipes.rest?.frames ?? []
const extraColours = Object.fromEntries([...'DEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno'].map((key, at) => [key, `#0000${(at + 16).toString(16)}`]))

// Each broken input, by what it changes, and the place and reason the converter names.
const BROKEN: [string, (folder: Folder) => void, RegExp][] = [
  ['too many colours', f => Object.assign(f.palette, extraColours), /palette\.json: holds 41 colours, over 40/],
  ['a key of two letters', f => Object.assign(f.palette, { AB: '#010101' }), /palette\.json AB: is not a single letter/],
  ['a dot as a key', f => Object.assign(f.palette, { '.': '#010101' }), /palette\.json \.: is not a single letter/],
  ['a colour by name', f => Object.assign(f.palette, { D: 'red' }), /palette\.json D: is not #rrggbb/],
  ['a colour twice', f => Object.assign(f.palette, { D: '#112233' }), /palette\.json D: repeats #112233/],
  ['a missing layer', f => delete f.layers['sets/plain/props/cook.png'], /sets\/plain\/props\/cook\.png: is missing/],
  ['a layer of the wrong size', f => Object.assign(f.layers, { 'base.png': ['....', '....'] }), /base\.png: is 4×2, not 8×8/],
  [
    'a colour outside the palette',
    f => Object.assign(f.layers, { 'sets/odd/props/cook.png': ['Z.......', ...Array(7).fill('........')] }),
    /sets\/odd\/props\/cook\.png \(0, 0\): is #808080, not in the palette/,
  ],
  ['a default set lacking a role', f => rolesOf(f, 'plain').splice(1), /manifest\.json sets\.plain: lacks cook/],
  ['a role not in roleNames', f => Object.assign(oddCook(f), { id: 'mime' }), /sets\.odd\.roles\[0\]\.id: "mime" is not in roleNames/],
  ['a role twice', f => rolesOf(f, 'odd').push(oddCook(f)), /sets\.odd\.roles\[1\]\.id: "cook" comes twice/],
  ['a fractional prop offset', f => Object.assign(oddCook(f), { propWorkDy: 0.5 }), /sets\.odd\.roles\[0\]\.propWorkDy: is not a whole number/],
  ['no costume', f => Object.assign(oddCook(f), { costume: '' }), /sets\.odd\.roles\[0\]\.costume: is not a word or phrase/],
  [
    'a body the converter does not know',
    f => restFrames(f).splice(0, 1, { body: 'spin' }),
    /recipes\.rest\.frames\[0\]\.body: "spin" is not none, bob or a flip/,
  ],
  [
    'a flip off the canvas',
    f => restFrames(f).splice(0, 1, { body: 'flip-vertical rows 1..8, then down 0' }),
    /recipes\.rest\.frames\[0\]\.body: flips rows off the canvas/,
  ],
  [
    'an extra with no layer',
    f => restFrames(f).splice(0, 1, { body: 'none', extra: 'extras/gone.png' }),
    /recipes\.rest\.frames\[0\]\.extra: names no layer in extras\//,
  ],
  [
    'a field the converter does not know',
    f => restFrames(f).splice(0, 1, { body: 'none', spin: 2 }),
    /recipes\.rest\.frames\[0\]\.spin: is not a field the converter knows/,
  ],
  [
    'a mark outside the palette',
    f => restFrames(f).splice(0, 1, { body: 'none', marks: { '#000000': [[1, 1]] } }),
    /recipes\.rest\.frames\[0\]\.marks #000000: is not in the palette/,
  ],
  [
    'a mark off the canvas',
    f => restFrames(f).splice(0, 1, { body: 'none', marks: { '#112233': [[8, 1]] } }),
    /recipes\.rest\.frames\[0\]\.marks #112233\[0\]: is not on the canvas/,
  ],
  [
    'marks in words with no leading word',
    f => restFrames(f).splice(0, 1, { body: 'none', marks: '3 red pixels' }),
    /recipes\.rest\.frames\[0\]\.marks: is described in words with no leading word/,
  ],
  ['a default set that is no set', f => Object.assign(f.manifest, { defaultSet: 'gone' }), /manifest\.json defaultSet: "gone" is not a set/],
]

test('each broken input is refused, naming its place and why', () => {
  for (const [what, breakIt, why] of BROKEN) {
    const folder = copy(FIXTURE)
    breakIt(folder)
    assert.throws(() => converted(folder), why, what)
  }
})

test('a partly transparent pixel is refused at its place', () => {
  const half = (dir: string) => {
    const pixels = new Uint8Array(8 * 8 * 4)
    pixels.set([0x11, 0x22, 0x33, 128], (2 * 8 + 3) * 4)
    writeFileSync(join(dir, 'sets/odd/props/cook.png'), encodePng({ width: 8, height: 8, pixels }))
  }
  assert.throws(() => converted(FIXTURE, half), /sets\/odd\/props\/cook\.png \(3, 2\): is partly transparent/)
})

test('the committed data.ts is exactly what the converter writes from art/', () => {
  assert.equal(readFileSync(DATA_FILE, 'utf8'), convert(ART_DIR).text, 'run node mods/possum-squad/tools/art.ts')
})

test('data.ts holds every layer the manifest names', () => {
  const manifest = JSON.parse(readFileSync(join(ART_DIR, 'manifest.json'), 'utf8')) as {
    sets: Record<string, { roles: { id: string; outfit: string; prop: string }[] }>
    recipes: Record<string, { frames: { extra?: string }[] }>
  }
  const { model } = convert(ART_DIR)
  const layout = (layer: { rows: string[] } | undefined) => layer?.rows.every(row => row.length === model.canvas.width) === true
  assert.ok(layout(model.base))
  let named = 1
  for (const [set, { roles }] of Object.entries(manifest.sets)) {
    for (const role of roles) {
      assert.ok(layout(model.sets[set]?.roles[role.id]?.outfit), role.outfit)
      assert.ok(layout(model.sets[set]?.roles[role.id]?.prop), role.prop)
      named += 2
    }
  }
  for (const { frames } of Object.values(manifest.recipes)) {
    for (const { extra } of frames) {
      if (extra === undefined) continue
      assert.ok(model.extras[extra.replace(/^extras\/|\.png$/g, '')] !== undefined, extra)
      named += 1
    }
  }
  assert.ok(named >= 1 + 4 * 34 + 3, `the manifest names ${named} layers`)
})
