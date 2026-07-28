import 'server-only'

/**
 * Classifica o User-Agent em bot | smart (página inteligente) | redirect (302 direto).
 * ORDEM IMPORTA: bot é checado ANTES de qualquer coisa, porque o Googlebot Smartphone e o
 * Bingbot Mobile se identificam como Android — se a checagem de móvel viesse primeiro, um
 * crawler receberia a página inteligente em vez da prévia. Ver SPEC.md §4.
 */

export type UaClass =
  | { route: 'bot'; bot: string }
  | { route: 'redirect'; why: 'desktop' | 'mobile-browser' | 'no-ua' }
  | { route: 'smart'; platform: 'android' | 'ios' }

// Nomes de PRODUTO específicos, nunca a palavra genérica "bot". Um User-Agent de celular
// de marca "Cubot" contém a substring "bot" mas não é nenhum destes nomes — não deve
// classificar como bot. Ver tests/classify-ua.test.ts para o caso que prova isso.
const BOT_TOKEN_RE =
  /Googlebot|Storebot-Google|Google-InspectionTool|bingbot|facebookexternalhit|meta-externalagent|meta-externalfetcher|meta-webindexer|meta-externalads|WhatsApp\/|TelegramBot|Discordbot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|Applebot|redditbot|SkypeUriPreview|DuckDuckBot|Baiduspider|YandexBot|PinterestBot/i

// Cobertura fechada: família Meta (Instagram, Facebook, Messenger). MetaIAB cobre o
// navegador interno do Facebook no iOS a partir de 2025, que não tem mais FBAN/FBAV.
// Qualquer app fora desta lista cai no 302 por default seguro — inclusive Telegram, cujo
// navegador interno é indistinguível de Safari por User-Agent.
const META_FAMILY_RE = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FBSS|MetaIAB/i

const IOS_DEVICE_RE = /iPhone|iPad|iPod/i
const ANDROID_DEVICE_RE = /Android/i

export function classifyUserAgent(ua: string | null | undefined): UaClass {
  if (!ua) return { route: 'redirect', why: 'no-ua' }

  const botMatch = BOT_TOKEN_RE.exec(ua)
  if (botMatch) return { route: 'bot', bot: botMatch[0] }

  if (META_FAMILY_RE.test(ua)) {
    return { route: 'smart', platform: IOS_DEVICE_RE.test(ua) ? 'ios' : 'android' }
  }

  const isMobileDevice = IOS_DEVICE_RE.test(ua) || ANDROID_DEVICE_RE.test(ua)
  if (!isMobileDevice) return { route: 'redirect', why: 'desktop' }

  return { route: 'redirect', why: 'mobile-browser' }
}
