// T-13: the columns the pane asks for while docked.
export const PANE_COLUMNS = 46

// T-06: the finished, failed and stopped runs kept.
export const FINISHED_KEPT = 30

// T-03: the reads and searches, with nothing decisive, that settle a role as Scout.
export const WEAK_CALLS_FOR_SCOUT = 6

// T-04: the time from a run's start after which a role no rule settled is Helper.
export const ROLE_SETTLES_MS = 60_000

// T-01: one frame of a sprite's loop.
export const ANIMATION_STEP_MS = 200

// A sprite's one-off is drawn while its moment is this much past its own length, one beat of the clock: the first
// drawing after the moment plays it whole, and the next one past it draws where it ends.
export const MOMENT_GRACE_MS = 1000

// T-02: a sprite's pixel drawn this many CSS pixels wide.
export const SPRITE_SCALE = 2
