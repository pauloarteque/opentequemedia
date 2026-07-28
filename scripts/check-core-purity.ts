/**
 * Falha o build se src/core/** importar Node, Next, React ou usar process.env.
 * É o que garante que o MESMO arquivo empacota pro navegador sem adaptação.
 * Ver CLAUDE.md > Core compartilhado, e SPEC.md §2.4.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const CORE_DIR = join(ROOT, 'src', 'core')

const FORBIDDEN_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /from\s+['"]node:/, reason: "import de 'node:*'" },
  { re: /require\(\s*['"]node:/, reason: "require de 'node:*'" },
  { re: /from\s+['"]next\//, reason: "import de 'next/*'" },
  { re: /from\s+['"]react['"]/, reason: "import de 'react'" },
  { re: /from\s+['"]server-only['"]/, reason: "import de 'server-only' (core precisa rodar no navegador)" },
  { re: /\bprocess\.env\b/, reason: 'uso de process.env' },
  { re: /\bBuffer\./, reason: 'uso de Buffer' },
]

// Regex de módulo com flag g ou y: .test() carrega lastIndex entre chamadas e
// alterna true/false de forma incorreta. Pega `/.../g` ou `/.../gi` etc no topo do arquivo,
// fora de dentro de uma função (heurística: se a linha começa com "const"/"export const").
const MODULE_SCOPE_GLOBAL_REGEX_RE = /^(export\s+)?const\s+\w+\s*=\s*\/.*\/[a-z]*[gy][a-z]*\s*$/m

interface Violation {
  file: string
  line: number
  reason: string
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      out.push(full)
    }
  }
  return out
}

function scanFile(file: string): Violation[] {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  const violations: Violation[] = []

  lines.forEach((lineText, idx) => {
    for (const { re, reason } of FORBIDDEN_PATTERNS) {
      if (re.test(lineText)) {
        violations.push({ file, line: idx + 1, reason })
      }
    }
    const globalRegexMatch = MODULE_SCOPE_GLOBAL_REGEX_RE.exec(lineText)
    if (globalRegexMatch) {
      violations.push({
        file,
        line: idx + 1,
        reason: 'regex de escopo de módulo com flag g/y (quebra .test() por causa de lastIndex)',
      })
    }
  })

  return violations
}

let files: string[] = []
try {
  files = walk(CORE_DIR)
} catch {
  console.log('check-core-purity: src/core ainda não existe, nada para checar')
  process.exit(0)
}

const allViolations = files.flatMap(scanFile)

if (allViolations.length > 0) {
  console.error(`check-core-purity: ${allViolations.length} violação(ões) em src/core\n`)
  for (const v of allViolations) {
    console.error(`  ${relative(ROOT, v.file)}:${v.line}  ${v.reason}`)
  }
  process.exit(1)
}

console.log('check-core-purity: src/core está puro (sem Node, Next, React, process.env, ou regex global de módulo)')
process.exit(0)
