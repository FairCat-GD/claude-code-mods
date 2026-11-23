import { STRINGS } from './strings'

// The settings `/possums set` changes: each one's values, in the order they are listed, and its default.
export const SETTINGS = {
  autoOpen: { values: ['never', 'first', 'always'], initial: 'first' },
  cost: { values: ['off', 'estimate'], initial: 'off' },
  motion: { values: ['auto', 'off'], initial: 'auto' },
  theme: { values: ['classic', 'steampunk', 'horror', 'prehistoric'], initial: 'classic' },
} as const

export type SettingName = keyof typeof SETTINGS
export type SettingValue<N extends SettingName = SettingName> = (typeof SETTINGS)[N]['values'][number]
export const SETTING_NAMES = Object.keys(SETTINGS) as SettingName[]

// `prefs`: the settings, and two flags for how the panel is laid out.
export type Prefs = { [N in SettingName]: SettingValue<N> } & { collapsed: boolean; finishedOpen: boolean }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const pick = <N extends SettingName>(name: N, value: unknown): SettingValue<N> =>
  (SETTINGS[name].values as readonly unknown[]).includes(value) ? (value as SettingValue<N>) : SETTINGS[name].initial

// `prefs` as stored, read forward-only: what this version does not know reads as the default.
export function readPrefs(stored: unknown): Prefs {
  const fields = isRecord(stored) ? stored : {}
  return {
    autoOpen: pick('autoOpen', fields.autoOpen),
    cost: pick('cost', fields.cost),
    motion: pick('motion', fields.motion),
    theme: pick('theme', fields.theme),
    collapsed: fields.collapsed === true,
    finishedOpen: fields.finishedOpen === true,
  }
}

// The next stored value: the change over what was stored, whose unknown keys and values stay for the version that wrote them.
export function mergePrefs(stored: unknown, change: Partial<Prefs>): Record<string, unknown> {
  return { ...(isRecord(stored) ? stored : {}), ...change }
}

export type Words =
  | { kind: 'toggle' }
  | { kind: 'open' }
  | { kind: 'roles' }
  | { kind: 'settings' }
  | { kind: 'set'; name: SettingName; value: SettingValue }
  | { kind: 'noName' }
  | { kind: 'noSuchSetting' }
  | { kind: 'badValue'; name: SettingName }
  | { kind: 'unknown' }

const same = (typed: string, known: string) => typed.toLowerCase() === known.toLowerCase()

// The words after `/possums`; a setting's name and value are matched ignoring case, and kept in their own spelling.
export function parseWords(args: string): Words {
  const [word, name, ...value] = args.trim().split(/\s+/).filter(Boolean)
  if (word === undefined) return { kind: 'toggle' }
  if (same(word, 'set')) {
    if (name === undefined) return { kind: 'noName' }
    const setting = SETTING_NAMES.find(known => same(name, known))
    if (setting === undefined) return { kind: 'noSuchSetting' }
    const chosen = (SETTINGS[setting].values as readonly SettingValue[]).find(known => same(value.join(' '), known))
    if (chosen === undefined) return { kind: 'badValue', name: setting }
    return { kind: 'set', name: setting, value: chosen }
  }
  if (name !== undefined) return { kind: 'unknown' }
  if (same(word, 'open')) return { kind: 'open' }
  if (same(word, 'roles')) return { kind: 'roles' }
  if (same(word, 'settings')) return { kind: 'settings' }
  return { kind: 'unknown' }
}

// `/possums settings`: every setting with its value and the values it takes.
export const settingsText = (prefs: Prefs) =>
  [STRINGS.settingsHeading, ...SETTING_NAMES.map(name => STRINGS.setting(name, prefs[name], SETTINGS[name].values)), STRINGS.howToChange].join('\n')

// The change one setting makes to `prefs`.
export const changeOf = (name: SettingName, value: SettingValue) => ({ [name]: value }) as Partial<Prefs>
