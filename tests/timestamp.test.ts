import { describe, expect, it } from 'vitest'
import { parseTimestamp } from '@/core/timestamp'

function seconds(raw: string): number {
  const r = parseTimestamp(raw)
  if (!r.ok) throw new Error(`esperava sucesso para "${raw}", veio recusa: ${r.reason}`)
  return r.seconds
}

function reason(raw: string): string {
  const r = parseTimestamp(raw)
  if (r.ok) throw new Error(`esperava recusa para "${raw}", veio sucesso: ${r.seconds}`)
  return r.reason
}

describe('parseTimestamp — formas aceitas', () => {
  it('número puro é segundos', () => {
    expect(seconds('125')).toBe(125)
    expect(seconds('0')).toBe(0)
  })

  it('número com sufixo s', () => {
    expect(seconds('125s')).toBe(125)
  })

  it('h/m/s combinados', () => {
    expect(seconds('1h2m3s')).toBe(3723)
    expect(seconds('2m')).toBe(120)
    expect(seconds('1h')).toBe(3600)
  })
})

describe('parseTimestamp — formas recusadas, com motivos distintos', () => {
  it('decimal é FRACTIONAL_TIMESTAMP, não MALFORMED', () => {
    expect(reason('12.5')).toBe('FRACTIONAL_TIMESTAMP')
    expect(reason('1.5m')).toBe('FRACTIONAL_TIMESTAMP')
  })

  it('negativo é MALFORMED_TIMESTAMP', () => {
    expect(reason('-5')).toBe('MALFORMED_TIMESTAMP')
  })

  it('unidade repetida fora de ordem é MALFORMED_TIMESTAMP', () => {
    expect(reason('1h2m3s4h')).toBe('MALFORMED_TIMESTAMP')
  })

  it('unidade sem número é MALFORMED_TIMESTAMP (prova que não é regex solta)', () => {
    expect(reason('m5s')).toBe('MALFORMED_TIMESTAMP')
  })

  it('valor absurdo é TIMESTAMP_OUT_OF_RANGE, reason distinto de MALFORMED', () => {
    expect(reason('999h')).toBe('TIMESTAMP_OUT_OF_RANGE')
  })

  it('vazio é MALFORMED_TIMESTAMP', () => {
    expect(reason('')).toBe('MALFORMED_TIMESTAMP')
  })

  it('lixo alfabético é MALFORMED_TIMESTAMP', () => {
    expect(reason('abc')).toBe('MALFORMED_TIMESTAMP')
  })
})
