// What the desktop app holds a pane's tree to: it draws one only with fewer nodes, levels and characters than these,
// counted as `measure` counts them, and keeps the last tree it drew in place of one past any.
export const DESKTOP_BOUND = { nodes: 2_000, depth: 32, chars: 262_144 } as const

export type Measure = { nodes: number; depth: number; chars: number }

type Tagged = { plugin?: string }
type Drawn = {
  type: string
  props?: Record<string, unknown>
  children?: readonly (Drawn | string)[]
  press?: Tagged
  part?: Tagged
  group?: Tagged
  hover?: Record<string, unknown>
}
type Option = { value?: unknown; label?: unknown }

const lengths = (...texts: unknown[]) => texts.reduce<number>((sum, text) => sum + (typeof text === 'string' ? text.length : 0), 0)
// Each prop's name, and its value when that is a string.
const named = (props: Record<string, unknown> | undefined) =>
  Object.entries(props ?? {}).reduce((sum, [name, value]) => sum + name.length + (typeof value === 'string' ? value.length : 0), 0)
const optionsOf = (props: Record<string, unknown>): readonly Option[] => (Array.isArray(props.options) ? (props.options as Option[]) : [])

// The desktop's count of one element: an Svg's source and alt, a control's own words and its plugin's name, and for
// anything else its props' names and string values.
function charsOf(element: Drawn): number {
  const props = element.props ?? {}
  switch (element.type) {
    case 'Svg':
      return lengths(props.source, props.alt)
    case 'Button':
      return lengths(props.key, props.label, props.hotkey, props.action, element.press?.plugin) + named(element.hover)
    case 'Select':
      return lengths(props.key, props.label, props.value, element.press?.plugin) + optionsOf(props).reduce((sum, one) => sum + lengths(one.value, one.label), 0)
    case 'Input':
      return lengths(props.key, props.label, props.placeholder, props.value, props.submitLabel, element.press?.plugin)
    default:
      return named(props) + named(element.hover) + lengths(element.group?.plugin, element.part?.plugin)
  }
}

// A drawn tree as the desktop counts it: a string is one node of its own length; an element one node, and one more per
// option of a Select, one level above its deepest child.
export function measure(tree: unknown): Measure {
  if (typeof tree === 'string') return { nodes: 1, depth: 1, chars: tree.length }
  const element = tree as Drawn
  const own = { nodes: 1 + (element.type === 'Select' ? optionsOf(element.props ?? {}).length : 0), depth: 1, chars: charsOf(element) }
  return (element.children ?? [])
    .map(measure)
    .reduce((sum, one) => ({ nodes: sum.nodes + one.nodes, depth: Math.max(sum.depth, one.depth + 1), chars: sum.chars + one.chars }), own)
}

export const isWithin = (size: Measure) => size.nodes < DESKTOP_BOUND.nodes && size.depth < DESKTOP_BOUND.depth && size.chars < DESKTOP_BOUND.chars
