// Keeps a mod self-contained: every relative import resolves inside its folder, and every bare
// import names a module the engine's declarations declare. A mod's `tools/` runs on Node, never in
// the engine, so it is walled off both ways: a tool imports only from `tools/` and `node:` modules.
// A symbolic link is refused, since the scan does not follow one. Files git ignores are not judged.

import { spawnSync } from 'node:child_process'
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { isBuiltin } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import ts from 'typescript'

import { DECLARATIONS, filesUnder, isFile, noDeclarations, report } from './repo.ts'

const SOURCE = /\.(?:[cm]?[jt]s|[jt]sx)$/
const CANDIDATES = ['', '.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.mts', '/index.ts', '/index.tsx', '/index.d.ts', '/index.js']
// A JavaScript suffix may name the TypeScript source it compiles from, as bundler resolution allows.
const SOURCE_OF: Record<string, string[]> = { '.js': ['.ts', '.tsx'], '.jsx': ['.tsx'], '.mjs': ['.mts'], '.cjs': ['.cts'] }

// The module names `declare module '<name>'` gives at the top level of each declaration file.
export const declaredModules = (declarations: string): Set<string> => {
  const names = new Set<string>()
  for (const file of filesUnder(declarations).filter(path => path.endsWith('.ts'))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, false)
    for (const statement of source.statements) {
      if (ts.isModuleDeclaration(statement) && ts.isStringLiteral(statement.name)) names.add(statement.name.text)
    }
  }
  return names
}

// The disk ignores case, so `Tools/` is the same folder as `tools/`.
const inTools = (path: string) => /^tools\//i.test(path)
const inToolFixtures = (path: string) => /^tools\/fixtures\//i.test(path)
const TOOL_IMPORTS = 'a tool imports only from tools/ and node: modules'

// The file an import names, if there is one.
const resolved = (target: string) => {
  const suffix = Object.keys(SOURCE_OF).find(js => target.endsWith(js))
  const sources = suffix ? (SOURCE_OF[suffix] ?? []).map(source => target.slice(0, -suffix.length) + source) : []
  return [...CANDIDATES.map(candidate => target + candidate), ...sources].find(isFile)
}

// The files git ignores, which no commit holds; none outside a repository.
const ignoredBy = (root: string, owns: string[]) => {
  const run = spawnSync('git', ['check-ignore', '-z', '--stdin'], { cwd: root, input: owns.join('\0'), encoding: 'utf8' })
  return new Set(run.status === 0 ? run.stdout.split('\0').filter(Boolean) : [])
}

// What a file says about `tools/` before its imports are read.
const layoutProblems = (own: string, link: boolean) => {
  if (link) return [`${own}: a symbolic link, which the import scan does not follow: replace it with what it points to`]
  if (inTools(own) && !own.endsWith('.ts')) {
    if (SOURCE.test(own)) return [`${own}:1: a source under tools/ must be .ts`]
    if (!inToolFixtures(own)) return [`${own}:1: a file under tools/ but outside tools/fixtures/ must be .ts`]
  }
  return []
}

export const scanImports = (folder: string, declared: ReadonlySet<string>): string[] => {
  const root = resolve(folder)
  const engineFiles = join(root, DECLARATIONS)
  const problems: string[] = []
  const misnamed = readdirSync(root).filter(name => name !== 'tools' && name.toLowerCase() === 'tools')
  problems.push(...misnamed.map(name => `${name}/: a folder named tools/ in another case: name it tools/`))
  const all = filesUnder(root, path => path === engineFiles || path.endsWith('/node_modules')).sort()
  const ignored = ignoredBy(
    root,
    all.map(file => relative(root, file)),
  )
  for (const file of all) {
    const own = relative(root, file)
    if (ignored.has(own)) continue
    const link = lstatSync(file).isSymbolicLink()
    problems.push(...layoutProblems(own, link))
    if (link || !SOURCE.test(file)) continue
    const text = readFileSync(file, 'utf8')
    const tool = inTools(own)
    const info = ts.preProcessFile(text, true, true)
    // `/// <reference path>` always names a file, and `/// <reference types>` always a module.
    const references = [
      ...info.importedFiles.map(reference => ({
        reference,
        kind: reference.fileName.startsWith('.') || isAbsolute(reference.fileName) ? ('path' as const) : ('module' as const),
      })),
      ...info.referencedFiles.map(reference => ({ reference, kind: 'path' as const })),
      ...info.typeReferenceDirectives.map(reference => ({ reference, kind: 'types' as const })),
    ].sort((a, b) => a.reference.pos - b.reference.pos)
    for (const { reference, kind } of references) {
      const spec = reference.fileName
      const where = `${own}:${text.slice(0, reference.pos).split('\n').length}`
      if (kind === 'path') {
        const target = resolve(dirname(file), spec)
        const inside = relative(root, target)
        const found = resolved(target)
        // The wall judges the file the import resolves to, or the path it names when there is none.
        const lands = found ? relative(root, found) : inside
        if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) problems.push(`${where}: '${spec}' leaves the mod's folder`)
        else if (tool && !inTools(lands)) problems.push(`${where}: '${spec}' leaves tools/: ${TOOL_IMPORTS}`)
        else if (!tool && inTools(lands)) problems.push(`${where}: '${spec}' reaches into tools/, which runs on Node, never in the engine`)
        else if (!found) problems.push(`${where}: '${spec}' resolves to no file`)
      } else if (tool) {
        if (kind === 'types') problems.push(`${where}: '${spec}' is a types reference: the tools' type check supplies Node's types`)
        else if (!spec.startsWith('node:') || !isBuiltin(spec)) problems.push(`${where}: '${spec}' is no node: module: ${TOOL_IMPORTS}`)
      } else if (!declared.has(spec)) {
        problems.push(`${where}: '${spec}' is no module the engine declares (${[...declared].sort().join(', ')})`)
      }
    }
  }
  return problems
}

if (import.meta.main) {
  const [folder = '.', given] = process.argv.slice(2)
  const declarations = given ?? join(folder, DECLARATIONS)
  report('imports', existsSync(declarations) ? scanImports(folder, declaredModules(declarations)) : [noDeclarations(folder)])
}
