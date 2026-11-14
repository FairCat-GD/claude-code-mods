// Keeps a mod self-contained: every relative import resolves inside its folder, and every bare
// import names a module the engine's declarations declare.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import ts from 'typescript'

import { DECLARATIONS, isFile, noDeclarations, report } from './repo.ts'

const SOURCE = /\.(?:[cm]?[jt]s|[jt]sx)$/
const CANDIDATES = ['', '.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.mts', '/index.ts', '/index.tsx', '/index.d.ts', '/index.js']
// A JavaScript suffix may name the TypeScript source it compiles from, as bundler resolution allows.
const SOURCE_OF: Record<string, string[]> = { '.js': ['.ts', '.tsx'], '.jsx': ['.tsx'], '.mjs': ['.mts'], '.cjs': ['.cts'] }

const walk = (dir: string, skip: (path: string) => boolean): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (skip(path)) return []
    return entry.isDirectory() ? walk(path, skip) : [path]
  })

// The module names `declare module '<name>'` gives at the top level of each declaration file.
export const declaredModules = (declarations: string): Set<string> => {
  const names = new Set<string>()
  for (const file of walk(declarations, () => false).filter(path => path.endsWith('.ts'))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, false)
    for (const statement of source.statements) {
      if (ts.isModuleDeclaration(statement) && ts.isStringLiteral(statement.name)) names.add(statement.name.text)
    }
  }
  return names
}

const resolves = (target: string) => {
  const suffix = Object.keys(SOURCE_OF).find(js => target.endsWith(js))
  const sources = suffix ? (SOURCE_OF[suffix] ?? []).map(source => target.slice(0, -suffix.length) + source) : []
  return [...CANDIDATES.map(candidate => target + candidate), ...sources].some(isFile)
}

export const scanImports = (folder: string, declared: ReadonlySet<string>): string[] => {
  const root = resolve(folder)
  const engineFiles = join(root, DECLARATIONS)
  const files = walk(root, path => path === engineFiles || path.endsWith('/node_modules')).filter(path => SOURCE.test(path))
  const problems: string[] = []
  for (const file of files.sort()) {
    const text = readFileSync(file, 'utf8')
    const info = ts.preProcessFile(text, true, true)
    // `/// <reference path>` always names a file, and `/// <reference types>` always a module.
    const references = [
      ...info.importedFiles.map(reference => ({ reference, isPath: reference.fileName.startsWith('.') || isAbsolute(reference.fileName) })),
      ...info.referencedFiles.map(reference => ({ reference, isPath: true })),
      ...info.typeReferenceDirectives.map(reference => ({ reference, isPath: false })),
    ].sort((a, b) => a.reference.pos - b.reference.pos)
    for (const { reference, isPath } of references) {
      const spec = reference.fileName
      const where = `${relative(root, file)}:${text.slice(0, reference.pos).split('\n').length}`
      if (isPath) {
        const target = resolve(dirname(file), spec)
        const inside = relative(root, target)
        if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) problems.push(`${where}: '${spec}' leaves the mod's folder`)
        else if (!resolves(target)) problems.push(`${where}: '${spec}' resolves to no file`)
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
