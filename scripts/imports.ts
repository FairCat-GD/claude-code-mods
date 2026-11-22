// Keeps a mod self-contained: every relative import resolves inside its folder, and every bare
// import names a module the engine's declarations declare. A mod's `tools/` runs on Node, never in
// the engine, so it is walled off both ways: a tool imports only from `tools/` and `node:` modules.

import { existsSync, readFileSync } from 'node:fs'
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

const inTools = (path: string) => path === 'tools' || path.startsWith(`tools${sep}`)
const TOOL_IMPORTS = 'a tool imports only from tools/ and node: modules'

const resolves = (target: string) => {
  const suffix = Object.keys(SOURCE_OF).find(js => target.endsWith(js))
  const sources = suffix ? (SOURCE_OF[suffix] ?? []).map(source => target.slice(0, -suffix.length) + source) : []
  return [...CANDIDATES.map(candidate => target + candidate), ...sources].some(isFile)
}

export const scanImports = (folder: string, declared: ReadonlySet<string>): string[] => {
  const root = resolve(folder)
  const engineFiles = join(root, DECLARATIONS)
  const files = filesUnder(root, path => path === engineFiles || path.endsWith('/node_modules')).filter(path => SOURCE.test(path))
  const problems: string[] = []
  for (const file of files.sort()) {
    const text = readFileSync(file, 'utf8')
    const own = relative(root, file)
    const tool = inTools(own)
    if (tool && !file.endsWith('.ts')) problems.push(`${own}:1: a source under tools/ must be .ts`)
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
        if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) problems.push(`${where}: '${spec}' leaves the mod's folder`)
        else if (tool && !inTools(inside)) problems.push(`${where}: '${spec}' leaves tools/: ${TOOL_IMPORTS}`)
        else if (!tool && inTools(inside)) problems.push(`${where}: '${spec}' reaches into tools/, which runs on Node, never in the engine`)
        else if (!resolves(target)) problems.push(`${where}: '${spec}' resolves to no file`)
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
