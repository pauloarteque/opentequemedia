import 'server-only'
import { clampText, escapeHtmlAttr, escapeHtmlText, serializeJsonForHtml } from '@/core/escape'
import { SMART_PAGE_TOKEN_NAMES, subsetTokensToCssVars } from '@/core/tokens'
import type { YouTubeTarget } from '@/core/types'
import { OPEN_SCRIPT_SOURCE } from './open-script'
import type { OpenConfig } from './open-script'

export interface SmartPageData {
  target: YouTubeTarget
  destination: string
  platform: 'android' | 'ios'
  title: string | null
  thumbnailUrl: string | null
}

function withoutHttpsScheme(url: string): string {
  return url.replace(/^https:\/\//, '')
}

/** Só vídeo e short têm um ID isolado cujo significado no esquema youtube:// foi
 * testado em aparelho de verdade. Canal/handle/playlist usam só a forma de URL
 * completa — nunca presumir que o atalho de ID vale pra eles também. */
function bareVideoId(target: YouTubeTarget): string | null {
  return target.kind === 'video' || target.kind === 'short' ? target.id : null
}

export function buildAndroidIntentUrl(destination: string): string {
  const withoutScheme = withoutHttpsScheme(destination)
  const fallback = encodeURIComponent(destination)
  return `intent://${withoutScheme}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${fallback};end`
}

export function buildIosSchemeChain(target: YouTubeTarget, destination: string): string[] {
  const withoutScheme = withoutHttpsScheme(destination)
  const id = bareVideoId(target)
  const chain = [`youtube://${withoutScheme}`]
  if (id) chain.push(`youtube://${id}`)
  if (id) chain.push(`vnd.youtube://${id}`)
  chain.push(`vnd.youtube://${withoutScheme}`)
  chain.push(buildIosButtonHref(destination))
  return chain
}

export function buildIosButtonHref(destination: string): string {
  return `x-safari-https://${withoutHttpsScheme(destination)}`
}

const TITLE_MAX_LENGTH = 100

function renderStyle(): string {
  const vars = subsetTokensToCssVars(SMART_PAGE_TOKEN_NAMES)
  return `${vars}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--color-bg);color:var(--color-text);font-family:var(--font-family);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:var(--space-4)}
.wrap{width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;gap:var(--space-4);text-align:center}
.thumb{width:100%;border-radius:var(--radius-lg);overflow:hidden;background:var(--color-surface);aspect-ratio:16/9}
.thumb[data-portrait="true"]{aspect-ratio:9/16;max-width:240px}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
h1{font-size:var(--font-size-h3);line-height:var(--line-height-h3);font-weight:600;margin:0;color:var(--color-text)}
.btn{display:block;width:100%;padding:var(--space-4);border-radius:var(--radius-md);font-weight:600;font-size:var(--font-size-body);text-decoration:none;box-sizing:border-box}
.btn-primary{background:var(--color-primary);color:var(--color-on-primary)}
.btn-ghost{background:transparent;color:var(--color-text-secondary);border:1px solid var(--color-border);font-weight:500;font-size:var(--font-size-small);padding:var(--space-3)}
a:focus-visible,button:focus-visible{outline:none;box-shadow:var(--focus-ring)}`
}

export function renderSmartPage(data: SmartPageData): string {
  const { target, destination, platform } = data

  const primaryHref = platform === 'android' ? buildAndroidIntentUrl(destination) : buildIosButtonHref(destination)

  const openConfig: OpenConfig =
    platform === 'android'
      ? { p: 'a', chain: [buildAndroidIntentUrl(destination)] }
      : { p: 'i', chain: buildIosSchemeChain(target, destination) }

  const isPortrait = target.kind === 'short'

  const titleHtml = data.title
    ? `<h1>${escapeHtmlText(clampText(data.title, TITLE_MAX_LENGTH))}</h1>`
    : ''

  const thumbHtml = data.thumbnailUrl
    ? `<div class="thumb" data-portrait="${isPortrait ? 'true' : 'false'}"><img src="${escapeHtmlAttr(data.thumbnailUrl)}" alt=""></div>`
    : ''

  const staticFallbackHtml =
    platform === 'android'
      ? `<a class="btn btn-ghost" href="${escapeHtmlAttr(destination)}">Não abriu? Toque aqui para assistir</a>`
      : ''

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>Abrir no YouTube</title>
<style>${renderStyle()}</style>
</head>
<body>
<div class="wrap">
${thumbHtml}
${titleHtml}
<a class="btn btn-primary" href="${escapeHtmlAttr(primaryHref)}">Abrir no YouTube</a>
${staticFallbackHtml}
</div>
<script type="application/json" id="oc">${serializeJsonForHtml(openConfig)}</script>
<script>${OPEN_SCRIPT_SOURCE}</script>
</body>
</html>
`
}
