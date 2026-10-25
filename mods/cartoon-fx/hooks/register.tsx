import { atom, read, update } from 'claude-code'
import type { BoxProps, BuiltinToolInputs, ElementConstructor, EngineInterface, Register, RenderElement, SvgProps } from 'claude-code'

import type { FxKind, Placement, Shown } from '../types'
import { committed, isReviewFix, pushedBranch, testsPassed, tokens } from './detect'
import { COLORS, drawFx, FX_MS, random } from './fx'

const shown = atom({ plugin: 'cartoon-fx', key: 'shown' } as const, null)
const isYellow = atom({ plugin: 'cartoon-fx', key: 'isYellow' } as const, false)
const isRed = atom({ plugin: 'cartoon-fx', key: 'isRed' } as const, false)
const placement = atom({ plugin: 'cartoon-fx', key: 'placement' } as const, 'conversation')

// The context window's yellow zone starts at YELLOW percent, its red zone at
// RED. Each plays once on the way in, and again only after the window has
// dropped below its reset: RESET for the yellow, RED_RESET for the red.
const YELLOW = 75
const RESET = 70
const RED = 90
const RED_RESET = 85

// Subagents started this close together play as one effect, with their count.
const GATHER_MS = 400

// Kept on show this long past the drawing's end, so a surface that mounts it
// late still shows the whole thing.
const HOLD_MS = 600

// A row that has not drawn its effect this soon (a group folded away, a row
// scrolled off, a reply row no longer on screen) hands it to the strip.
const FALLBACK_MS = 900

// What `/fx` replays, in this order for `/fx all`: title, subtitle, value.
const SAMPLES: [FxKind, string, string, number][] = [
  ['plan', 'Action!', "let's build!", 0],
  ['commit', 'SAVED', '5e81772', 0],
  ['push', 'Pushed!', 'main', 0],
  ['tests', 'All green!', '42 passed', 0],
  ['review', 'Reviewed!', '3 findings', 3],
  ['fixes', 'Bugs squashed!', '3 review defects fixed', 3],
  ['compact', 'Squished!', '142k → 18k tokens', 0],
  ['helpers', '×3 helpers!', '', 3],
  ['context', 'Yellow zone!', 'context 76% full', 76],
  ['redzone', 'Red zone!', 'context 92% full', 92],
]

// The terminal draws no SVG: a row of coloured glyphs around the words instead.
const GLYPHS = ['✦', '•', '▪', '✶', '✧', '◆', '∗', '❋']

const short = (text: string) => (text.length > 34 ? `${text.slice(0, 33)}…` : text)

const wordsOf = (effect: Shown) => (effect.subtitle ? `${effect.title} ${effect.subtitle}` : effect.title)

// The effect's drawing, built once per effect: rows and the strip re-render on
// every scroll, and the confetti alone is some 50,000 characters.
let lastDrawing: { seed: number; source: string } | undefined
const svgOf = (effect: Shown) => {
  if (lastDrawing?.seed !== effect.seed) {
    lastDrawing = { seed: effect.seed, source: drawFx(effect.kind, effect.seed, effect.title, effect.subtitle, effect.value) }
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
// call's row (`tool:<id>`), `/fx`'s own output row (`fx:<its text>`), or a
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

// The rows that have drawn an effect where the viewport shows them, the 200
// drawn last; the row of the effect on show is always among them.
const drawnRows = new Set<string>()
const markDrawn = (row: string) => {
  drawnRows.delete(row)
  drawnRows.add(row)
  bound(drawnRows, 200)
}

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
const noteDrawn = (row: string, onScreen: unknown) => {
  if (onScreen !== null) markDrawn(row)
}

// Takes up the placement `/fx place` last stored, in this session or another.
async function syncPlacement($: EngineInterface) {
  const kept = await $.store.get('placement')
  if ((kept === 'conversation' || kept === 'bottom') && kept !== (await read($, placement))) {
    await update($, placement, () => kept)
  }
}

// Plays one effect, in place of any still on show.
async function play($: EngineInterface, kind: FxKind, title: string, subtitle = '', value = 0, row?: string) {
  await syncPlacement($)
  const now = await $.clock.now()
  const lasts = FX_MS[kind] + HOLD_MS
  const effect: Shown = { kind, seed: now, title, subtitle, value, until: now + lasts, ...(row === undefined ? {} : { row }) }
  await update($, shown, () => effect)
  $.clock.after(lasts, () => void update($, shown, s => (s?.seed === effect.seed ? null : s)))
  if (row !== undefined) {
    $.clock.after(FALLBACK_MS, () => void toStripUnlessDrawn($, effect))
  }
}

// Replays `effect` in the strip when its row never drew it.
async function toStripUnlessDrawn($: EngineInterface, effect: Shown) {
  if (effect.row === undefined || drawnRows.has(effect.row)) {
    return
  }
  const now = await read($, shown)
  if (now?.seed === effect.seed && (await read($, placement)) === 'conversation') {
    await play($, effect.kind, effect.title, effect.subtitle, effect.value)
  }
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

  // A reload drops the timer that would end an effect, so start with none.
  on('session.start', async ($, e, next) => {
    await update($, shown, () => null)
    await syncPlacement($)
    await $.command.register({
      name: 'fx',
      description:
        'Replay a cartoon-fx animation (plan, commit, push, tests, review, fixes, compact, helpers, context, redzone, all) or move them (place conversation, place bottom)',
      argumentHint: '[name|all|place conversation|place bottom]',
      immediate: true,
    })

    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) {
      return ran
    }

    // One command may commit, test and push: the push wins, then the commit.
    const row = rowOf(e)
    const branch = pushedBranch(e.command, ran.result)
    const commit = committed(e.command, ran.result)
    const passed = testsPassed(e.command, ran.result)
    if (branch !== undefined) {
      await play($, 'push', 'Pushed!', branch, 0, row)
    } else if (commit !== undefined && isReviewFix(commit.subject)) {
      await play($, 'fixes', 'Bugs squashed!', `review fixes · ${commit.sha}`, 0, row)
    } else if (commit !== undefined) {
      await play($, 'commit', commit.isAmend ? 'AMENDED' : 'SAVED', commit.sha, 0, row)
    } else if (passed !== undefined) {
      await play($, 'tests', 'All green!', passed, 0, row)
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

  // Every finished call: a code review's report, and the context window it may have grown.
  // The context check runs beside the result rather than before it, so no
  // call's result waits on it.
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
    const queue = SAMPLES.filter(([kind]) => wanted === 'all' || kind === wanted)
    if (queue.length === 0) {
      return { text: `cartoon-fx has no "${wanted}". Try: ${SAMPLES.map(([kind]) => kind).join(', ')} or all.` }
    }

    // This run's own output row is where its effects play. The engine puts the
    // plugin's name before the text, so the row is found by its "take" tag,
    // numbered across sessions so a resumed transcript's rows never share one.
    const take = Number((await $.store.get('fxTakes')) ?? 0) + 1
    await $.store.set('fxTakes', take)
    const tag = `(take ${take})`
    const text = `playing ${queue.map(([kind]) => kind).join(', ')} ${tag}`

    // Each one starts after the one before has finished.
    let at = 0
    for (const [kind, title, subtitle, value] of queue) {
      if (at === 0) {
        await play($, kind, title, subtitle, value, fxRow(tag))
      } else {
        $.clock.after(at, () => void play($, kind, title, subtitle, value, fxRow(tag)))
      }
      at += FX_MS[kind] + HOLD_MS + 300
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
    noteDrawn(row, e.props.onScreen)

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
    noteDrawn(row, e.props.onScreen)

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
    noteDrawn(row, e.props.onScreen)

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
    noteDrawn(fxRow(tag), e.props.onScreen)

    return underRow($.ui.resolve(e), await next(e), effect)
  })

  // The strip above the prompt box: always on the terminal, which draws no SVG;
  // elsewhere for effects with no row of their own (a compaction), or when
  // `/fx place bottom` put them all there.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const effect = await running($)
    if (effect === null || e.props.hasSurvey) {
      return next(e)
    }
    const inConversation = effect.row !== undefined && (await read($, placement)) === 'conversation'
    if (inConversation && e.surface !== 'terminal') {
      return next(e)
    }
    // Shown here, as on the terminal, the effect needs no fallback replay.
    if (effect.row !== undefined) {
      markDrawn(effect.row)
    }
    const words = wordsOf(effect)

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      const rnd = random(effect.seed)
      const bits = (side: string) =>
        Array.from({ length: 5 }, (_, i) => (
          <Text key={`${side}${i}`} color={COLORS[Math.floor(rnd() * COLORS.length)]}>
            {GLYPHS[Math.floor(rnd() * GLYPHS.length)]}{' '}
          </Text>
        ))

      return (
        <Box justifyContent="center">
          {bits('l')}
          <Text bold color="#FFD23F">
            {' '}
            {words}{' '}
          </Text>
          {bits('r')}
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
