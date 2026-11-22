import type { RoleId } from '../../types/index'

// A layer: the band of its non-empty rows from `top`, one row a line of palette keys, `.` for none.
export type Layer = { top: number; rows: string }

// Upside down: rows top..bottom reversed, then moved down.
export type Flip = { top: number; bottom: number; down: number }

export type RecipeFrame = {
  body: 'none' | 'bob' | Flip
  eyes?: 'closed'
  extra?: string
  prop?: 'hidden'
  propDy?: number | 'propWorkDy'
  // "x y, x y" by palette key; or the one word for marks the art gives in words, which `recipes.ts` draws.
  marks?: Readonly<Record<string, string>> | string
}

// `colour` is the one word for a colouring the art gives in words.
export type Recipe = { frames: readonly RecipeFrame[]; colour?: string }

export type ArtRole = { costume: string; outfit: Layer; prop: Layer; propWorkDy: number }

// A role a set lacks falls back to the default set's.
export type ArtSet = { title: string; roles: Partial<Record<RoleId, ArtRole>> }

export type Art = {
  canvas: { width: number; height: number }
  palette: Readonly<Record<string, string>>
  // The pupils' top row, repainted with `closed` to close the eyes.
  eyes: { pupils: string; closed: string }
  // Rows top..bottom move down `by`; the rows below stay.
  bob: { top: number; bottom: number; by: number }
  base: Layer
  extras: Readonly<Record<string, Layer>>
  recipes: Readonly<Record<string, Recipe>>
  sets: Readonly<Record<string, ArtSet>>
  defaultSet: string
}
