import { describe, expect, it } from 'vitest'
import { buildAndroidIntentUrl, buildIosButtonHref, buildIosSchemeChain, renderSmartPage } from '@/server/smart-page'
import type { YouTubeTarget } from '@/core/types'

const VIDEO_TARGET: YouTubeTarget = { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null }
const VIDEO_DESTINATION = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

describe('buildAndroidIntentUrl', () => {
  it('inclui scheme=https e package=com.google.android.youtube', () => {
    const url = buildAndroidIntentUrl(VIDEO_DESTINATION)
    expect(url.startsWith('intent://www.youtube.com/watch?v=dQw4w9WgXcQ#Intent;')).toBe(true)
    expect(url).toContain('scheme=https')
    expect(url).toContain('package=com.google.android.youtube')
    expect(url).toContain('S.browser_fallback_url=')
    expect(url.endsWith(';end')).toBe(true)
  })
})

describe('buildIosSchemeChain', () => {
  it('vídeo/short: 5 tentativas, terminando em x-safari-https', () => {
    const chain = buildIosSchemeChain(VIDEO_TARGET, VIDEO_DESTINATION)
    expect(chain).toEqual([
      'youtube://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'youtube://dQw4w9WgXcQ',
      'vnd.youtube://dQw4w9WgXcQ',
      'vnd.youtube://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'x-safari-https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ])
  })

  it('canal: sem os atalhos de ID isolado (nunca testados em aparelho para esse caso)', () => {
    const target: YouTubeTarget = { kind: 'handle', handle: 'MrBeast' }
    const destination = 'https://www.youtube.com/@MrBeast'
    const chain = buildIosSchemeChain(target, destination)
    expect(chain).toEqual([
      'youtube://www.youtube.com/@MrBeast',
      'vnd.youtube://www.youtube.com/@MrBeast',
      'x-safari-https://www.youtube.com/@MrBeast',
    ])
  })
})

describe('buildIosButtonHref', () => {
  it('é sempre x-safari-https, nunca youtube://', () => {
    const href = buildIosButtonHref(VIDEO_DESTINATION)
    expect(href).toBe('x-safari-https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(href.startsWith('youtube://')).toBe(false)
  })
})

describe('renderSmartPage — estrutura e ausência de marca', () => {
  const base = { target: VIDEO_TARGET, destination: VIDEO_DESTINATION, title: null, thumbnailUrl: null }

  it('Android: link estático presente, botão com intent', () => {
    const html = renderSmartPage({ ...base, platform: 'android' })
    expect(html).toContain('Não abriu? Toque aqui para assistir')
    expect(html).toContain('intent://')
    expect(html).toContain('package=com.google.android.youtube')
  })

  it('iOS: link estático AUSENTE (decisão registrada — app-ausente nunca testado)', () => {
    const html = renderSmartPage({ ...base, platform: 'ios' })
    expect(html).not.toContain('Não abriu? Toque aqui para assistir')
    expect(html).toContain('x-safari-https://')
  })

  it('zero marca: nenhuma ocorrência de TEQUEMEDIA em nenhuma plataforma', () => {
    expect(renderSmartPage({ ...base, platform: 'android' })).not.toContain('TEQUEMEDIA')
    expect(renderSmartPage({ ...base, platform: 'ios' })).not.toContain('TEQUEMEDIA')
  })

  it('zero pipeline do Next: sem /_next/, sem <link rel="stylesheet">', () => {
    const html = renderSmartPage({ ...base, platform: 'android' })
    expect(html).not.toContain('/_next/')
    expect(html).not.toContain('rel="stylesheet"')
  })

  it('tamanho abaixo de 5 KB', () => {
    const html = renderSmartPage({ ...base, platform: 'android', title: 'Um título de vídeo razoável' })
    expect(new TextEncoder().encode(html).length).toBeLessThan(5 * 1024)
  })

  it('o único rótulo de texto é funcional — "Abrir no YouTube"', () => {
    const html = renderSmartPage({ ...base, platform: 'android' })
    expect(html).toContain('Abrir no YouTube')
  })
})

describe('renderSmartPage — título hostil não quebra o HTML', () => {
  const hostileTitle = `Título com "aspas", acentuação, </script><script>alert(1)</script> e & comercial`

  it('não produz uma tag </script> literal fora do bloco de configuração JSON', () => {
    const html = renderSmartPage({
      target: VIDEO_TARGET,
      destination: VIDEO_DESTINATION,
      platform: 'android',
      title: hostileTitle,
      thumbnailUrl: null,
    })

    // As duas tags de script legítimas (config + script embutido) devem ser as ÚNICAS
    // ocorrências de "</script" no documento — nenhuma extra vinda do título.
    const scriptCloseCount = (html.match(/<\/script>/g) ?? []).length
    expect(scriptCloseCount).toBe(2)
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('o título aparece escapado como texto, não como marcação', () => {
    const html = renderSmartPage({
      target: VIDEO_TARGET,
      destination: VIDEO_DESTINATION,
      platform: 'android',
      title: hostileTitle,
      thumbnailUrl: null,
    })
    expect(html).toContain('&lt;/script&gt;')
    expect(html).toContain('&amp;')
  })
})
