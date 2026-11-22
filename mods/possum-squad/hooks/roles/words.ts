import type { RoleId } from '../../types/index'

// The role rules' word lists, ported from the round's reference with their order and contents unchanged. A trailing *
// is a stem; a phrase matches as a whole-word sequence; everything is lower case.

export const GENERIC_TYPES: ReadonlySet<string> = new Set(['general-purpose', 'claude', 'fork', ''])
export const BUILTIN_TYPES: ReadonlyMap<string, RoleId> = new Map<string, RoleId>([
  ['explore', 'scout'],
  ['plan', 'planner'],
])

export const GUARD = ['secur*', 'vulnerab*', 'secret*', 'credential*', 'threat', 'cve', 'exploit*', 'injection', 'xss', 'csrf', 'pen test', 'pentest*']

// Checked against the description's first word or words only.
export const STRONG_VERBS: readonly (readonly [RoleId, readonly string[]])[] = [
  ['researcher', ['look up', 'find out', 'read the docs', 'read docs', 'check the docs', 'check docs', 'research', 'compare', 'survey', 'study']],
  ['planner', ['plan', 'outline', 'scope', 'architect', 'propose', 'break down']],
  ['reviewer', ['review', 'critique', 'assess', 'evaluate', 'audit']],
  ['tester', ['test', 'verify', 'validate', 'qa']],
  ['bugcatcher', ['debug', 'diagnose', 'reproduce', 'troubleshoot', 'trace', 'bisect']],
  [
    'janitor',
    [
      'refactor',
      'rename',
      'clean',
      'cleanup',
      'tidy',
      'migrate',
      'upgrade',
      'format',
      'lint',
      'simplify',
      'dedupe',
      'deduplicate',
      'reorganize',
      'restructure',
      'modernize',
    ],
  ],
  ['courier', ['commit', 'push', 'merge', 'release', 'tag', 'publish', 'ship', 'rebase']],
  ['analyst', ['analyze', 'analyse', 'benchmark', 'profile', 'measure', 'count', 'crunch', 'quantify', 'compute', 'calculate']],
  ['writer', ['document', 'summarize', 'summarise', 'draft', 'describe', 'explain', 'translate', 'proofread']],
  ['operator', ['deploy', 'install', 'configure', 'provision', 'bootstrap', 'setup', 'set up']],
  ['pilot', ['navigate', 'click', 'screenshot', 'browse']],
  ['artist', ['draw', 'sketch', 'illustrate', 'animate']],
]

// "Design" and its family are an artist's, unless the object is a system rather than a look.
export const DESIGN_VERBS: ReadonlySet<string> = new Set(['design', 'redesign', 'restyle', 'style', 'mock', 'mockup'])
export const DESIGN_AS_PLANNING = [
  'api',
  'architecture',
  'schema',
  'system',
  'database',
  'data model',
  'protocol',
  'workflow',
  'plan',
  'strategy',
  'structure',
  'pipeline',
  'interface',
]

// Checked anywhere in the text, in this order.
export const KEYWORDS: readonly (readonly [RoleId, readonly string[]])[] = [
  [
    'bugcatcher',
    [
      'bug*',
      'root cause',
      'crash*',
      'flaky',
      'failing',
      'fails',
      'failure*',
      'regression*',
      'broken',
      'why does',
      'why is',
      'why do',
      'stack trace',
      'leak',
      'hang*',
      'deadlock*',
      'exception*',
    ],
  ],
  ['tester', ['test', 'tests', 'testing', 'e2e', 'coverage', 'qa', 'suite', 'assertion*', 'fixture*', 'playwright', 'jest', 'vitest', 'pytest']],
  ['reviewer', ['review*', 'critique', 'feedback', 'second opinion', 'code quality', 'the diff']],
  [
    'janitor',
    [
      'refactor*',
      'cleanup',
      'clean up',
      'dead code',
      'lint*',
      'format*',
      'deprecat*',
      'rename*',
      'migrat*',
      'upgrade*',
      'tech debt',
      'unused',
      'duplicate*',
      'typo*',
    ],
  ],
  [
    'writer',
    [
      'readme',
      'docs',
      'doc',
      'documentation',
      'changelog',
      'release notes',
      'summary',
      'guide',
      'tutorial',
      'docstring*',
      'write up',
      'writeup',
      'blog',
      'article',
      'announcement',
    ],
  ],
  ['courier', ['commit*', 'pull request', 'pr', 'release*', 'push', 'merge*', 'tag', 'publish*', 'git']],
  ['pilot', ['browser', 'chrome', 'click*', 'navigat*', 'screenshot*', 'fill in', 'fill out', 'fill the form']],
  ['analyst', ['analy*', 'metric*', 'log', 'logs', 'statistic*', 'stats', 'benchmark*', 'profiling', 'measur*', 'dataset*', 'telemetry']],
  [
    'artist',
    [
      'ui',
      'ux',
      'css',
      'style*',
      'layout*',
      'icon*',
      'sprite*',
      'graphic*',
      'visual*',
      'mockup*',
      'logo',
      'animation*',
      'color*',
      'colour*',
      'theme',
      'typography',
      'font*',
      'illustration*',
      'pixel',
      'figma',
    ],
  ],
  [
    'planner',
    ['plan*', 'architect*', 'approach', 'break down', 'spec', 'roadmap', 'design', 'strategy', 'proposal', 'rfc', 'milestone*', 'tradeoff*', 'trade-off*'],
  ],
  ['researcher', ['research*', 'compar*', 'look up', 'find out', 'options', 'alternatives', 'best practice*']],
  [
    'operator',
    [
      'deploy*',
      'install*',
      'ci',
      'pipeline*',
      'docker*',
      'kubernetes',
      'k8s',
      'configur*',
      'set up',
      'setup',
      'run the build',
      'server',
      'infra*',
      'terraform',
      'github actions',
    ],
  ],
  [
    'scout',
    [
      'find*',
      'search*',
      'locat*',
      'where',
      'explor*',
      'look for',
      'list',
      'identify',
      'map',
      'gather',
      'discover',
      'inspect',
      'understand',
      'how does',
      'which files',
      'usages',
      'references',
    ],
  ],
  [
    'builder',
    [
      'implement*',
      'build*',
      'add',
      'create*',
      'fix*',
      'update*',
      'write*',
      'make',
      'wire',
      'port',
      'convert*',
      'integrat*',
      'support',
      'enable',
      'extend',
      'generate',
      'scaffold',
      'feature*',
      'develop*',
      'hook up',
    ],
  ],
]

// The reference's `\b` is Unicode-aware (Python's word characters are letters, numbers and `_`); JavaScript's is ASCII.
const WORD_BEFORE = '(?<![\\p{L}\\p{N}_])'
const WORD_AFTER = '(?![\\p{L}\\p{N}_])'
const bounded = (body: string) => new RegExp(`${WORD_BEFORE}(?:${body})${WORD_AFTER}`, 'u')

export const TEST_RUNNERS = bounded(
  'npm (run )?test|pnpm (run )?test|yarn test|npx (jest|vitest|playwright)|jest|vitest|pytest|go test|cargo test|dotnet test|mvn test|gradle test|rspec|phpunit|playwright test',
)
export const GIT_SHIP = bounded('git (commit|push|tag)|gh pr (create|merge)|gh release')
