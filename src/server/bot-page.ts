import 'server-only'
import { clampText, escapeHtmlAttr, escapeHtmlText } from '@/core/escape'
import type { YouTubeTarget } from '@/core/types'
import type { BotPageMeta } from './youtube-meta'

const TITLE_MAX_LENGTH = 100

const KIND_LABEL: Record<YouTubeTarget['kind'], string> = {
  video: 'Vídeo do YouTube',
  short: 'Short do YouTube',
  channelId: 'Canal do YouTube',
  handle: 'Canal do YouTube',
  vanity: 'Canal do YouTube',
  user: 'Canal do YouTube',
  playlist: 'Playlist do YouTube',
}

/**
 * HTML mínimo com metadados Open Graph — servido só para bots de prévia
 * (WhatsApp, Facebook, Telegram, Slack...). Nunca redireciona, nunca tem o script de
 * abertura, nunca tem o botão. Ver SPEC.md §4.
 */
export function renderBotPage(target: YouTubeTarget, destination: string, meta: BotPageMeta): string {
  const fallbackTitle = KIND_LABEL[target.kind]
  const rawTitle = meta.title && meta.title.trim().length > 0 ? meta.title : fallbackTitle
  const title = clampText(rawTitle, TITLE_MAX_LENGTH)

  const ogTags = [
    `<meta property="og:title" content="${escapeHtmlAttr(title)}">`,
    `<meta property="og:description" content="${escapeHtmlAttr(fallbackTitle)}">`,
    `<meta property="og:url" content="${escapeHtmlAttr(destination)}">`,
    `<meta property="og:type" content="website">`,
  ]

  if (meta.imageUrl) {
    ogTags.push(`<meta property="og:image" content="${escapeHtmlAttr(meta.imageUrl)}">`)
    if (meta.imageWidth > 0) ogTags.push(`<meta property="og:image:width" content="${meta.imageWidth}">`)
    if (meta.imageHeight > 0) ogTags.push(`<meta property="og:image:height" content="${meta.imageHeight}">`)
    ogTags.push(`<meta name="twitter:card" content="summary_large_image">`)
    ogTags.push(`<meta name="twitter:image" content="${escapeHtmlAttr(meta.imageUrl)}">`)
  } else {
    ogTags.push(`<meta name="twitter:card" content="summary">`)
  }

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtmlText(title)}</title>
${ogTags.join('\n')}
</head>
<body>
<p>${escapeHtmlText(title)}</p>
</body>
</html>
`
}
