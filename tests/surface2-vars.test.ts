/**
 * Toda variável CSS que as páginas da superfície 2 usam precisa existir no bloco de tokens
 * que elas mesmas embutem. Variável inexistente não quebra nada à vista, só faz o navegador
 * ignorar a regra. Foi assim que o título da página inteligente ficou no tamanho padrão.
 */
import { describe, expect, it } from 'vitest'
import { ERROR_PAGE_TOKEN_NAMES, SMART_PAGE_TOKEN_NAMES, subsetTokensToCssVars } from '@/core/tokens'
import { renderErrorPage } from '@/server/error-page'
import { renderSmartPage } from '@/server/smart-page'

function undefinedVars(html: string, css: string): string[] {
  const defined = new Set([...css.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]))
  const used = new Set([...html.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1] ?? ''))
  return [...used].filter((v) => !defined.has(v))
}

describe('superfície 2 — variáveis CSS usadas existem', () => {
  it('página inteligente, Android e iOS', () => {
    const css = subsetTokensToCssVars(SMART_PAGE_TOKEN_NAMES)
    for (const platform of ['android', 'ios'] as const) {
      const html = renderSmartPage({
        target: { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null },
        destination: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        platform,
        title: 'Título',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      })
      expect(undefinedVars(html, css)).toEqual([])
    }
  })

  it('página de link quebrado', () => {
    expect(undefinedVars(renderErrorPage(), subsetTokensToCssVars(ERROR_PAGE_TOKEN_NAMES))).toEqual([])
  })
})

describe('página de link quebrado', () => {
  const html = renderErrorPage()

  it('sem marca e sem pipeline do Next', () => {
    expect(html).not.toContain('TEQUEMEDIA')
    expect(html.toLowerCase()).not.toContain('tequemedia')
    expect(html).not.toContain('/_next/')
    expect(html).not.toContain('rel="stylesheet"')
  })

  it('sem script e com uma única saída, a página inicial do YouTube', () => {
    expect(html).not.toContain('<script')
    expect([...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1])).toEqual(['https://www.youtube.com/'])
  })

  it('diz o que aconteceu e o que fazer', () => {
    expect(html).toContain('<title>Link quebrado</title>')
    expect(html).toContain('Esse link chegou quebrado')
    expect(html).toContain('Ir para o YouTube')
  })
})
