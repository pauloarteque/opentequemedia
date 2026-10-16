/**
 * /v/{id} (e /s, /c, /p) -> Alvo | Recusa. Usado pelas rotas do servidor, lendo os
 * segmentos que o Next.js já extraiu (e decodificou) do caminho. Ver SPEC.md §3.
 */
import { isPersonalPlaylistId, isPlaylistId, isVideoId, leadingIdRun } from './ids'
import { cutChannelSegmentsAtPastedText, decodeChannelSegments } from './path-format'
import { parseTimestamp } from './timestamp'
import { fail, ok } from './types'
import type { OpenPrefix } from './constants'
import type { ParseResult } from './types'

export function parseOpenPath(prefix: OpenPrefix, segments: readonly string[], query: URLSearchParams): ParseResult {
  // Nenhum ID nosso contém '%'. O Next.js já decodificou o caminho uma vez, então um
  // '%' que sobrou é resíduo de codificação dupla ou tentativa de ataque. Recusa direta,
  // nunca decodifica de novo, e vale também para o aproveitamento de texto colado.
  if (segments.some((s) => s.includes('%'))) {
    return fail('PERCENT_ENCODED_SEGMENT')
  }

  const exact = parseExactPath(prefix, segments, query)
  if (exact.ok) return exact

  const salvaged = parsePathWithPastedText(prefix, segments, query)
  return salvaged?.ok ? salvaged : exact
}

function parseExactPath(prefix: OpenPrefix, segments: readonly string[], query: URLSearchParams): ParseResult {
  switch (prefix) {
    case 'v': {
      if (segments.length !== 1) return fail('WRONG_SEGMENT_COUNT')
      const id = segments[0]
      if (id === undefined || !isVideoId(id)) return fail('MALFORMED_VIDEO_ID')

      let startSeconds: number | null = null
      const tRaw = query.get('t')
      if (tRaw !== null && tRaw !== '') {
        const t = parseTimestamp(tRaw)
        if (!t.ok) return fail(t.reason)
        startSeconds = t.seconds
      }
      return ok({ kind: 'video', id, startSeconds })
    }

    case 's': {
      if (segments.length !== 1) return fail('WRONG_SEGMENT_COUNT')
      const id = segments[0]
      if (id === undefined || !isVideoId(id)) return fail('MALFORMED_VIDEO_ID')
      return ok({ kind: 'short', id })
    }

    case 'c': {
      const target = decodeChannelSegments(segments)
      if (!target) return fail('WRONG_SEGMENT_COUNT')
      return ok(target)
    }

    case 'p': {
      if (segments.length !== 1) return fail('WRONG_SEGMENT_COUNT')
      const id = segments[0]
      if (id === undefined) return fail('MALFORMED_PLAYLIST_ID')
      if (isPersonalPlaylistId(id)) return fail('PERSONAL_PLAYLIST', id)
      if (!isPlaylistId(id)) return fail('MALFORMED_PLAYLIST_ID')
      return ok({ kind: 'playlist', id })
    }
  }
}

/**
 * Link que chegou com texto grudado depois dele, o caso real do adesivo de Story com
 * "…/v/ID tá na mão". Só roda quando o caminho exato foi recusado, e só aceita quando o
 * identificador está INTEIRO no começo e separado do resto por um caractere que nunca
 * existe num identificador. O resto, inclusive segmentos seguintes, é descartado sem ser
 * lido. Nunca decodifica, nunca completa um identificador pela metade, e o destino
 * continua sendo montado só a partir do identificador validado. Ver SPEC.md §3.
 */
function parsePathWithPastedText(
  prefix: OpenPrefix,
  segments: readonly string[],
  query: URLSearchParams,
): ParseResult | null {
  const first = segments[0]
  if (first === undefined) return null

  if (prefix === 'c') {
    const cut = cutChannelSegmentsAtPastedText(segments)
    return cut ? parseExactPath('c', cut, query) : null
  }

  // Em /v o texto também pode ter ido parar no ?t= ("/v/ID?t=95 tá na mão").
  const cleanQuery = prefix === 'v' ? queryWithTimestampCut(query) : null
  const { run, hasTail } = leadingIdRun(first)
  if (run.length === 0 || (!hasTail && cleanQuery === null)) return null

  // Sem sobra no segmento, a evidência de texto colado está só no t=, e os segmentos
  // continuam sendo conferidos como estão (um /v/ID/x continua recusado).
  return parseExactPath(prefix, hasTail ? [run] : segments, cleanQuery ?? query)
}

/** Cópia da query com o t= cortado no primeiro espaço, ou null se não havia espaço nele.
 * O URLSearchParams já transformou "+" e "%20" em espaço. */
function queryWithTimestampCut(query: URLSearchParams): URLSearchParams | null {
  const t = query.get('t')
  if (t === null || !/\s/.test(t)) return null
  const copy = new URLSearchParams(query)
  copy.set('t', t.split(/\s/)[0] ?? '')
  return copy
}

const OPEN_PREFIXES: readonly string[] = ['v', 's', 'c', 'p']

/**
 * Um link do próprio Open (já gerado) -> Alvo | Recusa, como a rota leria. Usado pelo
 * gerador para saber se um link do Open colado de volta está inteiro antes de dizer que
 * ele pode ser usado. Decodifica cada segmento uma vez, como o Next.js faz na rota.
 */
export function parseOpenUrl(url: URL): ParseResult {
  const [prefix, ...rest] = url.pathname.split('/').filter((s) => s.length > 0)
  if (prefix === undefined || !OPEN_PREFIXES.includes(prefix)) return fail('UNKNOWN_PREFIX')
  const segments: string[] = []
  for (const raw of rest) {
    try {
      segments.push(decodeURIComponent(raw))
    } catch {
      return fail('PERCENT_ENCODED_SEGMENT')
    }
  }
  return parseOpenPath(prefix as OpenPrefix, segments, url.searchParams)
}
