/**
 * Falha o build se encontrar cor ou medida escrita direto no código, fora de
 * src/core/tokens.ts. Ver CLAUDE.md > Tokens, e SPEC.md §7.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SCAN_DIRS = ['src']
const SCAN_EXTS = new Set(['.ts', '.tsx', '.css'])
const EXCLUDE_FILES = new Set([
  join(ROOT, 'src', 'core', 'tokens.ts'),
  // youtube-meta.ts decodifica entidades HTML numéricas (&#39;, &#039;) — os literais
  // '#39'/'#039' no código são NOMES DE ENTIDADE, não cor. Coincidem com o padrão de
  // hex de 3 dígitos por acaso (dígito puro), e o arquivo não tem CSS nenhum: sem
  // risco real de um valor de cor escapar sem ser pego em outro lugar.
  join(ROOT, 'src', 'server', 'youtube-meta.ts'),
])
const EXCLUDE_DIRS = new Set(['generated', 'node_modules'])

const HEX_COLOR_RE = /#[0-9a-fA-F]{3,8}\b/g

// Valores em px que existem como token (radius/space). 0px e 1px ficam de fora:
// são convenções legítimas de reset/hairline mesmo em sistemas com token completo.
const TOKEN_PX_VALUES = new Set([4, 8, 12, 16, 24, 32, 48, 64])
const PX_RE = /(?<![\w.])(\d+)px\b/g

interface Violation {
  file: string
  line: number
  kind: 'hex' | 'px'
  snippet: string
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (SCAN_EXTS.has(extname(full))) {
      out.push(full)
    }
  }
  return out
}

function scanFile(file: string): Violation[] {
  if (EXCLUDE_FILES.has(file)) return []
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')
  const violations: Violation[] = []

  lines.forEach((lineText, idx) => {
    for (const m of lineText.matchAll(HEX_COLOR_RE)) {
      violations.push({ file, line: idx + 1, kind: 'hex', snippet: m[0] })
    }
    for (const m of lineText.matchAll(PX_RE)) {
      const value = Number(m[1])
      if (TOKEN_PX_VALUES.has(value)) {
        violations.push({ file, line: idx + 1, kind: 'px', snippet: m[0] })
      }
    }
  })

  return violations
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)))
const allViolations = files.flatMap(scanFile)

if (allViolations.length > 0) {
  console.error(`check-no-raw-values: ${allViolations.length} valor(es) fora de src/core/tokens.ts\n`)
  for (const v of allViolations) {
    console.error(`  ${relative(ROOT, v.file)}:${v.line}  (${v.kind}) ${v.snippet}`)
  }
  process.exit(1)
}

console.log('check-no-raw-values: 0 valor(es) de cor ou medida fora de src/core/tokens.ts')
process.exit(0)
