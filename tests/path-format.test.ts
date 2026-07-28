import { describe, expect, it } from 'vitest'
import { decodeChannelSegments, encodeChannelSegments } from '@/core/path-format'
import type { ChannelFamilyTarget } from '@/core/types'

describe('encodeChannelSegments / decodeChannelSegments — ida e volta', () => {
  const cases: ChannelFamilyTarget[] = [
    { kind: 'channelId', id: 'UCX6OQ3DkcsbYNE6H8uQQuVA' },
    { kind: 'handle', handle: 'MrBeast' },
    { kind: 'vanity', name: 'veritasium' },
    { kind: 'user', name: 'PewDiePie' },
  ]

  for (const target of cases) {
    it(`${target.kind}: decode(encode(x)) === x`, () => {
      const segments = encodeChannelSegments(target)
      const decoded = decodeChannelSegments(segments)
      expect(decoded).toEqual(target)
    })
  }

  it('handle é codificado como @nome (formato atual — trocar aqui, e só aqui, se precisar mudar)', () => {
    expect(encodeChannelSegments({ kind: 'handle', handle: 'MrBeast' })).toEqual(['@MrBeast'])
  })

  it('vanity vira dois segmentos: c, nome', () => {
    expect(encodeChannelSegments({ kind: 'vanity', name: 'veritasium' })).toEqual(['c', 'veritasium'])
  })

  it('user vira dois segmentos: user, nome', () => {
    expect(encodeChannelSegments({ kind: 'user', name: 'PewDiePie' })).toEqual(['user', 'PewDiePie'])
  })
})

describe('decodeChannelSegments — recusas', () => {
  it('segmento único que não é ID de canal nem começa com @ -> null', () => {
    expect(decodeChannelSegments(['naoehandle'])).toBeNull()
  })

  it('handle malformado (corpo com espaço) -> null', () => {
    expect(decodeChannelSegments(['@nome com espaco'])).toBeNull()
  })

  it('dois segmentos com prefixo desconhecido -> null', () => {
    expect(decodeChannelSegments(['x', 'nome'])).toBeNull()
  })

  it('três segmentos ou mais -> null (aba de canal, ex: /c/@nome/videos)', () => {
    expect(decodeChannelSegments(['c', 'nome', 'videos'])).toBeNull()
  })

  it('zero segmentos -> null', () => {
    expect(decodeChannelSegments([])).toBeNull()
  })
})
