// Keeps a mod self-contained: every relative import resolves inside its folder, and every bare
// import names a module the engine's declarations declare.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import ts from 'typescript'

import { DECLARATIONS, TYPES_FIX } from './repo.ts'

const SOURCE = /\.(?:[cm]?[jt]s|[jt]sx)$/
const CANDIDATES = ['', '.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.mts', '/index.ts', '/index.tsx', '/index.d.ts', '/index.js']

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

const isFile = (path: string) => existsSync(path) && statSync(path).isFile()

export const scanImports = (folder: string, declared: ReadonlySet<string>): string[] => {
  const root = resolve(folder)
  const engineFiles = join(root, DECLARATIONS)
  const files = walk(root, path => path === engineFiles || path.endsWith('/node_modules')).filter(path => SOURCE.test(path))
  const problems: string[] = []
  for (const file of files.sort()) {
    const text = readFileSync(file, 'utf8')
    const info = ts.preProcessFile(text, true, true)
    for (const reference of [...info.importedFiles, ...info.referencedFiles]) {
      const spec = reference.fileName
      const where = `${relative(root, file)}:${text.slice(0, reference.pos).split('\n').length}`
      if (spec.startsWith('.') || isAbsolute(spec)) {
        const target = resolve(dirname(file), spec)
        const inside = relative(root, target)
        if (inside.startsWith('..') || isAbsolute(inside)) problems.push(`${where}: '${spec}' leaves the mod's folder`)
        else if (!CANDIDATES.some(suffix => isFile(target + suffix))) problems.push(`${where}: '${spec}' resolves to no file`)
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
  if (!existsSync(declarations)) {
    console.log(`imports: ${folder} has no API declarations in ${DECLARATIONS}/: ${TYPES_FIX}`)
    process.exitCode = 1
  } else {
    const problems = scanImports(folder, declaredModules(declarations))
    for (const problem of problems) console.log(problem)
    console.log(`imports: ${problems.length} problem(s)`)
    process.exitCode = problems.length ? 1 : 0
  }
}
