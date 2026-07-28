/**
 * Aceita 125 | 125s | 1h2m3s (qualquer subconjunto h/m/s, nessa ordem). Emite sempre
 * segundos. Rejeita decimal. Ver SPEC.md §3.
 */

export type TimestampFailureReason = 'MALFORMED_TIMESTAMP' | 'FRACTIONAL_TIMESTAMP' | 'TIMESTAMP_OUT_OF_RANGE'

export type TimestampResult = { ok: true; seconds: number } | { ok: false; reason: TimestampFailureReason }

/** 99h59m59s. Generoso o bastante para qualquer vídeo real, sem permitir números absurdos. */
export const MAX_TIMESTAMP_SECONDS = 359_999

const PLAIN_RE = /^\d+$/
const PLAIN_S_RE = /^(\d+)s$/
const HMS_RE = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/

export function parseTimestamp(raw: string): TimestampResult {
  if (raw === '') return { ok: false, reason: 'MALFORMED_TIMESTAMP' }
  if (raw.includes('.') || raw.includes(',')) return { ok: false, reason: 'FRACTIONAL_TIMESTAMP' }

  if (PLAIN_RE.test(raw)) {
    return finish(Number(raw))
  }

  const plainSMatch = PLAIN_S_RE.exec(raw)
  if (plainSMatch) {
    return finish(Number(plainSMatch[1]))
  }

  const hmsMatch = HMS_RE.exec(raw)
  if (hmsMatch && hmsMatch[0] === raw && (hmsMatch[1] !== undefined || hmsMatch[2] !== undefined || hmsMatch[3] !== undefined)) {
    const hours = hmsMatch[1] !== undefined ? Number(hmsMatch[1]) : 0
    const minutes = hmsMatch[2] !== undefined ? Number(hmsMatch[2]) : 0
    const seconds = hmsMatch[3] !== undefined ? Number(hmsMatch[3]) : 0
    return finish(hours * 3600 + minutes * 60 + seconds)
  }

  return { ok: false, reason: 'MALFORMED_TIMESTAMP' }
}

function finish(seconds: number): TimestampResult {
  if (seconds > MAX_TIMESTAMP_SECONDS) return { ok: false, reason: 'TIMESTAMP_OUT_OF_RANGE' }
  return { ok: true, seconds }
}
