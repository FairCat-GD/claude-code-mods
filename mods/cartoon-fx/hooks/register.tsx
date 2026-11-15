import { atom, read, update } from 'claude-code'
import type { BoxProps, BuiltinToolInputs, ElementConstructor, EngineInterface, Register, RenderElement, RenderSurface, SvgProps, Timer } from 'claude-code'

import type { FxKind, Placement, Shown, Size } from '../types'
import { cherryPicked, committed, isReviewFix, mergesOf, prOpened, pushedBranch, ranAt, rebasedWith, testsPassed, tokens } from './detect'
import { drawFx, FX_MS, glyphRow, pixelsOf } from './fx'
import type { Spark } from './fx'
import { RED, RED_RESET, RESET, YELLOW } from './zones'

const shown = atom({ plugin: 'cartoon-fx', key: 'shown' } as const, null)
const isYellow = atom({ plugin: 'cartoon-fx', key: 'isYellow' } as const, false)
const isRed = atom({ plugin: 'cartoon-fx', key: 'isRed' } as const, false)
const placement = atom({ plugin: 'cartoon-fx', key: 'placement' } as const, 'conversation')

// Subagents started this close together play as one effect, with their count.
const GATHER_MS = 400

// Kept on show this long past the drawing's end, so a surface that mounts it
// late still shows the whole thing.
const HOLD_MS = 600

// A row that has not drawn its effect this soon (a group folded away, a row
// scrolled off, a reply row no longer on screen) hands it to the strip.
const FALLBACK_MS = 900

// Between one effect and the next, so each mounts a fresh drawing.
const GAP_MS = 300

// The terminal's row steps a frame this often while its effect is on show.
const FRAME_MS = 250

// At most this many real moments wait behind the one on show; another is dropped.
const MAX_WAITING = 3

// A real moment whose turn comes later than this after it happened is dropped.
const WAIT_MS = 12_000

// What `/fx` replays, in this order for `/fx all`: title, subtitle, value.
const SAMPLES: [FxKind, string, string, number][] = [
  ['plan', 'Action!', "let's build!", 0],
  ['commit', 'SAVED', '5e81772', 0],
  ['cherry', 'Cherry picked!', '1a2b3c4', 0],
  ['rebase', 'Rebased!', 'topic onto main', 0],
  ['push', 'Pushed!', 'main', 0],
  ['pr', 'PR opened!', '#42', 0],
  ['merge', 'Merged!', 'feature/login', 0],
  ['tests', 'All green!', '42 passed', 0],
  ['review', 'Reviewed!', '3 findings', 3],
  ['fixes', 'Bugs squashed!', '3 review defects fixed', 3],
  ['compact', 'Squished!', '142k → 18k tokens', 0],
  ['helpers', '×3 helpers!', '', 3],
  ['context', 'Yellow zone!', 'context 76% full', 76],
  ['redzone', 'Red zone!', 'context 92% full', 92],
]

const short = (text: string) => (text.length > 34 ? `${text.slice(0, 33)}…` : text)

const wordsOf = (effect: Shown) => (effect.subtitle ? `${effect.title} ${effect.subtitle}` : effect.title)

// The effect's drawing, built once per effect: rows and the strip re-render on
// every scroll, and the confetti alone is some 50,000 characters. An effect
// keeps the size it was played at, so one id never stands for two sizes.
let lastDrawing: { id: number; source: string } | undefined
const svgOf = (effect: Shown) => {
  if (lastDrawing?.id !== effect.id) {
    lastDrawing = { id: effect.id, source: drawFx(effect.kind, effect.seed, effect.title, effect.subtitle, effect.value, effect.size) }
  }

  return { source: lastDrawing.source, alt: wordsOf(effect) }
}

type Table = { Box: ElementConstructor<BoxProps>; Svg: ElementConstructor<SvgProps> }

// A conversation row as the app draws it, with the effect playing beneath it.
const underRow = ({ Box, Svg }: Table, own: RenderElement, effect: Shown) => (
  <Box flexDirection="column">
    {own}
    <Box justifyContent="center">
      <Svg {...svgOf(effect)} isInteractive />
    </Box>
  </Box>
)

// An effect is drawn inside the conversation row of what set it off: a tool
// call's row (`tool:<id>`), `/fx`'s own output row (`fx:(take N)`), or a
// reply's text (`reply:<its text>`).
const toolRow = (id: string) => `tool:${id}`
const fxRow = (tag: string) => `fx:${tag}`
const replyRow = (text: string) => `reply:${text.trim()}`

// A main-conversation call's row; a subagent's calls have no row the main
// transcript shows, so their effects play in the strip straight away.
const rowOf = (e: { tool_use_id: string; agentId?: string }) => (e.agentId === undefined ? toolRow(e.tool_use_id) : undefined)

// The desktop swaps these calls' rows for cards of its own, which draw no hook's tree.
const OWN_CARDS = new Set(['ReportFindings'])

// The row just before call `id`'s card: the call or the reply text it follows,
// walking back past thinking and results, and stopping at the person's prompt.
async function rowBefore($: EngineInterface, id: string): Promise<string | undefined> {
  const messages = await $.session.messages()
  const at = messages.findIndex(message => message.toolUses.some(use => use.tool_use_id === id))
  for (const message of messages.slice(0, at + 1).reverse()) {
    if (message.role === 'user' && (message.toolResults?.length ?? 0) === 0) {
      return undefined
    }
    const uses = message.toolUses.slice(0, message === messages[at] ? message.toolUses.findIndex(use => use.tool_use_id === id) : undefined)
    const call = uses.filter(use => !OWN_CARDS.has(use.tool)).at(-1)
    if (call !== undefined) {
      return toolRow(call.tool_use_id)
    }
    if (message.role === 'assistant' && message.text.trim() !== '') {
      return replyRow(message.text)
    }
  }

  return undefined
}

// Drops the oldest entries of a Set or Map, which keep insertion order, past `cap`.
const bound = (kept: Set<string> | Map<string, unknown>, cap: number) => {
  for (const oldest of kept.keys()) {
    if (kept.size <= cap) break
    kept.delete(oldest)
  }
}

// The effect on show, once a row or the strip drew it where the viewport shows
// it. Each effect must be drawn itself: a row that drew the one before may be gone.
let drawnId: number | undefined

// The strip above the prompt as it last drew: whether the person collapsed it.
let strip: { isCollapsed: boolean; surface?: RenderSurface } = { isCollapsed: false }

// Each reply row's text and its place in the order rows first drew, so an
// older reply with the same words never takes the effect.
let repliesSeen = 0
const replies = new Map<string, { row: string; order: number }>()
const noteReply = (requestId: string, row: string) => {
  const order = replies.get(requestId)?.order ?? ++repliesSeen
  replies.set(requestId, { row, order })
  bound(replies, 500)

  return order
}
const isNewestReply = (row: string, order: number) => [...replies.values()].every(reply => reply.row !== row || reply.order <= order)
const noteDrawn = (effect: Shown, onScreen: unknown) => {
  if (onScreen !== null) drawnId = effect.id
}

// Takes up the placement `/fx place` last stored, in this session or another.
async function syncPlacement($: EngineInterface) {
  const kept = await $.store.get('placement')
  if ((kept === 'conversation' || kept === 'bottom') && kept !== (await read($, placement))) {
    await update($, placement, () => kept)
  }
}

// `/fx off` as stored, in this session or another; anything but `true` is on.
const isMuted = async ($: EngineInterface) => (await $.store.get('isMuted')) === true

// The size `/fx size` last stored, in this session or another; `medium` if none is.
async function sizeOf($: EngineInterface): Promise<Size> {
  const kept = await $.store.get('size')

  return kept === 'small' || kept === 'medium' || kept === 'large' ? kept : 'medium'
}

// `/fx size <wanted>`: stores a size, or with none names the one in use.
async function resize($: EngineInterface, wanted: string) {
  const sizeWords = (size: Size) => `${size} (${pixelsOf(size).join(' × ')})`
  if (wanted === '') {
    return `cartoon-fx: animations play ${sizeWords(await sizeOf($))}. Try: size small, medium or large.`
  }
  if (wanted !== 'small' && wanted !== 'medium' && wanted !== 'large') {
    return `cartoon-fx has no size "${wanted}". Try: small, medium or large.`
  }
  await $.store.set('size', wanted)

  return `cartoon-fx: animations play ${sizeWords(wanted)}, from the next one.`
}

// An effect waiting its turn. `/fx`'s samples (`isReplay`) wait past the cap and the limit.
type Waiting = Omit<Shown, 'seed' | 'until' | 'frame'> & { queuedAt: number; isReplay: boolean }

// The queue, in module memory: it lives and dies with the timers that move it.
// `isBusy` holds from an effect's start through the gap after it. `era` counts
// resets, so a timer set before one does nothing after it.
let effects = 0
let line: Waiting[] = []
let onShow: { id: number; end: Timer; frame?: Timer } | undefined
let isBusy = false
let era = 0

// A fault in the queue empties it, so the next effect still plays.
const reset = () => {
  line = []
  onShow = undefined
  isBusy = false
  era++
}

// Runs `step` after `ms`, unless the queue was reset meanwhile.
const later = ($: EngineInterface, ms: number, step: () => Promise<void>) => {
  const at = era
  return $.clock.after(ms, () => {
    if (era === at) void step().catch(reset)
  })
}

const lasting = (kind: FxKind) => FX_MS[kind] + HOLD_MS

const shownAs = (effect: Waiting | Shown, seed: number, until: number, row: string | undefined): Shown => ({
  id: effect.id,
  kind: effect.kind,
  seed,
  title: effect.title,
  subtitle: effect.subtitle,
  value: effect.value,
  until,
  size: effect.size,
  ...(row === undefined ? {} : { row }),
})

// Plays an effect now, or queues it behind the one on show, unless `/fx off`
// muted them. Never waits on the queue.
async function play($: EngineInterface, kind: FxKind, title: string, subtitle = '', value = 0, row?: string) {
  if (await isMuted($)) {
    return
  }
  await syncPlacement($)
  await enter($, await $.clock.now(), kind, title, subtitle, value, await sizeOf($), row, false)
}

// `play`'s second half, for a placement taken up and a time and size read already.
async function enter(
  $: EngineInterface,
  now: number,
  kind: FxKind,
  title: string,
  subtitle: string,
  value: number,
  size: Size,
  row: string | undefined,
  isReplay: boolean,
) {
  const effect: Waiting = { id: ++effects, kind, title, subtitle, value, size, queuedAt: now, isReplay, ...(row === undefined ? {} : { row }) }
  if (!isBusy) {
    isBusy = true
    await start($, effect, now).catch(error => {
      reset()
      throw error
    })
  } else if (isReplay) {
    line.push(effect)
  } else if (line.filter(waiting => !waiting.isReplay).length < MAX_WAITING) {
    // A real moment goes ahead of `/fx`'s samples.
    const at = line.findIndex(waiting => waiting.isReplay)
    line.splice(at < 0 ? line.length : at, 0, effect)
  }
}

// Whether an effect for `row` draws in the strip: no row, `/fx place bottom`, or the terminal.
const inStrip = async ($: EngineInterface, row: string | undefined) =>
  row === undefined || strip.surface === 'terminal' || (await read($, placement)) !== 'conversation'

// Puts `effect` on show, unless it would play in a collapsed strip, where nobody sees it.
async function start($: EngineInterface, effect: Waiting, now: number) {
  if (strip.isCollapsed && (await inStrip($, effect.row))) {
    await advance($)
    return
  }
  const lasts = lasting(effect.kind)
  await show($, shownAs(effect, now, now + lasts, effect.row), lasts)
}

// Sets `effect` on show for `lasts`, with the move to the strip for a row, and
// the terminal row's frames where the strip is on the terminal.
async function show($: EngineInterface, effect: Shown, lasts: number) {
  onShow?.end.cancel()
  onShow?.frame?.cancel()
  const end = later($, lasts, () => ended($, effect.id))
  onShow = { id: effect.id, end }
  if (strip.surface === 'terminal') {
    onShow.frame = later($, FRAME_MS, () => nextFrame($, effect.id))
  }
  await update($, shown, () => effect)
  if (effect.row !== undefined) {
    later($, FALLBACK_MS, () => toStripUnlessDrawn($, effect))
  }
}

// Steps the terminal's row of effect `id` a frame, while it is on show.
async function nextFrame($: EngineInterface, id: number) {
  if (onShow?.id !== id) {
    return
  }
  onShow.frame = later($, FRAME_MS, () => nextFrame($, id))
  await update($, shown, s => (s?.id === id ? { ...s, frame: (s.frame ?? 0) + 1 } : s))
}

// Ends effect `id` if it is still on show, and starts the next after the gap.
async function ended($: EngineInterface, id: number) {
  if (onShow?.id !== id) {
    return
  }
  onShow = undefined
  await update($, shown, s => (s?.id === id ? null : s))
  later($, GAP_MS, () => advance($))
}

// Starts the next effect waiting, past real moments that waited too long.
async function advance($: EngineInterface) {
  const now = await $.clock.now()
  let next = line.shift()
  while (next !== undefined && !next.isReplay && now - next.queuedAt > WAIT_MS) {
    next = line.shift()
  }
  if (next === undefined) {
    isBusy = false
    return
  }
  await start($, next, now)
}

// Moves `effect` to the strip when its row never drew it, keeping its place in line.
async function toStripUnlessDrawn($: EngineInterface, effect: Shown) {
  if (onShow?.id !== effect.id || drawnId === effect.id || (await read($, placement)) !== 'conversation') {
    return
  }
  if (strip.isCollapsed) {
    await ended($, effect.id)
    return
  }
  // The same drawing, whole, from now, if it did not end meanwhile.
  const now = await $.clock.now()
  if (onShow?.id !== effect.id) {
    return
  }
  const lasts = lasting(effect.kind)
  await show($, shownAs(effect, effect.seed, now + lasts, undefined), lasts)
}

// The effect still running, or null.
async function running($: EngineInterface): Promise<Shown | null> {
  const effect = await read($, shown)

  return effect !== null && (await $.clock.now()) <= effect.until ? effect : null
}

// The effect to draw inside the row `row`, when the conversation is where effects play.
async function playingIn($: EngineInterface, row: string): Promise<Shown | null> {
  const effect = await running($)
  if (effect === null || effect.row !== row) {
    return null
  }

  return (await read($, placement)) === 'conversation' ? effect : null
}

type Findings = BuiltinToolInputs['ReportFindings']['findings']

// `/code-review` reports its findings in one call when it finishes, and again,
// each with an outcome, once it has applied fixes.
async function reviewReported($: EngineInterface, findings: Findings, row?: string) {
  if (findings.some(finding => finding.outcome !== undefined)) {
    const fixed = findings.filter(finding => finding.outcome === 'fixed').length
    if (fixed > 0) {
      await play($, 'fixes', 'Bugs squashed!', `${fixed} review ${fixed === 1 ? 'defect' : 'defects'} fixed`, fixed, row)
    }
    return
  }
  const count = findings.length
  const found = count === 0 ? 'no findings, all clear' : `${count} ${count === 1 ? 'finding' : 'findings'}`
  await play($, 'review', 'Reviewed!', found, count, row)
}

async function watchContext($: EngineInterface, row?: string) {
  const { percent } = (await $.session.usage()).context
  if (percent === undefined) {
    return
  }
  if (percent >= RED) {
    let hasCrossed = false
    await update($, isRed, was => {
      hasCrossed = !was
      return true
    })
    // Straight past the yellow into the red plays the red alone.
    if (!(await read($, isYellow))) {
      await update($, isYellow, () => true)
    }
    if (hasCrossed) {
      await play($, 'redzone', 'Red zone!', `context ${percent}% full`, percent, row)
    }
    return
  }
  if (percent < RED_RESET && (await read($, isRed))) {
    await update($, isRed, () => false)
  }
  if (percent >= YELLOW) {
    let hasCrossed = false
    await update($, isYellow, was => {
      hasCrossed = !was
      return true
    })
    if (hasCrossed) {
      await play($, 'context', 'Yellow zone!', `context ${percent}% full`, percent, row)
    }
  } else if (percent < RESET && (await read($, isYellow))) {
    await update($, isYellow, () => false)
  }
}

export const register: Register = on => {
  let spawned: string[] = []
  let spawnRow: string | undefined

  // A reload drops the timers that would end an effect and move the queue, so start with none.
  on('session.start', async ($, e, next) => {
    reset()
    drawnId = undefined
    strip = { isCollapsed: false, ...(e.surface === null ? {} : { surface: e.surface }) }
    await update($, shown, () => null)
    await syncPlacement($)
    await $.command.register({
      name: 'fx',
      description:
        'Replay a cartoon-fx animation (plan, commit, cherry, rebase, push, pr, merge, tests, review, fixes, compact, helpers, context, redzone, all), turn them off or on, size them (size small, medium, large) or move them (place conversation, place bottom)',
      argumentHint: '[name|all|off|on|size small|medium|large|place conversation|place bottom]',
      immediate: true,
    })

    return next(e)
  })

  // Every finished call: a code review's report, and the context window it may have grown.
  // The context check runs beside the result rather than before it, so no
  // call's result waits on it. Registered first, so it is outermost: a call's own
  // effect is queued before the context check its result may set off.
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    const row = rowOf(e)
    if (e.tool === 'ReportFindings' && ran.deny === undefined && ran.isError !== true) {
      // Its card shows no effect, so the review plays in the row just before it.
      const before = row === undefined ? undefined : await rowBefore($, e.tool_use_id).catch(() => undefined)
      await reviewReported($, e.findings, before ?? row)
    }
    void watchContext($, row).catch(() => undefined)

    return ran
  }).catch((_$, e, next) => next(e))

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) {
      return ran
    }

    // One command may test, commit, cherry-pick, rebase, push, open a pull request and merge:
    // each plays, in the order it ran them.
    const row = rowOf(e)
    const at = ranAt(e.command)
    const branch = pushedBranch(e.command, ran.result)
    const commit = committed(e.command, ran.result)
    const passed = testsPassed(e.command, ran.result)
    const picked = cherryPicked(e.command, ran.result)
    const rebased = rebasedWith(e.command, ran.result)
    const opened = prOpened(e.command, ran.result)
    const moments: { at: number | undefined; play: () => Promise<void> }[] = []
    if (passed !== undefined) {
      moments.push({ at: at.tests, play: () => play($, 'tests', 'All green!', passed, 0, row) })
    }
    if (commit !== undefined) {
      const isFix = isReviewFix(commit.subject)
      moments.push({
        at: at.commit,
        play: () =>
          isFix
            ? play($, 'fixes', 'Bugs squashed!', `review fixes · ${commit.sha}`, 0, row)
            : play($, 'commit', commit.isAmend ? 'AMENDED' : 'SAVED', commit.sha, 0, row),
      })
    }
    if (picked !== undefined) {
      moments.push({ at: at.cherry, play: () => play($, 'cherry', 'Cherry picked!', picked, 0, row) })
    }
    if (rebased !== undefined) {
      moments.push({ at: at.rebase, play: () => play($, 'rebase', 'Rebased!', rebased, 0, row) })
    }
    if (branch !== undefined) {
      moments.push({ at: at.push, play: () => play($, 'push', 'Pushed!', branch, 0, row) })
    }
    if (opened !== undefined) {
      moments.push({ at: at.opened, play: () => play($, 'pr', 'PR opened!', opened, 0, row) })
    }
    for (const { by, words } of mergesOf(e.command, ran.result)) {
      moments.push({ at: at[by], play: () => play($, 'merge', 'Merged!', words, 0, row) })
    }
    // One the engine reported with no part of its own (an alias) comes after, as listed.
    const order = (moment: { at: number | undefined }) => moment.at ?? Number.MAX_SAFE_INTEGER
    for (const moment of moments.sort((a, b) => order(a) - order(b))) {
      await moment.play()
    }

    return ran
  }).catch((_$, e, next) => next(e)) // an effect's fault never costs the call its result

  // A plan the person accepted; one they turned down comes back as an error,
  // and a teammate's still waits on its lead.
  on('tool.call', { tool: 'ExitPlanMode' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) {
      return ran
    }
    const waits = (ran.result as { awaitingLeaderApproval?: boolean } | undefined)?.awaitingLeaderApproval === true
    if (!waits) {
      await play($, 'plan', 'Action!', "let's build!", 0, rowOf(e))
    }

    return ran
  }).catch((_$, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    void watchContext($).catch(() => undefined)

    return done
  })

  on('session.compact', async ($, e, next) => {
    const done = await next(e)
    if (e.trigger !== 'precompute' && e.agentId === undefined && done.messages !== undefined) {
      const { tokensBefore: before, tokensAfter: after } = done
      const saved = before !== undefined && after !== undefined ? `${tokens(before)} → ${tokens(after)} tokens` : 'context compacted'
      await play($, 'compact', 'Squished!', saved)
    }

    return done
  }).catch((_$, e, next) => next(e))

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny === undefined) {
      spawned.push(e.description)
      if (spawned.length === 1) {
        spawnRow = e.tool_use_id && e.parentAgentId === undefined ? toolRow(e.tool_use_id) : undefined
        $.clock.after(GATHER_MS, () => {
          const crew = spawned
          spawned = []
          const title = crew.length === 1 ? 'Helper out!' : `×${crew.length} helpers!`
          void play($, 'helpers', title, crew.length === 1 ? short(crew[0] ?? '') : '', crew.length, spawnRow)
        })
      }
    }

    return started
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: 'fx' }, async ($, e) => {
    const wanted = e.args.trim().toLowerCase().replace(/\s+/g, ' ') || 'all'
    if (wanted === 'place conversation' || wanted === 'place middle' || wanted === 'place bottom') {
      const where: Placement = wanted === 'place bottom' ? 'bottom' : 'conversation'
      await update($, placement, () => where)
      await $.store.set('placement', where)

      return {
        text:
          where === 'conversation'
            ? 'cartoon-fx: animations play in the conversation, under what set them off.'
            : 'cartoon-fx: animations play above the prompt box.',
      }
    }
    if (wanted === 'off' || wanted === 'on') {
      await $.store.set('isMuted', wanted === 'off')
      if (wanted === 'on') {
        return { text: 'cartoon-fx: animations are on.' }
      }
      // Muting empties the queue: the effect on show stops, and nothing waiting plays.
      reset()
      await update($, shown, () => null)

      return { text: 'cartoon-fx: animations are off. /fx still plays them.' }
    }
    if (wanted === 'size' || wanted.startsWith('size ')) {
      return { text: await resize($, wanted.slice('size'.length).trim()) }
    }
    const samples = SAMPLES.filter(([kind]) => wanted === 'all' || kind === wanted)
    if (samples.length === 0) {
      const names = SAMPLES.map(([kind]) => kind).join(', ')
      return { text: `cartoon-fx has no "${wanted}". Try: ${names} or all; off or on; size small, medium or large; place conversation or place bottom.` }
    }

    // This run's own output row is where its effects play. The engine puts the
    // plugin's name before the text, so the row is found by its "take" tag,
    // numbered across sessions so a resumed transcript's rows never share one.
    const take = Number((await $.store.get('fxTakes')) ?? 0) + 1
    await $.store.set('fxTakes', take)
    const tag = `(take ${take})`
    const text = `playing ${samples.map(([kind]) => kind).join(', ')} ${tag}`

    // They take their turns in the queue. A new run takes over from an earlier
    // one's samples still waiting.
    line = line.filter(waiting => !waiting.isReplay)
    await syncPlacement($)
    const size = await sizeOf($)
    const now = await $.clock.now()
    for (const [kind, title, subtitle, value] of samples) {
      await enter($, now, kind, title, subtitle, value, size, fxRow(tag), true)
    }

    return { text }
  })

  // The row of the tool call that set the effect off, while it stands alone.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.surface === 'terminal' || OWN_CARDS.has(e.props.tool)) {
      return next(e)
    }
    const row = toolRow(e.props.tool_use_id)
    const effect = await playingIn($, row)
    if (effect === null) {
      return next(e)
    }
    noteDrawn(effect, e.props.onScreen)

    return underRow($.ui.resolve(e), await next(e), effect)
  })

  // The desktop folds a run of calls into one group row: the effect plays
  // under the group that holds its call (an unfolded group's rows are ToolUse).
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.surface === 'terminal' || e.props.isExpanded) {
      return next(e)
    }
    const effect = await running($)
    const row = effect?.row
    const holds = row !== undefined && e.props.calls.some(call => call.tool_use_id !== undefined && toolRow(call.tool_use_id) === row)
    if (effect === null || row === undefined || !holds || (await read($, placement)) !== 'conversation') {
      return next(e)
    }
    noteDrawn(effect, e.props.onScreen)

    return underRow($.ui.resolve(e), await next(e), effect)
  })

  // The reply text just before a card the desktop draws its own way.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface === 'terminal') {
      return next(e)
    }
    const row = replyRow(e.props.text)
    const order = noteReply(e.requestId, row)
    // Rows redraw on every streamed delta: one read settles most of them.
    if ((await read($, shown))?.row !== row || !isNewestReply(row, order)) {
      return next(e)
    }
    const effect = await playingIn($, row)
    if (effect === null) {
      return next(e)
    }
    noteDrawn(effect, e.props.onScreen)

    return underRow($.ui.resolve(e), await next(e), effect)
  })

  // `/fx`'s own output row.
  on('ui.render', { component: 'CommandOutput', props: { command: 'fx' } }, async ($, e, next) => {
    if (e.surface === 'terminal') {
      return next(e)
    }
    const tag = /\(take \d+\)/.exec(e.props.text)?.[0]
    const effect = tag === undefined ? null : await playingIn($, fxRow(tag))
    if (tag === undefined || effect === null) {
      return next(e)
    }
    noteDrawn(effect, e.props.onScreen)

    return underRow($.ui.resolve(e), await next(e), effect)
  })

  // The strip above the prompt box: always on the terminal, which draws no SVG;
  // elsewhere for effects with no row of their own (a compaction), or when
  // `/fx place bottom` put them all there. Collapsed, it shows nothing.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    strip = { isCollapsed: e.props.isCollapsed, surface: e.surface }
    const effect = await running($)
    if (effect === null || e.props.hasSurvey || e.props.isCollapsed) {
      return next(e)
    }
    const inConversation = effect.row !== undefined && (await read($, placement)) === 'conversation'
    if (inConversation && e.surface !== 'terminal') {
      return next(e)
    }
    // Shown here, as on the terminal, the effect needs no move to the strip.
    drawnId = effect.id
    const words = wordsOf(effect)

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      const { left, right } = glyphRow(effect.seed, effect.frame ?? 0)
      const bits = (side: string, sparks: Spark[]) =>
        sparks.map(({ glyph, color }, i) => (
          <Text key={`${side}${i}`} color={color}>
            {glyph}{' '}
          </Text>
        ))

      // The left side reads outward from the words, so its sparks fly away from them too.
      return (
        <Box justifyContent="center">
          {bits('l', [...left].reverse())}
          <Text bold color="#FFD23F">
            {` ${words} `}
          </Text>
          {bits('r', right)}
        </Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box justifyContent="center">
        <Svg {...svgOf(effect)} isInteractive />
      </Box>
    )
  })
}
