import { describe, expect, it } from 'vitest'
import { renderBotPage } from '@/server/bot-page'
import type { YouTubeTarget } from '@/core/types'

const VIDEO_TARGET: YouTubeTarget = { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null }
const DESTINATION = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

describe('renderBotPage — estrutura', () => {
  it('tem og:title, og:url, og:image absoluto, sem intent:// e sem o rótulo do botão', () => {
    const html = renderBotPage(VIDEO_TARGET, DESTINATION, {
      title: 'Um vídeo qualquer',
      imageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      imageWidth: 1280,
      imageHeight: 720,
    })

    expect(html).toContain('property="og:title"')
    expect(html).toContain(`property="og:url" content="${DESTINATION}"`)
    expect(html).toContain('property="og:image" content="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"')
    expect(html).not.toContain('intent://')
    expect(html).not.toContain('Abrir no YouTube')
    expect(html).not.toContain('TEQUEMEDIA')
  })

  it('sem imagem: ainda produz título e url, sem quebrar', () => {
    const html = renderBotPage(VIDEO_TARGET, DESTINATION, {
      title: null,
      imageUrl: null,
      imageWidth: 0,
      imageHeight: 0,
    })

    expect(html).toContain('property="og:title"')
    expect(html).not.toContain('property="og:image"')
  })
})

describe('renderBotPage — título hostil escapado', () => {
  it('aspas, colchetes e </script> no título não quebram o atributo nem o documento', () => {
    const html = renderBotPage(VIDEO_TARGET, DESTINATION, {
      title: `Título "com aspas" e </script><script>alert(1)</script>`,
      imageUrl: null,
      imageWidth: 0,
      imageHeight: 0,
    })

    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&quot;com aspas&quot;')
  })
})
