// The sprite converter: reads the art's source in `art/` and writes `hooks/sprites/data.ts`, which the engine loads.
// Usage, from anywhere: node mods/possum-squad/tools/art.ts
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { decodePng, type Image } from './png.ts'

export const ART_DIR = fileURLToPath(new URL('../art/', import.meta.url))
export const DATA_FILE = fileURLToPath(new URL('../hooks/sprites/data.ts', import.meta.url))

const MAX_COLOURS = 40
const NONE = '.'

// A layer: the band of its non-empty rows from `top`, each a string of palette keys.
export type Layer = { top: number; rows: string[] }
export type Flip = { top: number; bottom: number; down: number }
export type Frame = {
  body: 'none' | 'bob' | Flip
  eyes?: 'closed'
  extra?: string
  prop?: 'hidden'
  propDy?: number | 'propWorkDy'
  // By palette key, "x y" pairs; or the one word naming marks the manifest describes in words.
  marks?: Record<string, string> | string
}
export type Recipe = { frames: Frame[]; colour?: string }
export type Role = { costume: string; outfit: Layer; prop: Layer; propWorkDy: number }
export type Model = {
  canvas: { width: number; height: number }
  palette: Record<string, string>
  eyes: { pupils: string; closed: string }
  bob: { top: number; bottom: number; by: number }
  base: Layer
  extras: Record<string, Layer>
  recipes: Record<string, Recipe>
  sets: Record<string, { title: string; roles: Record<string, Role> }>
  defaultSet: string
}

type Json = unknown

function refuse(place: string, why: string): never {
  throw new Error(`${place}: ${why}`)
}

const isRecord = (value: Json): value is Record<string, Json> => typeof value === 'object' && value !== null && !Array.isArray(value)

function record(value: Json, place: string): Record<string, Json> {
  return isRecord(value) ? value : refuse(place, 'is not an object')
}

function text(value: Json, place: string): string {
  return typeof value === 'string' && value !== '' ? value : refuse(place, 'is not a word or phrase')
}

function integer(value: Json, place: string): number {
  return Number.isInteger(value) ? (value as number) : refuse(place, 'is not a whole number')
}

function pairs(value: Json, place: string, canvas: Model['canvas']): string {
  if (!Array.isArray(value) || value.length === 0) refuse(place, 'is not a list of points')
  return (value as Json[])
    .map((point, at) => {
      const [x, y] = Array.isArray(point) && point.length === 2 ? point : refuse(`${place}[${at}]`, 'is not an x, y point')
      const inside = (n: Json, size: number) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < size
      if (!inside(x, canvas.width) || !inside(y, canvas.height)) refuse(`${place}[${at}]`, 'is not on the canvas')
      return `${x} ${y}`
    })
    .join(', ')
}

// "tongue: 3 red pixels…" is carried as "tongue": the sprite module draws what the words describe.
function word(value: string, place: string): string {
  const first = value.split(':')[0]?.trim().toLowerCase() ?? ''
  return /^[a-z]+$/.test(first) ? first : refuse(place, 'is described in words with no leading word')
}

function readPalette(dir: string): Model['palette'] {
  const place = 'palette.json'
  const raw = record(JSON.parse(readFileSync(join(dir, place), 'utf8')), place)
  const entries = Object.entries(raw)
  if (entries.length > MAX_COLOURS) refuse(place, `holds ${entries.length} colours, over ${MAX_COLOURS}`)
  const palette: Model['palette'] = {}
  const seen = new Set<string>()
  for (const [key, value] of entries) {
    if (!/^[A-Za-z]$/.test(key)) refuse(`${place} ${key}`, 'is not a single letter')
    const hex = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : refuse(`${place} ${key}`, 'is not #rrggbb')
    if (seen.has(hex)) refuse(`${place} ${key}`, `repeats ${hex}`)
    seen.add(hex)
    palette[key] = hex
  }
  return palette
}

function readLayer(dir: string, path: string, palette: Model['palette'], size?: Model['canvas']): Layer {
  const file = join(dir, path)
  if (!existsSync(file)) refuse(path, 'is missing')
  const image: Image = decodePng(readFileSync(file), path)
  if (size !== undefined && (image.width !== size.width || image.height !== size.height)) {
    refuse(path, `is ${image.width}×${image.height}, not ${size.width}×${size.height}`)
  }
  const keys = new Map(Object.entries(palette).map(([key, hex]) => [hex, key]))
  const grid: string[] = []
  for (let y = 0; y < image.height; y++) {
    let line = ''
    for (let x = 0; x < image.width; x++) {
      const at = (y * image.width + x) * 4
      const [r, g, b, a] = image.pixels.subarray(at, at + 4)
      if (a === 0) {
        line += NONE
        continue
      }
      if (a !== 255) refuse(`${path} (${x}, ${y})`, 'is partly transparent')
      const hex = `#${[r, g, b].map(channel => (channel ?? 0).toString(16).padStart(2, '0')).join('')}`
      line += keys.get(hex) ?? refuse(`${path} (${x}, ${y})`, `is ${hex}, not in the palette`)
    }
    grid.push(line)
  }
  const drawn = grid.flatMap((line, y) => (/[^.]/.test(line) ? [y] : []))
  const top = drawn[0] ?? 0
  return { top, rows: drawn.length === 0 ? [] : grid.slice(top, (drawn[drawn.length - 1] ?? 0) + 1) }
}

function readFrame(value: Json, place: string, model: Pick<Model, 'canvas' | 'palette' | 'extras'>): Frame {
  const raw = record(value, place)
  const known = ['body', 'eyes', 'extra', 'prop', 'propDy', 'marks']
  for (const key of Object.keys(raw)) if (!known.includes(key)) refuse(`${place}.${key}`, 'is not a field the converter knows')
  const body = text(raw.body, `${place}.body`)
  const flip = /^flip-vertical rows (\d+)\.\.(\d+), then down (\d+)$/.exec(body)
  const frame: Frame = {
    body:
      body === 'none' || body === 'bob'
        ? body
        : flip !== null
          ? { top: Number(flip[1]), bottom: Number(flip[2]), down: Number(flip[3]) }
          : refuse(`${place}.body`, `"${body}" is not none, bob or a flip`),
  }
  if (typeof frame.body === 'object' && (frame.body.top > frame.body.bottom || frame.body.bottom >= model.canvas.height)) {
    refuse(`${place}.body`, 'flips rows off the canvas')
  }
  if (raw.eyes !== undefined) frame.eyes = raw.eyes === 'closed' ? 'closed' : refuse(`${place}.eyes`, 'is not closed')
  if (raw.extra !== undefined) {
    const extra = /^extras\/([a-z]+)\.png$/.exec(text(raw.extra, `${place}.extra`))?.[1]
    frame.extra = extra !== undefined && extra in model.extras ? extra : refuse(`${place}.extra`, `names no layer in extras/`)
  }
  if (raw.prop !== undefined) frame.prop = raw.prop === 'hidden' ? 'hidden' : refuse(`${place}.prop`, 'is not hidden')
  if (raw.propDy !== undefined) frame.propDy = raw.propDy === 'propWorkDy' ? 'propWorkDy' : integer(raw.propDy, `${place}.propDy`)
  if (typeof raw.marks === 'string') frame.marks = word(raw.marks, `${place}.marks`)
  else if (raw.marks !== undefined) {
    const keys = new Map(Object.entries(model.palette).map(([key, hex]) => [hex, key]))
    const marks: Record<string, string> = {}
    for (const [hex, points] of Object.entries(record(raw.marks, `${place}.marks`))) {
      const key = keys.get(hex.toLowerCase()) ?? refuse(`${place}.marks ${hex}`, 'is not in the palette')
      marks[key] = pairs(points, `${place}.marks ${hex}`, model.canvas)
    }
    frame.marks = marks
  }
  return frame
}

export function readArt(dir: string): Model {
  const place = 'manifest.json'
  const manifest = record(JSON.parse(readFileSync(join(dir, place), 'utf8')), place)
  const palette = readPalette(dir)
  const [width, height] = Array.isArray(manifest.canvas) ? manifest.canvas : refuse(`${place} canvas`, 'is not a width and height')
  const canvas = { width: integer(width, `${place} canvas`), height: integer(height, `${place} canvas`) }

  const eyes = record(manifest.eyes, `${place} eyes`)
  const closedHex = text(eyes.closedColour, `${place} eyes.closedColour`).toLowerCase()
  const closed = Object.entries(palette).find(([, hex]) => hex === closedHex)?.[0] ?? refuse(`${place} eyes.closedColour`, 'is not in the palette')
  const bob = record(manifest.bob, `${place} bob`)
  const [bobTop, bobBottom] = Array.isArray(bob.shiftDownRows) ? bob.shiftDownRows : refuse(`${place} bob.shiftDownRows`, 'is not two rows')

  const extrasDir = join(dir, 'extras')
  const extras: Model['extras'] = {}
  for (const file of readdirSync(extrasDir)
    .filter(name => name.endsWith('.png'))
    .sort()) {
    const id = /^([a-z]+)\.png$/.exec(file)?.[1] ?? refuse(`extras/${file}`, 'is not named in lowercase letters')
    extras[id] = readLayer(dir, `extras/${file}`, palette)
  }

  const recipes: Model['recipes'] = {}
  for (const [name, value] of Object.entries(record(manifest.recipes, `${place} recipes`))) {
    const recipe = record(value, `${place} recipes.${name}`)
    for (const key of Object.keys(recipe)) {
      if (!['frames', 'colour', 'note'].includes(key)) refuse(`${place} recipes.${name}.${key}`, 'is not a field the converter knows')
    }
    const frames = Array.isArray(recipe.frames) && recipe.frames.length > 0 ? recipe.frames : refuse(`${place} recipes.${name}.frames`, 'is empty')
    const read: Recipe = { frames: frames.map((frame, at) => readFrame(frame, `${place} recipes.${name}.frames[${at}]`, { canvas, palette, extras })) }
    if (recipe.colour !== undefined) read.colour = word(text(recipe.colour, `${place} recipes.${name}.colour`), `${place} recipes.${name}.colour`)
    recipes[name] = read
  }

  const roster = Object.keys(record(manifest.roleNames, `${place} roleNames`))
  const defaultSet = text(manifest.defaultSet, `${place} defaultSet`)
  const sets: Model['sets'] = {}
  for (const [id, value] of Object.entries(record(manifest.sets, `${place} sets`))) {
    const set = record(value, `${place} sets.${id}`)
    const given = new Map<string, Role>()
    const roles = Array.isArray(set.roles) ? set.roles : refuse(`${place} sets.${id}.roles`, 'is not a list')
    for (const [at, entry] of roles.entries()) {
      const rolePlace = `${place} sets.${id}.roles[${at}]`
      const role = record(entry, rolePlace)
      const roleId = text(role.id, `${rolePlace}.id`)
      if (!roster.includes(roleId)) refuse(`${rolePlace}.id`, `"${roleId}" is not in roleNames`)
      if (given.has(roleId)) refuse(`${rolePlace}.id`, `"${roleId}" comes twice`)
      given.set(roleId, {
        costume: text(role.costume, `${rolePlace}.costume`),
        outfit: readLayer(dir, text(role.outfit, `${rolePlace}.outfit`), palette, canvas),
        prop: readLayer(dir, text(role.prop, `${rolePlace}.prop`), palette, canvas),
        propWorkDy: integer(role.propWorkDy, `${rolePlace}.propWorkDy`),
      })
    }
    // A role another set lacks falls back to the default set's, so only the default set must be whole.
    const missing = roster.filter(role => !given.has(role))
    if (id === defaultSet && missing.length > 0) refuse(`${place} sets.${id}`, `lacks ${missing.join(', ')}`)
    sets[id] = {
      title: text(set.title, `${place} sets.${id}.title`),
      roles: Object.fromEntries(roster.flatMap(role => (given.has(role) ? [[role, given.get(role) as Role]] : []))),
    }
  }
  if (!(defaultSet in sets)) refuse(`${place} defaultSet`, `"${defaultSet}" is not a set`)

  return {
    canvas,
    palette,
    eyes: { pupils: pairs(eyes.pupilTopRow, `${place} eyes.pupilTopRow`, canvas), closed },
    bob: {
      top: integer(bobTop, `${place} bob.shiftDownRows`),
      bottom: integer(bobBottom, `${place} bob.shiftDownRows`),
      by: integer(bob.by, `${place} bob.by`),
    },
    base: readLayer(dir, 'base.png', palette, canvas),
    extras,
    recipes,
    sets,
    defaultSet,
  }
}

// The text is in Biome's own shape, with nothing its line width decides: every object is expanded, and a layer's rows
// are a template literal, one row a line.
const quote = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const key = (name: string) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : quote(name))

function emit(value: unknown, indent: string): string {
  if (typeof value === 'string') return quote(value)
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return `[\n${value.map(item => `${indent}  ${emit(item, `${indent}  `)},\n`).join('')}${indent}]`
  const object = value as Record<string, unknown>
  if ('rows' in object && Array.isArray(object.rows)) {
    const rows = object.rows as string[]
    return `{\n${indent}  top: ${object.top},\n${indent}  rows: \`${rows.map(row => `\n${row}`).join('')}\`,\n${indent}}`
  }
  const fields = Object.entries(object).filter(([, field]) => field !== undefined)
  return `{\n${fields.map(([name, field]) => `${indent}  ${key(name)}: ${emit(field, `${indent}  `)},\n`).join('')}${indent}}`
}

export function dataText(model: Model): string {
  return [
    "import type { Art } from './types'",
    '',
    '// Generated by tools/art.ts from art/: change the art and run it again rather than editing this file.',
    `export const ART: Art = ${emit(model, '')}`,
    '',
  ].join('\n')
}

export const convert = (dir: string) => {
  const model = readArt(dir)
  return { model, text: dataText(model) }
}

if (import.meta.main) {
  const { model, text } = convert(ART_DIR)
  writeFileSync(DATA_FILE, text)
  const roles = Object.values(model.sets).reduce((sum, set) => sum + Object.keys(set.roles).length, 0)
  console.log(`hooks/sprites/data.ts: ${Object.keys(model.sets).length} sets, ${roles} roles, ${Object.keys(model.extras).length} extras`)
}
