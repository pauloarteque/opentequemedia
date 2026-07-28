/**
 * /v/{id} (e /s, /c, /p) -> Alvo | Recusa. Usado pelas rotas do servidor, lendo os
 * segmentos que o Next.js já extraiu do caminho. Ver SPEC.md §3.
 */
import { isPersonalPlaylistId, isPlaylistId, isVideoId } from './ids'
import { decodeChannelSegments } from './path-format'
import { parseTimestamp } from './timestamp'
import { fail, ok } from './types'
import type { OpenPrefix } from './constants'
import type { ParseResult } from './types'

export function parseOpenPath(prefix: OpenPrefix, segments: readonly string[], query: URLSearchParams): ParseResult {
  // Nenhum ID nosso contém '%'. Qualquer segmento com '%' é um resíduo de
  // codificação ou uma tentativa de ataque — recusa direta, nunca decodifica de novo.
  if (segments.some((s) => s.includes('%'))) {
    return fail('PERCENT_ENCODED_SEGMENT')
  }

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
