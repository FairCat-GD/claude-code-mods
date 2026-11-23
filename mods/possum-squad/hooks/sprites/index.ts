import type { RoleId } from '../../types/index'
import { ANIMATION_STEP_MS } from '../config'
import { blank, type Dress, frameGrid, over } from './compose'
import { ART } from './data'
import { COLOURINGS, type Pose, STILL, stillFrame, workLoop } from './recipes'
import { greyed, loopSvg, stillSvg } from './svg'
import type { Art, ArtRole } from './types'

export type { Pose } from './recipes'

export type Look = { set: string; role?: string; pose: Pose; motion: 'auto' | 'off' }
// Its size in the art's pixels.
export type Sprite = { source: string; isAnimated: boolean; width: number; height: number }

// A value's own key only: a stored id such as "constructor" must not find what every object inherits.
const own = <T>(record: Readonly<Record<string, T>> | undefined, key: string): T | undefined =>
  record !== undefined && Object.hasOwn(record, key) ? record[key] : undefined

// The role as the set draws it, or as the default set does when the set lacks it.
function artRoleOf(art: Art, set: string, role: string): ArtRole | undefined {
  const pick = (id: string) => own<ArtRole>(own(art.sets, id)?.roles as Record<string, ArtRole> | undefined, role)
  return pick(set) ?? pick(art.defaultSet)
}

// What the role wears in the set; an unknown role is the plain opossum.
export function dressOf(art: Art, set: string, role: string | undefined): Dress | undefined {
  return role === undefined ? undefined : artRoleOf(art, set, role)
}

// The role's costume name in the set, falling back with its outfit.
export const costumeOf = (art: Art, set: string, role: string): string | undefined => artRoleOf(art, set, role)?.costume

// The gallery's set: its title, and every role the default set dresses, in its order, with its costume here.
export type Gallery = { title: string; roles: readonly { id: RoleId; costume: string }[] }

export function galleryOf(art: Art, set: string): Gallery {
  const shown = own(art.sets, set) ?? own(art.sets, art.defaultSet)
  const ids = Object.keys(own(art.sets, art.defaultSet)?.roles ?? {}) as RoleId[]
  return { title: shown?.title ?? set, roles: ids.map(id => ({ id, costume: costumeOf(art, set, id) ?? '' })) }
}

// The work loop is the one animation; every other pose, and every pose with motion off, is still. A pose whose recipe
// colours it in words is drawn so, faded by its opacity.
export function drawSprite(art: Art, look: Look): Sprite {
  const pose: Pose = own(STILL, look.pose) === undefined ? 'idle' : look.pose
  const dress = dressOf(art, look.set, look.role)
  const colourOf = (key: string) => art.palette[key] ?? '#000000'
  const still = frameGrid(art, dress, stillFrame(art, pose))
  const size = { width: art.canvas.width, height: art.canvas.height }
  const word = own(art.recipes, STILL[pose])?.colour
  const colouring = word === undefined ? undefined : own(COLOURINGS, word)
  if (colouring !== undefined) {
    const opacity = Math.round((1 - colouring.fade) * 100) / 100
    return { source: stillSvg(still, key => greyed(colourOf(key), colouring.grey), opacity), isAnimated: false, ...size }
  }
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
