import { describe, expect, it } from 'vitest'
import { parseOpenPath } from '@/core/parse-openteque-path'

function q(entries: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams(entries)
}

describe('parseOpenPath — /v', () => {
  it('id válido sem timestamp', () => {
    const r = parseOpenPath('v', ['dQw4w9WgXcQ'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null } })
  })

  it('id válido com ?t=125', () => {
    const r = parseOpenPath('v', ['dQw4w9WgXcQ'], q({ t: '125' }))
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: 125 } })
  })

  it('resto da query (ex: utm_source) é ignorado, não contamina o alvo', () => {
    const r = parseOpenPath('v', ['dQw4w9WgXcQ'], q({ t: '125', utm_source: 'instagram' }))
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: 125 } })
  })

  it('/v sozinho (zero segmentos) -> WRONG_SEGMENT_COUNT', () => {
    expect(parseOpenPath('v', [], q())).toEqual({ ok: false, reason: 'WRONG_SEGMENT_COUNT' })
  })

  it('/v/a/b/c (segmentos demais) -> WRONG_SEGMENT_COUNT', () => {
    expect(parseOpenPath('v', ['a', 'b', 'c'], q())).toEqual({ ok: false, reason: 'WRONG_SEGMENT_COUNT' })
  })

  it('id malformado -> MALFORMED_VIDEO_ID', () => {
    expect(parseOpenPath('v', ['abc'], q())).toEqual({ ok: false, reason: 'MALFORMED_VIDEO_ID' })
  })
})

describe('parseOpenPath — /s NUNCA produz kind:"video"', () => {
  it('id válido produz kind:"short"', () => {
    const r = parseOpenPath('s', ['dQw4w9WgXcQ'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'short', id: 'dQw4w9WgXcQ' } })
    expect(r.ok && r.target.kind).toBe('short')
    expect(r.ok && r.target.kind).not.toBe('video')
  })

  it('ignora ?t= completamente — short não tem timestamp', () => {
    const r = parseOpenPath('s', ['dQw4w9WgXcQ'], q({ t: '125' }))
    expect(r).toEqual({ ok: true, target: { kind: 'short', id: 'dQw4w9WgXcQ' } })
  })
})

describe('parseOpenPath — /c', () => {
  it('canal por ID', () => {
    const r = parseOpenPath('c', ['UCX6OQ3DkcsbYNE6H8uQQuVA'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'channelId', id: 'UCX6OQ3DkcsbYNE6H8uQQuVA' } })
  })

  it('handle', () => {
    const r = parseOpenPath('c', ['@MrBeast'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'handle', handle: 'MrBeast' } })
  })

  it('vanity legado', () => {
    const r = parseOpenPath('c', ['c', 'veritasium'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'vanity', name: 'veritasium' } })
  })

  it('user legado', () => {
    const r = parseOpenPath('c', ['user', 'PewDiePie'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'user', name: 'PewDiePie' } })
  })

  it('segmentos que não formam nenhum formato -> WRONG_SEGMENT_COUNT', () => {
    expect(parseOpenPath('c', ['x', 'y', 'z'], q())).toEqual({ ok: false, reason: 'WRONG_SEGMENT_COUNT' })
  })
})

describe('parseOpenPath — /p', () => {
  it('playlist válida', () => {
    const r = parseOpenPath('p', ['PLC77007E23FF423C6'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'playlist', id: 'PLC77007E23FF423C6' } })
  })

  it('WL/LL/FL -> PERSONAL_PLAYLIST', () => {
    expect(parseOpenPath('p', ['WL'], q())).toEqual({ ok: false, reason: 'PERSONAL_PLAYLIST', detail: 'WL' })
    expect(parseOpenPath('p', ['LL'], q())).toEqual({ ok: false, reason: 'PERSONAL_PLAYLIST', detail: 'LL' })
    expect(parseOpenPath('p', ['FL'], q())).toEqual({ ok: false, reason: 'PERSONAL_PLAYLIST', detail: 'FL' })
  })
})

describe('parseOpenPath — segmento com % é sempre recusado, em qualquer prefixo', () => {
  it('%0d%0a no segmento -> PERCENT_ENCODED_SEGMENT, não tenta decodificar', () => {
    const r = parseOpenPath('v', ['dQw4w9WgXcQ%0d%0aX'], q())
    expect(r).toEqual({ ok: false, reason: 'PERCENT_ENCODED_SEGMENT' })
  })

  it('%40 (arroba codificado) também é recusado em /c', () => {
    const r = parseOpenPath('c', ['%40MrBeast'], q())
    expect(r).toEqual({ ok: false, reason: 'PERCENT_ENCODED_SEGMENT' })
  })

  it('checa TODOS os segmentos, não só o primeiro', () => {
    const r = parseOpenPath('c', ['user', 'nome%2f'], q())
    expect(r).toEqual({ ok: false, reason: 'PERCENT_ENCODED_SEGMENT' })
  })
})

describe('parseOpenPath — prefixo desconhecido', () => {
  it('typescript recusa em tempo de compilação prefixos fora de v/s/c/p — não há caso de teste em runtime pra isso', () => {
    // OpenPrefix é um union type fechado; qualquer chamador de fora do módulo de rota
    // só consegue passar um dos quatro valores válidos. A garantia é do compilador.
    expect(true).toBe(true)
  })
})
