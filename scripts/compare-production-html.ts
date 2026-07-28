/**
 * Portão obrigatório antes de confiar em qualquer deploy: busca a página inteligente
 * do servidor LOCAL e de PRODUÇÃO, com o mesmo User-Agent, e compara byte a byte.
 * Qualquer diferença é o proxy/CDN reescrevendo o documento — Rocket Loader, Auto
 * Minify e Email Obfuscation não têm comportamento documentado pela Cloudflare para
 * resposta de Worker (ver SPEC.md §9), então isto é a única prova que existe.
 *
 * Uso:
 *   tsx scripts/compare-production-html.ts [--path /v/dQw4w9WgXcQ] [--ua android|ios]
 *     [--local http://127.0.0.1:8787] [--prod https://open.tequemedia.com.br]
 *
 * Roda com o preview local do Worker no ar (`npm run cf:preview`), não `next dev` —
 * o alvo é o que o Worker de verdade serve, não o Next puro.
 */
import { INSTAGRAM_ANDROID, INSTAGRAM_IOS } from '../tests/fixtures/user-agents'

interface Args {
  path: string
  ua: string
  local: string
  prod: string
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string, fallback: string): string => {
    const idx = argv.indexOf(flag)
    return idx !== -1 && argv[idx + 1] !== undefined ? argv[idx + 1]! : fallback
  }
  const uaChoice = get('--ua', 'android')
  const ua = uaChoice === 'ios' ? INSTAGRAM_IOS : uaChoice === 'android' ? INSTAGRAM_ANDROID : uaChoice
  return {
    path: get('--path', '/v/dQw4w9WgXcQ'),
    ua,
    local: get('--local', 'http://127.0.0.1:8787').replace(/\/$/, ''),
    prod: get('--prod', 'https://open.tequemedia.com.br').replace(/\/$/, ''),
  }
}

interface Fetched {
  status: number
  headers: Headers
  bytes: Uint8Array
  text: string
}

async function fetchPage(base: string, path: string, ua: string): Promise<Fetched> {
  const res = await fetch(`${base}${path}`, {
    headers: { 'user-agent': ua },
    redirect: 'manual',
  })
  const buf = new Uint8Array(await res.arrayBuffer())
  return { status: res.status, headers: res.headers, bytes: buf, text: new TextDecoder('utf-8').decode(buf) }
}

const HEADERS_TO_COMPARE = ['content-type', 'content-security-policy', 'x-content-type-options', 'x-robots-tag']

function firstDiffOffset(a: Uint8Array, b: Uint8Array): number {
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return i
  }
  return len
}

function excerptAround(text: string, offset: number, radius = 80): string {
  const start = Math.max(0, offset - radius)
  const end = Math.min(text.length, offset + radius)
  return text.slice(start, end)
}

/** Script executável — o segundo <script>, o que não tem id="oc" (esse é o bloco JSON). */
function extractExecScript(html: string): { tag: string; body: string } | null {
  const re = /<script(?![^>]*id="oc")([^>]*)>([\s\S]*?)<\/script>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const attrs = match[1] ?? ''
    if (!attrs.includes('id="oc"')) return { tag: `<script${attrs}>`, body: match[2] ?? '' }
  }
  return null
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  console.log(`comparando ${args.path}`)
  console.log(`  local: ${args.local}`)
  console.log(`  prod:  ${args.prod}`)
  console.log(`  UA:    ${args.ua.slice(0, 60)}...`)
  console.log('')

  const [local, prod] = await Promise.all([
    fetchPage(args.local, args.path, args.ua),
    fetchPage(args.prod, args.path, args.ua),
  ])

  let failed = false

  if (local.status !== prod.status) {
    failed = true
    console.error(`✗ status diferente: local=${local.status} prod=${prod.status}`)
  }

  for (const h of HEADERS_TO_COMPARE) {
    const lv = local.headers.get(h)
    const pv = prod.headers.get(h)
    if (lv !== pv) {
      failed = true
      console.error(`✗ header "${h}" diferente:`)
      console.error(`    local: ${lv ?? '(ausente)'}`)
      console.error(`    prod:  ${pv ?? '(ausente)'}`)
    }
  }

  const bytesEqual = local.bytes.length === prod.bytes.length && local.bytes.every((v, i) => v === prod.bytes[i])

  if (bytesEqual) {
    console.log(`✓ corpo idêntico byte a byte (${local.bytes.length} bytes)`)
  } else {
    failed = true
    const offset = firstDiffOffset(local.bytes, prod.bytes)
    console.error(`✗ corpo difere — primeira diferença no byte ${offset} (local=${local.bytes.length}B, prod=${prod.bytes.length}B)`)
    console.error('  --- local ---')
    console.error('  ' + excerptAround(local.text, offset).replace(/\n/g, '\\n'))
    console.error('  --- prod ---')
    console.error('  ' + excerptAround(prod.text, offset).replace(/\n/g, '\\n'))

    const localScript = extractExecScript(local.text)
    const prodScript = extractExecScript(prod.text)
    if (localScript && prodScript) {
      const scriptChanged = localScript.tag !== prodScript.tag || localScript.body !== prodScript.body
      if (scriptChanged) {
        console.error('')
        console.error('  ⚠ O BLOCO DE SCRIPT EMBUTIDO MUDOU ENTRE LOCAL E PRODUÇÃO.')
        console.error('    Suspeito nº 1: Rocket Loader ou Auto Minify reescrevendo o HTML no proxy.')
        console.error(`    tag local: ${localScript.tag}`)
        console.error(`    tag prod:  ${prodScript.tag}`)
        if (localScript.body !== prodScript.body) {
          console.error('    conteúdo do script também difere — o hash sha256 do CSP não bate mais,')
          console.error('    o navegador vai bloquear a execução em silêncio.')
        }
      }
    } else if (!prodScript) {
      console.error('')
      console.error('  ⚠ Nenhum <script> executável encontrado em produção — sumiu ou foi renomeado.')
    }
  }

  console.log('')
  if (failed) {
    console.error('FALHA: produção não é bit-a-bit igual ao local. Não confiar neste deploy.')
    process.exitCode = 1
    return
  }
  console.log('OK: produção é bit-a-bit igual ao local.')
  process.exitCode = 0
}

// process.exitCode (não process.exit()) de propósito: encerrar à força enquanto o
// fetch ainda fecha os sockets keep-alive derruba o processo com um crash de libuv
// no Windows (UV_HANDLE_CLOSING) — o código de saída reportado fica indefinido.
main().catch((err) => {
  console.error('erro ao rodar a comparação:', err)
  process.exitCode = 1
})
