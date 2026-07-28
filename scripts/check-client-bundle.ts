/**
 * Prova, por busca no JavaScript compilado que vai pro navegador, que o componente
 * cliente roda o MESMO módulo core que o servidor — não uma segunda implementação.
 * A prova: um texto que só existe em src/core/types.ts (um dos motivos de recusa,
 * "UNSUPPORTED_CHANNEL_TAB") só pode chegar ao bundle do navegador se o bundler
 * empacotou src/core/** de verdade. Ver SPEC.md §2.4, fase 6.
 *
 * Precisa rodar DEPOIS de `npm run build`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const STATIC_CHUNKS_DIR = join(ROOT, '.next', 'static', 'chunks')
const SENTINEL = 'UNSUPPORTED_CHANNEL_TAB'

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (extname(full) === '.js') {
      out.push(full)
    }
  }
  return out
}

const files = walk(STATIC_CHUNKS_DIR)

if (files.length === 0) {
  console.error(`check-client-bundle: nenhum chunk .js encontrado em ${relative(ROOT, STATIC_CHUNKS_DIR)}.`)
  console.error('Rode "npm run build" antes deste script.')
  process.exit(1)
}

const hit = files.find((f) => readFileSync(f, 'utf8').includes(SENTINEL))

if (!hit) {
  console.error(
    `check-client-bundle: o texto "${SENTINEL}" (que só existe em src/core/types.ts) não apareceu em nenhum dos ${files.length} chunks do navegador.`,
  )
  console.error('Isso sugere que o componente do gerador NÃO está importando src/core — investigar.')
  process.exit(1)
}

console.log(`check-client-bundle: achado em ${relative(ROOT, hit)}`)
console.log(`Prova: "${SENTINEL}" (definido só em src/core/types.ts) está no bundle do navegador.`)
console.log('O componente do gerador roda o MESMO módulo core que o servidor, não uma segunda implementação.')
process.exit(0)
