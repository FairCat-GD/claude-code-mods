import { ANIMATION_STEP_MS } from '../config'
import { blank, type Dress, frameGrid, over } from './compose'
import { ART } from './data'
import { type Pose, STILL, stillFrame, workLoop } from './recipes'
import { loopSvg, stillSvg } from './svg'
import type { Art } from './types'

export type { Pose } from './recipes'

export type Look = { set: string; role?: string; pose: Pose; motion: 'auto' | 'off' }
// Its size in the art's pixels.
export type Sprite = { source: string; isAnimated: boolean; width: number; height: number }

// What the role wears in the set, or the default set's when the set lacks it; an unknown role is the plain opossum.
export function dressOf(art: Art, set: string, role: string | undefined): Dress | undefined {
  if (role === undefined) return undefined
  const pick = (id: string) => (art.sets[id]?.roles as Record<string, Dress | undefined> | undefined)?.[role]
  return pick(set) ?? pick(art.defaultSet)
}

// Only the work loop moves for now, and only with motion on.
export function drawSprite(art: Art, look: Look): Sprite {
  const pose: Pose = look.pose in STILL ? look.pose : 'idle'
  const dress = dressOf(art, look.set, look.role)
  const colourOf = (key: string) => art.palette[key] ?? '#000000'
  const still = frameGrid(art, dress, stillFrame(art, pose))
  const size = { width: art.canvas.width, height: art.canvas.height }
  if (look.motion === 'auto' && pose === 'working') {
    return { source: loopSvg(workLoop(art, dress), still, colourOf, ANIMATION_STEP_MS), isAnimated: true, ...size }
  }
  return { source: stillSvg(still, colourOf), isAnimated: false, ...size }
}

// Each look's sprite is written once: the strings stay the same between redraws, so a running loop is never restarted.
const cache = new Map<string, Sprite>()

export function sprite(look: Look): Sprite {
  const key = [look.set, look.role ?? '', look.pose, look.motion].join('|')
  const known = cache.get(key)
  if (known !== undefined) return known
  const drawn = drawSprite(ART, look)
  cache.set(key, drawn)
  return drawn
}

// The empty panel's squad: three plain opossums asleep, side by side.
export const SQUAD_SPACING = 24
let squadSprite: Sprite | undefined

export function drawSquad(art: Art): Sprite {
  const asleep = frameGrid(art, undefined, stillFrame(art, 'finished'))
  const { width, height } = art.canvas
  const grid = [0, 1, 2].reduce((all, at) => over(all, asleep, { x: at * SQUAD_SPACING, y: 0 }), blank(width + 2 * SQUAD_SPACING, height))
  return { source: stillSvg(grid, key => art.palette[key] ?? '#000000'), isAnimated: false, width: width + 2 * SQUAD_SPACING, height }
}

export function squad(): Sprite {
  squadSprite ??= drawSquad(ART)
  return squadSprite
}
