import 'server-only'
import { buildDestinationUrl } from '@/core/build-url'
import { parseOpenPath } from '@/core/parse-openteque-path'
import type { OpenPrefix } from '@/core/constants'
import { classifyUserAgent } from '@/server/classify-ua'
import { getBuildStamp } from '@/server/build-info'
import { renderBotPage } from '@/server/bot-page'
import { renderErrorPage } from '@/server/error-page'
import { OPEN_SCRIPT_SHA256 } from '@/server/open-script'
import { renderSmartPage } from '@/server/smart-page'
import { defaultThumbnailUrl, getBotPageMeta, getSmartPageMeta } from '@/server/youtube-meta'

interface RouteContext {
  params: Promise<{ resto?: string[] }>
}

const IMG_SOURCES = 'https://i.ytimg.com https://yt3.googleusercontent.com https://yt3.ggpht.com'

function baseHeaders(): Record<string, string> {
  return {
    'cache-control': 'no-store, no-cache, must-revalidate, private',
    vary: 'User-Agent',
    'x-openteque-build': getBuildStamp().buildId,
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
  }
}

function htmlHeaders(csp: string): Record<string, string> {
  return {
    ...baseHeaders(),
    'content-type': 'text/html; charset=utf-8',
    'x-robots-tag': 'noindex, nofollow',
    'content-security-policy': csp,
  }
}

// A página inteligente é o único lugar com <script> — a política usa o HASH exato do
// script estático (sem nonce, sem estado, sem cookie: o script nunca muda de bytes).
// Se o script e o hash algum dia divergirem, o navegador bloqueia a execução em
// silêncio — por isso a fase 7 tem um teste que recalcula o hash e compara.
const SMART_PAGE_CSP = `default-src 'none'; script-src 'sha256-${OPEN_SCRIPT_SHA256}'; style-src 'unsafe-inline'; img-src ${IMG_SOURCES}; base-uri 'none'; form-action 'none'`
const BOT_PAGE_CSP = `default-src 'none'; img-src ${IMG_SOURCES}`
const ERROR_PAGE_CSP = `default-src 'none'`

/**
 * O handler único por trás de /v, /s, /c, /p. Cada route.ts é uma chamada de 1 linha
 * a createOpenHandler(prefixo). Ver SPEC.md §2.1, §2.2, §5.
 */
export function createOpenHandler(prefix: OpenPrefix) {
  return async function GET(request: Request, context: RouteContext): Promise<Response> {
    const { resto } = await context.params
    const segments = resto ?? []
    const url = new URL(request.url)

    const parseResult = parseOpenPath(prefix, segments, url.searchParams)

    if (!parseResult.ok) {
      return new Response(renderErrorPage(), { status: 404, headers: htmlHeaders(ERROR_PAGE_CSP) })
    }

    const { target } = parseResult
    const destination = buildDestinationUrl(target)
    const classification = classifyUserAgent(request.headers.get('user-agent'))

    if (classification.route === 'bot') {
      const meta = await getBotPageMeta(target)
      const html = renderBotPage(target, destination, meta)
      return new Response(html, { status: 200, headers: htmlHeaders(BOT_PAGE_CSP) })
    }

    if (classification.route === 'smart') {
      // Thumbnail é sempre determinística (zero rede) — nunca depende da mesma busca
      // que o título, que tem prazo e pode faltar. Ver SPEC.md §2.3b.
      const meta = await getSmartPageMeta(target)
      const html = renderSmartPage({
        target,
        destination,
        platform: classification.platform,
        title: meta.title,
        thumbnailUrl: meta.thumbnailUrl ?? defaultThumbnailUrl(target)?.url ?? null,
      })
      return new Response(html, { status: 200, headers: htmlHeaders(SMART_PAGE_CSP) })
    }

    // classification.route === 'redirect': o caminho crítico. Corpo de zero byte.
    return new Response(null, {
      status: 302,
      headers: { ...baseHeaders(), location: destination },
    })
  }
}
