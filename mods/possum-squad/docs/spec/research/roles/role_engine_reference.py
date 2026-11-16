"""Possum Squad - reference implementation of role detection (PDD Part 6, F-05).

Pure function, no dependencies. The build ports this to TypeScript; the port must
classify role-corpus.json the same way. Labels in the corpus are fixed outside the build.

Run: python3 role_engine_reference.py role-corpus.json
"""
import json
import re
import sys

GENERIC_TYPES = {'general-purpose', 'claude', 'fork', ''}
BUILTIN_TYPES = {'explore': 'scout', 'plan': 'planner'}
WEAK_CALLS_FOR_SCOUT = 6  # T-03

# A trailing * is a stem. Phrases match as whole-word sequences. Everything is lower case.
GUARD = ['secur*', 'vulnerab*', 'secret*', 'credential*', 'threat', 'cve', 'exploit*', 'injection', 'xss', 'csrf',
         'pen test', 'pentest*']

# Checked against the first word(s) of the description only.
STRONG_VERBS = [
    ('researcher', ['look up', 'find out', 'read the docs', 'read docs', 'check the docs', 'check docs',
                    'research', 'compare', 'survey', 'study']),
    ('planner', ['plan', 'outline', 'scope', 'architect', 'propose', 'break down']),
    ('reviewer', ['review', 'critique', 'assess', 'evaluate', 'audit']),
    ('tester', ['test', 'verify', 'validate', 'qa']),
    ('bugcatcher', ['debug', 'diagnose', 'reproduce', 'troubleshoot', 'trace', 'bisect']),
    ('janitor', ['refactor', 'rename', 'clean', 'cleanup', 'tidy', 'migrate', 'upgrade', 'format', 'lint',
                 'simplify', 'dedupe', 'deduplicate', 'reorganize', 'restructure', 'modernize']),
    ('courier', ['commit', 'push', 'merge', 'release', 'tag', 'publish', 'ship', 'rebase']),
    ('analyst', ['analyze', 'analyse', 'benchmark', 'profile', 'measure', 'count', 'crunch', 'quantify',
                 'compute', 'calculate']),
    ('writer', ['document', 'summarize', 'summarise', 'draft', 'describe', 'explain', 'translate', 'proofread']),
    ('operator', ['deploy', 'install', 'configure', 'provision', 'bootstrap', 'setup', 'set up']),
    ('pilot', ['navigate', 'click', 'screenshot', 'browse']),
    ('artist', ['draw', 'sketch', 'illustrate', 'animate']),
]

# "design" and its family: artist unless the object is a system, not a look.
DESIGN_VERBS = ['design', 'redesign', 'restyle', 'style', 'mock', 'mockup']
DESIGN_AS_PLANNING = ['api', 'architecture', 'schema', 'system', 'database', 'data model', 'protocol', 'workflow',
                      'plan', 'strategy', 'structure', 'pipeline', 'interface']

# Checked anywhere in the text, in this order.
KEYWORDS = [
    ('bugcatcher', ['bug*', 'root cause', 'crash*', 'flaky', 'failing', 'fails', 'failure*', 'regression*', 'broken',
                    'why does', 'why is', 'why do', 'stack trace', 'leak', 'hang*', 'deadlock*', 'exception*']),
    ('tester', ['test', 'tests', 'testing', 'e2e', 'coverage', 'qa', 'suite', 'assertion*', 'fixture*',
                'playwright', 'jest', 'vitest', 'pytest']),
    ('reviewer', ['review*', 'critique', 'feedback', 'second opinion', 'code quality', 'the diff']),
    ('janitor', ['refactor*', 'cleanup', 'clean up', 'dead code', 'lint*', 'format*', 'deprecat*', 'rename*',
                 'migrat*', 'upgrade*', 'tech debt', 'unused', 'duplicate*', 'typo*']),
    ('writer', ['readme', 'docs', 'doc', 'documentation', 'changelog', 'release notes', 'summary', 'guide',
                'tutorial', 'docstring*', 'write up', 'writeup', 'blog', 'article', 'announcement']),
    ('courier', ['commit*', 'pull request', 'pr', 'release*', 'push', 'merge*', 'tag', 'publish*', 'git']),
    ('pilot', ['browser', 'chrome', 'click*', 'navigat*', 'screenshot*', 'fill in', 'fill out', 'fill the form']),
    ('analyst', ['analy*', 'metric*', 'log', 'logs', 'statistic*', 'stats', 'benchmark*', 'profiling', 'measur*',
                 'dataset*', 'telemetry']),
    ('artist', ['ui', 'ux', 'css', 'style*', 'layout*', 'icon*', 'sprite*', 'graphic*', 'visual*', 'mockup*',
                'logo', 'animation*', 'color*', 'colour*', 'theme', 'typography', 'font*', 'illustration*',
                'pixel', 'figma']),
    ('planner', ['plan*', 'architect*', 'approach', 'break down', 'spec', 'roadmap', 'design', 'strategy',
                 'proposal', 'rfc', 'milestone*', 'tradeoff*', 'trade-off*']),
    ('researcher', ['research*', 'compar*', 'look up', 'find out', 'options', 'alternatives', 'best practice*']),
    ('operator', ['deploy*', 'install*', 'ci', 'pipeline*', 'docker*', 'kubernetes', 'k8s', 'configur*', 'set up',
                  'setup', 'run the build', 'server', 'infra*', 'terraform', 'github actions']),
    ('scout', ['find*', 'search*', 'locat*', 'where', 'explor*', 'look for', 'list', 'identify', 'map', 'gather',
               'discover', 'inspect', 'understand', 'how does', 'which files', 'usages', 'references']),
    ('builder', ['implement*', 'build*', 'add', 'create*', 'fix*', 'update*', 'write*', 'make', 'wire', 'port',
                 'convert*', 'integrat*', 'support', 'enable', 'extend', 'generate', 'scaffold',
                 'feature*', 'develop*', 'hook up']),
]

TEST_RUNNERS = re.compile(r'\b(npm (run )?test|pnpm (run )?test|yarn test|npx (jest|vitest|playwright)|jest|vitest|pytest|'
                          r'go test|cargo test|dotnet test|mvn test|gradle test|rspec|phpunit|playwright test)\b')
GIT_SHIP = re.compile(r'\b(git (commit|push|tag)|gh pr (create|merge)|gh release)\b')


def words(text):
    return re.findall(r"[a-z0-9][a-z0-9+#.'-]*", text.lower())


def hit(pattern, toks, start_only=False):
    parts = pattern.split()
    spans = [0] if start_only else range(len(toks) - len(parts) + 1)
    for i in spans:
        if i + len(parts) > len(toks):
            continue
        ok = True
        for p, t in zip(parts, toks[i:i + len(parts)]):
            if p.endswith('*'):
                ok = t.startswith(p[:-1])
            else:
                ok = t == p
            if not ok:
                break
        if ok:
            return True
    return False


def from_text(text):
    toks = words(text)
    if not toks:
        return None
    if any(hit(k, toks) for k in GUARD):
        return 'guard'
    if toks[0] in DESIGN_VERBS:
        return 'planner' if any(hit(k, toks) for k in DESIGN_AS_PLANNING) else 'artist'
    for role, verbs in STRONG_VERBS:
        if any(hit(v, toks, start_only=True) for v in verbs):
            return role
    for role, keys in KEYWORDS:
        if any(hit(k, toks) for k in keys):
            return role
    return None


def from_tools(calls):
    """calls: list of 'Tool' or 'Bash:<command>' strings, in order."""
    weak = 0
    for c in calls:
        name, _, arg = c.partition(':')
        low = name.lower()
        if low in ('edit', 'write', 'notebookedit', 'multiedit'):
            return 'builder'
        if low in ('websearch', 'webfetch'):
            return 'researcher'
        if 'chrome' in low or 'browser' in low or 'playwright' in low or 'computer' in low:
            return 'pilot'
        if low == 'bash':
            if TEST_RUNNERS.search(arg.lower()):
                return 'tester'
            if GIT_SHIP.search(arg.lower()):
                return 'courier'
            continue  # any other shell command is no evidence
        if low in ('read', 'grep', 'glob', 'ls'):
            weak += 1
            if weak >= WEAK_CALLS_FOR_SCOUT:
                return 'scout'
    return None


def detect(description, agent_type='general-purpose', tools=(), stated=None, remembered=None, timed_out=True):
    """Returns (role, source). 'remembered' is the user's saved choice for this agent type, if any."""
    t = (agent_type or '').lower()
    if stated:
        return stated, 'stated'
    if remembered and t not in GENERIC_TYPES and t not in BUILTIN_TYPES:
        return remembered, 'remembered'
    if t in BUILTIN_TYPES:
        return BUILTIN_TYPES[t], 'type'
    if t not in GENERIC_TYPES:
        r = from_text(t.replace('-', ' ').replace('_', ' '))
        if r:
            return r, 'name'
    r = from_text(description)
    if r:
        return r, 'keywords'
    r = from_tools(tools)
    if r:
        return r, 'tools'
    return ('helper', 'fallback') if timed_out else (None, 'unsettled')


if __name__ == '__main__':
    corpus = json.load(open(sys.argv[1]))
    for part in ('dev', 'holdout'):
        items = corpus[part]
        miss = []
        for it in items:
            got, src = detect(it['description'], it.get('type', 'general-purpose'), it.get('tools', ()))
            if got != it['role']:
                miss.append((it['description'], it.get('type', ''), it['role'], got, src))
        print('%s: %d/%d = %.0f%%' % (part, len(items) - len(miss), len(items), 100 * (len(items) - len(miss)) / len(items)))
        if part == 'dev' or '--show-holdout' in sys.argv:
            for m in miss:
                print('   MISS', m)
