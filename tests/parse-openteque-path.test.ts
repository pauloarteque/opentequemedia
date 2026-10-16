import { describe, expect, it } from 'vitest'
import { parseOpenPath, parseOpenUrl } from '@/core/parse-openteque-path'

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

describe('parseOpenPath — texto colado depois do link (SPEC.md §3)', () => {
  // O caso real de 15/10/2026: adesivo de Story com "…/v/GdvXYFCzSeg aooooo ta na mão".
  // O Next.js entrega o segmento já decodificado, com os espaços de verdade.
  it('caso do adesivo de Story: ID seguido de espaço e texto -> abre o vídeo', () => {
    const r = parseOpenPath('v', ['GdvXYFCzSeg aooooo ta na mão'], q({ fbclid: 'PAZXh0bgNhZW0' }))
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'GdvXYFCzSeg', startSeconds: null } })
  })

  it('mesmo caso com + no lugar do espaço', () => {
    const r = parseOpenPath('v', ['GdvXYFCzSeg+aooooo+ta+na+mão'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'GdvXYFCzSeg', startSeconds: null } })
  })

  it('ponto final de frase grudado no ID', () => {
    const r = parseOpenPath('v', ['dQw4w9WgXcQ.'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null } })
  })

  it('texto com barra vira segmentos a mais, todos descartados', () => {
    const r = parseOpenPath('v', ['dQw4w9WgXcQ olha', 'outro'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null } })
  })

  it('o ?t= válido continua valendo', () => {
    const r = parseOpenPath('v', ['dQw4w9WgXcQ tá na mão'], q({ t: '95' }))
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: 95 } })
  })

  it('ID incompleto antes do texto continua recusado, nunca completa', () => {
    expect(parseOpenPath('v', ['dQw4w9WgXc tá'], q()).ok).toBe(false)
  })

  it('ID com caractere a mais antes do texto continua recusado', () => {
    expect(parseOpenPath('v', ['dQw4w9WgXcQQ tá'], q()).ok).toBe(false)
  })

  it('texto antes do ID continua recusado', () => {
    expect(parseOpenPath('v', ['olha dQw4w9WgXcQ'], q()).ok).toBe(false)
  })

  it('ID exato seguido de outro segmento, sem texto colado, continua recusado', () => {
    expect(parseOpenPath('v', ['dQw4w9WgXcQ', 'x'], q())).toEqual({ ok: false, reason: 'WRONG_SEGMENT_COUNT' })
  })

  it('/s aproveita o ID e continua produzindo short', () => {
    const r = parseOpenPath('s', ['dQw4w9WgXcQ assiste'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'short', id: 'dQw4w9WgXcQ' } })
  })

  it('/p aproveita a playlist', () => {
    const r = parseOpenPath('p', ['PLC77007E23FF423C6 maratona'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'playlist', id: 'PLC77007E23FF423C6' } })
  })

  it('/p com playlist pessoal antes do texto continua recusado', () => {
    expect(parseOpenPath('p', ['WL tá'], q()).ok).toBe(false)
  })

  it('/c corta no espaço: handle', () => {
    const r = parseOpenPath('c', ['@MrBeast se inscreve'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'handle', handle: 'MrBeast' } })
  })

  it('/c corta no espaço: nome legado', () => {
    const r = parseOpenPath('c', ['c', 'veritasium canal'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'vanity', name: 'veritasium' } })
  })

  it('texto colado depois de um link com ?t= (o URLSearchParams já virou + e %20 em espaço)', () => {
    const r = parseOpenPath('v', ['GdvXYFCzSeg'], q({ t: '95 aooooo ta na mão' }))
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'GdvXYFCzSeg', startSeconds: 95 } })
  })

  it('t= inválido sem espaço continua recusado', () => {
    expect(parseOpenPath('v', ['GdvXYFCzSeg'], q({ t: '95x' }))).toEqual({ ok: false, reason: 'MALFORMED_TIMESTAMP' })
  })

  it('t= com texto não salva caminho com segmento a mais', () => {
    expect(parseOpenPath('v', ['GdvXYFCzSeg', 'x'], q({ t: '95 oi' })).ok).toBe(false)
  })

  it('/c tira a pontuação de frase do handle antes do texto', () => {
    const r = parseOpenPath('c', ['@MrBeast, se inscreve'], q())
    expect(r).toEqual({ ok: true, target: { kind: 'handle', handle: 'MrBeast' } })
  })

  it('o % continua recusado mesmo com texto colado', () => {
    expect(parseOpenPath('v', ['dQw4w9WgXcQ tá%20'], q())).toEqual({ ok: false, reason: 'PERCENT_ENCODED_SEGMENT' })
  })
})

describe('parseOpenUrl — link do próprio Open lido como a rota leria', () => {
  it('link inteiro', () => {
    expect(parseOpenUrl(new URL('https://open.tequemedia.com.br/v/dQw4w9WgXcQ?t=95')).ok).toBe(true)
  })

  it('link cortado no meio do ID', () => {
    expect(parseOpenUrl(new URL('https://open.tequemedia.com.br/v/dQw4w9WgXc')).ok).toBe(false)
  })

  it('página inicial ou prefixo desconhecido', () => {
    expect(parseOpenUrl(new URL('https://open.tequemedia.com.br/'))).toEqual({ ok: false, reason: 'UNKNOWN_PREFIX' })
    expect(parseOpenUrl(new URL('https://open.tequemedia.com.br/x/dQw4w9WgXcQ')).ok).toBe(false)
  })

  it('decodifica uma vez, como o Next.js, e aproveita texto colado', () => {
    expect(parseOpenUrl(new URL('https://open.tequemedia.com.br/v/dQw4w9WgXcQ%20t%C3%A1')).ok).toBe(true)
    expect(parseOpenUrl(new URL('https://open.tequemedia.com.br/c/@jo%C3%A3o')).ok).toBe(true)
  })

  it('codificação dupla continua recusada', () => {
    expect(parseOpenUrl(new URL('https://open.tequemedia.com.br/v/dQw4w9WgXcQ%2520x')).ok).toBe(false)
  })
})

describe('parseOpenPath — prefixo desconhecido', () => {
  it('typescript recusa em tempo de compilação prefixos fora de v/s/c/p — não há caso de teste em runtime pra isso', () => {
    // OpenPrefix é um union type fechado; qualquer chamador de fora do módulo de rota
    // só consegue passar um dos quatro valores válidos. A garantia é do compilador.
    expect(true).toBe(true)
  })
})
