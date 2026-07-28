import { describe, expect, it } from 'vitest'
import { isAllowedHost, parseShareUrl } from '@/core/parse-youtube-url'

describe('isAllowedHost — comparação exata, nunca substring', () => {
  it('aceita os hosts da allowlist, incluindo maiúsculas', () => {
    expect(isAllowedHost('youtube.com')).toBe(true)
    expect(isAllowedHost('WWW.YOUTUBE.COM')).toBe(true)
    expect(isAllowedHost('m.youtube.com')).toBe(true)
    expect(isAllowedHost('music.youtube.com')).toBe(true)
    expect(isAllowedHost('youtu.be')).toBe(true)
    expect(isAllowedHost('youtube-nocookie.com')).toBe(true)
  })

  it('aceita com ponto final (youtube.com.)', () => {
    expect(isAllowedHost('youtube.com.')).toBe(true)
  })

  it('recusa host que CONTÉM youtube.com mas não é igual', () => {
    expect(isAllowedHost('youtube.com.evil.tld')).toBe(false)
    expect(isAllowedHost('notyoutube.com')).toBe(false)
    expect(isAllowedHost('myyoutube.com')).toBe(false)
    expect(isAllowedHost('evil-youtube.com')).toBe(false)
  })
})

describe('parseShareUrl — entrada inválida', () => {
  it('vazio', () => {
    expect(parseShareUrl('')).toEqual({ ok: false, reason: 'EMPTY_INPUT' })
    expect(parseShareUrl('   ')).toEqual({ ok: false, reason: 'EMPTY_INPUT' })
  })

  it('excede o tamanho máximo', () => {
    const huge = `https://youtube.com/watch?v=${'a'.repeat(3000)}`
    expect(parseShareUrl(huge)).toEqual({ ok: false, reason: 'INPUT_TOO_LONG' })
  })

  it('esquema não suportado (javascript:)', () => {
    const r = parseShareUrl('javascript:alert(1)')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('UNSUPPORTED_SCHEME')
  })

  it('texto que não forma URL válida nem com https:// na frente', () => {
    const r = parseShareUrl('!!!not a url///')
    expect(r.ok).toBe(false)
  })
})

describe('parseShareUrl — o truque do userinfo (@) no host', () => {
  it('https://youtube.com@evil.com/watch?v=X é recusado: o host real é evil.com', () => {
    const r = parseShareUrl('https://youtube.com@evil.com/watch?v=dQw4w9WgXcQ')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe('HOST_NOT_ALLOWED')
      expect(r.detail).toBe('evil.com')
    }
  })
})

describe('parseShareUrl — vídeo', () => {
  it('watch?v= simples', () => {
    const r = parseShareUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null } })
  })

  it('youtu.be curto', () => {
    const r = parseShareUrl('https://youtu.be/dQw4w9WgXcQ')
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null } })
  })

  it('youtu.be com si= e t= — si é ignorado, t=125 vira 125 segundos', () => {
    const r = parseShareUrl('https://youtu.be/dQw4w9WgXcQ?si=AbCdEf&t=125')
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: 125 } })
  })

  it('t=1h2m3s vira 3723 segundos', () => {
    const r = parseShareUrl('https://youtu.be/dQw4w9WgXcQ?t=1h2m3s')
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: 3723 } })
  })

  it('watch sem v= é MISSING_VIDEO_ID', () => {
    const r = parseShareUrl('https://www.youtube.com/watch?list=PLxxxxxxxxxxxxxxxx')
    expect(r).toEqual({ ok: false, reason: 'MISSING_VIDEO_ID' })
  })

  it('/live/ID vira vídeo', () => {
    const r = parseShareUrl('https://www.youtube.com/live/dQw4w9WgXcQ')
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null } })
  })

  it('watch?v=ID&list=PL... emite vídeo e sinaliza playlist ignorada (não bloqueia)', () => {
    const r = parseShareUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLC77007E23FF423C6')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.target).toEqual({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null })
      expect(r.ignoredPlaylist).toBe(true)
    }
  })
})

describe('parseShareUrl — short NUNCA vira watch', () => {
  it('/shorts/ID produz kind:"short", nunca kind:"video"', () => {
    const r = parseShareUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    expect(r).toEqual({ ok: true, target: { kind: 'short', id: 'dQw4w9WgXcQ' } })
    expect(r.ok && r.target.kind).not.toBe('video')
  })

  it('/shorts/ID?feature=share ainda funciona (query irrelevante ignorada)', () => {
    const r = parseShareUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share')
    expect(r).toEqual({ ok: true, target: { kind: 'short', id: 'dQw4w9WgXcQ' } })
  })
})

describe('parseShareUrl — canal, handle, legado', () => {
  it('/channel/UC...', () => {
    const r = parseShareUrl('https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA')
    expect(r).toEqual({ ok: true, target: { kind: 'channelId', id: 'UCX6OQ3DkcsbYNE6H8uQQuVA' } })
  })

  it('/@handle', () => {
    const r = parseShareUrl('https://www.youtube.com/@MrBeast')
    expect(r).toEqual({ ok: true, target: { kind: 'handle', handle: 'MrBeast' } })
  })

  it('/c/nome legado', () => {
    const r = parseShareUrl('https://www.youtube.com/c/veritasium')
    expect(r).toEqual({ ok: true, target: { kind: 'vanity', name: 'veritasium' } })
  })

  it('/user/nome legado', () => {
    const r = parseShareUrl('https://www.youtube.com/user/PewDiePie')
    expect(r).toEqual({ ok: true, target: { kind: 'user', name: 'PewDiePie' } })
  })

  it('aba de canal (/@nome/videos) é recusada', () => {
    const r = parseShareUrl('https://www.youtube.com/@MrBeast/videos')
    expect(r).toEqual({ ok: false, reason: 'UNSUPPORTED_CHANNEL_TAB', detail: '/@MrBeast/videos' })
  })
})

describe('parseShareUrl — playlist', () => {
  it('playlist normal', () => {
    const r = parseShareUrl('https://www.youtube.com/playlist?list=PLC77007E23FF423C6')
    expect(r).toEqual({ ok: true, target: { kind: 'playlist', id: 'PLC77007E23FF423C6' } })
  })

  it('WL (watch later) é PERSONAL_PLAYLIST, distinto de MALFORMED', () => {
    const r = parseShareUrl('https://www.youtube.com/playlist?list=WL')
    expect(r).toEqual({ ok: false, reason: 'PERSONAL_PLAYLIST', detail: 'WL' })
  })

  it('LL (curtidos) é PERSONAL_PLAYLIST', () => {
    const r = parseShareUrl('https://www.youtube.com/playlist?list=LL')
    expect(r).toEqual({ ok: false, reason: 'PERSONAL_PLAYLIST', detail: 'LL' })
  })

  it('FL (favoritos) é PERSONAL_PLAYLIST', () => {
    const r = parseShareUrl('https://www.youtube.com/playlist?list=FL')
    expect(r).toEqual({ ok: false, reason: 'PERSONAL_PLAYLIST', detail: 'FL' })
  })
})

describe('parseShareUrl — formatos recusados por decisão de produto, cada um com motivo próprio', () => {
  it('/clip/ -> UNSUPPORTED_CLIP', () => {
    const r = parseShareUrl('https://www.youtube.com/clip/UgkxABC123')
    expect(r).toEqual({ ok: false, reason: 'UNSUPPORTED_CLIP', detail: '/clip/UgkxABC123' })
  })

  it('/post/ -> UNSUPPORTED_POST', () => {
    const r = parseShareUrl('https://www.youtube.com/post/Ugkx123')
    expect(r).toEqual({ ok: false, reason: 'UNSUPPORTED_POST', detail: '/post/Ugkx123' })
  })

  it('/results?search_query= -> UNSUPPORTED_SEARCH', () => {
    const r = parseShareUrl('https://www.youtube.com/results?search_query=teste')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('UNSUPPORTED_SEARCH')
  })

  it('/embed/ID -> UNSUPPORTED_EMBED, nunca aceito como vídeo', () => {
    const r = parseShareUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('UNSUPPORTED_EMBED')
  })

  it('homepage nua -> UNSUPPORTED_FEED', () => {
    const r = parseShareUrl('https://www.youtube.com/')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('UNSUPPORTED_FEED')
  })

  it('caminho totalmente desconhecido -> UNKNOWN_YOUTUBE_PATH, nunca guarda o caminho pra repassar', () => {
    const r = parseShareUrl('https://www.youtube.com/gaming')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('UNKNOWN_YOUTUBE_PATH')
  })
})

describe('parseShareUrl — timestamp inválido propaga o motivo certo', () => {
  it('t=12.5 -> FRACTIONAL_TIMESTAMP', () => {
    const r = parseShareUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12.5')
    expect(r).toEqual({ ok: false, reason: 'FRACTIONAL_TIMESTAMP' })
  })
})

describe('parseShareUrl — sem protocolo explícito (tolerância de colagem)', () => {
  it('aceita sem https:// na frente', () => {
    const r = parseShareUrl('youtube.com/watch?v=dQw4w9WgXcQ')
    expect(r).toEqual({ ok: true, target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null } })
  })
})
