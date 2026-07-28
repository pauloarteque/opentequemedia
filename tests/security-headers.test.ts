/**
 * Fase 7: cabeçalhos de segurança, e a prova de que o hash do CSP bate com o script
 * realmente servido — se divergissem, o navegador bloquearia o script em silêncio e o
 * produto inteiro pararia de funcionar. Ver SPEC.md §6, §7 (fase 7 do plano de execução).
 */
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOpenHandler } from '@/route/open-handler'
import { clearMetaCacheForTests } from '@/server/youtube-meta'

const INSTAGRAM_ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 11; Mi A3 Build/RKQ1.200903.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.14 Mobile Safari/537.36 Instagram 355.0.0.37.103 Android (30/11; 320dpi; 720x1411; Xiaomi; Mi A3; laurel_sprout; qcom; pt_BR; 657300861)'

function makeRequest(path: string, ua: string): Request {
  return new Request(`http://localhost${path}`, { headers: { 'user-agent': ua } })
}

function contextFor(resto: string[]): { params: Promise<{ resto?: string[] }> } {
  return { params: Promise.resolve({ resto }) }
}

beforeEach(() => {
  clearMetaCacheForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('CSP — o hash no cabeçalho bate com o script REALMENTE servido', () => {
  it('recalcula o sha256 do <script> inline e confere com content-security-policy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede indisponível no teste')))

    const handler = createOpenHandler('v')
    const res = await handler(makeRequest('/v/dQw4w9WgXcQ', INSTAGRAM_ANDROID_UA), contextFor(['dQw4w9WgXcQ']))
    const html = await res.text()
    const csp = res.headers.get('content-security-policy')
    expect(csp).toBeTruthy()

    const hashMatch = /script-src 'sha256-([^']+)'/.exec(csp ?? '')
    expect(hashMatch).not.toBeNull()
    const declaredHash = hashMatch?.[1]

    // extrai o CONTEÚDO EXATO do <script> sem type (o embutido, não o de config JSON)
    const scriptMatch = /<script>([\s\S]*?)<\/script>\s*<\/body>/.exec(html)
    expect(scriptMatch).not.toBeNull()
    const scriptBody = scriptMatch?.[1] ?? ''

    const recomputedHash = createHash('sha256').update(scriptBody, 'utf8').digest('base64')

    expect(recomputedHash).toBe(declaredHash)
  })
})

describe('Cabeçalhos — presentes em toda resposta das rotas', () => {
  it('302 (redirect) tem cache-control, vary, x-openteque-build, referrer-policy', async () => {
    const handler = createOpenHandler('v')
    const res = await handler(
      makeRequest('/v/dQw4w9WgXcQ', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0 Safari/537.36'),
      contextFor(['dQw4w9WgXcQ']),
    )

    expect(res.status).toBe(302)
    expect(res.headers.get('cache-control')).toContain('no-store')
    expect(res.headers.get('vary')).toBe('User-Agent')
    expect(res.headers.get('x-openteque-build')).toBeTruthy()
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('404 (erro) tem x-robots-tag noindex e content-security-policy restritiva', async () => {
    const handler = createOpenHandler('v')
    const res = await handler(makeRequest('/v/xxx', 'qualquer'), contextFor(['xxx']))

    expect(res.status).toBe(404)
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(res.headers.get('content-security-policy')).toBe("default-src 'none'")
  })
})

describe('Título hostil pela ROTA inteira (não só a função isolada)', () => {
  it('aspas, acento e </script> não quebram o HTML servido de ponta a ponta', async () => {
    const hostileTitle = `Título "com aspas", acentuação à vontade, </script><script>alert(1)</script>`
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: hostileTitle,
            author_name: 'x',
            author_url: 'https://www.youtube.com/@x',
            thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
            width: 480,
            height: 360,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    )

    const handler = createOpenHandler('v')
    const res = await handler(makeRequest('/v/dQw4w9WgXcQ', INSTAGRAM_ANDROID_UA), contextFor(['dQw4w9WgXcQ']))
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(html).not.toContain('<script>alert(1)</script>')
    // as duas tags de script legítimas (config + script embutido) continuam presentes
    expect((html.match(/<\/script>/g) ?? []).length).toBe(2)
  })
})
