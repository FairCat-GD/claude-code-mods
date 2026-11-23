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

// The desktop refuses a pane's tree past 262,144 characters or 2,000 nodes, so the gallery is drawn a few roles at
// a time: three roles in their eight poses come to at most about 180k characters of sprites.
export const GALLERY_ROLES_PER_PART = 3

// The sprites' sources a pane spends, the Lead's included: past it, rows draw still, then their state's mark.
export const SPRITE_BUDGET = 160_000

// The room above the budget a row's one-off may take: an arrival, a hop or an ending is larger than the look it ends on.
export const MOMENT_ROOM = 20_000

// The rows a pane draws, about 28 nodes each with the bar drawn as boxes and text; the rest are counted in a line under
// their section.
export const ROWS_DRAWN = 60

// A row's description is drawn cut to this many characters: one line shows far fewer.
export const DESCRIPTION_CHARS = 100
