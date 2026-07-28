import { describe, expect, it } from 'vitest'
import { classifyUserAgent } from '@/server/classify-ua'
import * as UA from './fixtures/user-agents'

describe('classifyUserAgent — ordem: bot ANTES de móvel', () => {
  it('Googlebot Smartphone classifica bot, NÃO móvel, mesmo contendo "Android"', () => {
    expect(classifyUserAgent(UA.GOOGLEBOT_SMARTPHONE)).toEqual({ route: 'bot', bot: 'Googlebot' })
  })

  it('Bingbot Mobile classifica bot, NÃO móvel, mesmo contendo "Android"', () => {
    const r = classifyUserAgent(UA.BINGBOT_MOBILE)
    expect(r.route).toBe('bot')
  })

  it('Googlebot Desktop classifica bot', () => {
    expect(classifyUserAgent(UA.GOOGLEBOT_DESKTOP).route).toBe('bot')
  })
})

describe('classifyUserAgent — token é NOME DE PRODUTO, não substring genérica "bot"', () => {
  it('celular de marca Cubot (contém "bot" dentro de "Cubot") NÃO classifica como bot', () => {
    const r = classifyUserAgent(UA.CUBOT_ANDROID_PHONE)
    expect(r.route).not.toBe('bot')
    expect(r).toEqual({ route: 'redirect', why: 'mobile-browser' })
  })
})

describe('classifyUserAgent — família Meta vai para a página inteligente', () => {
  it('Instagram Android', () => {
    expect(classifyUserAgent(UA.INSTAGRAM_ANDROID)).toEqual({ route: 'smart', platform: 'android' })
  })

  it('Instagram iOS', () => {
    expect(classifyUserAgent(UA.INSTAGRAM_IOS)).toEqual({ route: 'smart', platform: 'ios' })
  })

  it('Facebook iOS legado (com FBAN/FBAV)', () => {
    expect(classifyUserAgent(UA.FACEBOOK_IOS_LEGACY_FBAN)).toEqual({ route: 'smart', platform: 'ios' })
  })

  it('Facebook iOS 2025 (MetaIAB, SEM FBAN/FBAV) — o caso que a lista original perderia', () => {
    expect(classifyUserAgent(UA.FACEBOOK_IOS_2025_METAIAB)).toEqual({ route: 'smart', platform: 'ios' })
  })

  it('Facebook Android', () => {
    expect(classifyUserAgent(UA.FACEBOOK_ANDROID)).toEqual({ route: 'smart', platform: 'android' })
  })

  it('Messenger iOS', () => {
    expect(classifyUserAgent(UA.MESSENGER_IOS)).toEqual({ route: 'smart', platform: 'ios' })
  })

  it('Messenger Android', () => {
    expect(classifyUserAgent(UA.MESSENGER_ANDROID)).toEqual({ route: 'smart', platform: 'android' })
  })
})

describe('classifyUserAgent — bots de preview/crawler', () => {
  const bots: Array<[string, string]> = [
    ['facebookexternalhit', UA.FACEBOOK_EXTERNAL_HIT],
    ['meta-externalagent', UA.META_EXTERNAL_AGENT],
    ['WhatsApp preview bot', UA.WHATSAPP_PREVIEW_BOT],
    ['TelegramBot crawler', UA.TELEGRAM_BOT_CRAWLER],
    ['Discordbot', UA.DISCORDBOT],
    ['Twitterbot', UA.TWITTERBOT],
    ['LinkedInBot', UA.LINKEDINBOT],
    ['Slackbot-LinkExpanding', UA.SLACKBOT_LINK_EXPANDING],
    ['Slackbot', UA.SLACKBOT],
    ['Applebot', UA.APPLEBOT],
  ]

  for (const [label, ua] of bots) {
    it(`${label} -> bot`, () => {
      expect(classifyUserAgent(ua).route).toBe('bot')
    })
  }
})

describe('classifyUserAgent — apps fora da família Meta caem no 302 (default seguro)', () => {
  const outsiders: Array<[string, string]> = [
    ['TikTok iOS', UA.TIKTOK_IOS],
    ['Snapchat iOS', UA.SNAPCHAT_IOS],
    ['LinkedIn app iOS', UA.LINKEDIN_APP_IOS],
    ['Twitter/X iOS', UA.TWITTER_X_IOS],
    ['WhatsApp in-app (humano navegando)', UA.WHATSAPP_INAPP_IOS],
    ['Line in-app iOS', UA.LINE_INAPP_IOS],
    ['Telegram in-app (indistinguível de Safari)', UA.TELEGRAM_INAPP_IOS],
  ]

  for (const [label, ua] of outsiders) {
    it(`${label} -> redirect (nunca smart, nunca bot)`, () => {
      const r = classifyUserAgent(ua)
      expect(r.route).toBe('redirect')
    })
  }
})

describe('classifyUserAgent — navegação real, fora de webview', () => {
  it('Safari iPhone real -> redirect/mobile-browser', () => {
    expect(classifyUserAgent(UA.SAFARI_IPHONE_REAL_BROWSER)).toEqual({ route: 'redirect', why: 'mobile-browser' })
  })

  it('Chrome Android real -> redirect/mobile-browser', () => {
    expect(classifyUserAgent(UA.CHROME_ANDROID_REAL_BROWSER)).toEqual({ route: 'redirect', why: 'mobile-browser' })
  })

  it('iPad em modo desktop -> redirect/desktop', () => {
    expect(classifyUserAgent(UA.IPAD_DESKTOP_MODE)).toEqual({ route: 'redirect', why: 'desktop' })
  })
})

describe('classifyUserAgent — desktop', () => {
  it('Chrome Windows -> redirect/desktop', () => {
    expect(classifyUserAgent(UA.CHROME_DESKTOP_WINDOWS)).toEqual({ route: 'redirect', why: 'desktop' })
  })

  it('Safari Mac -> redirect/desktop', () => {
    expect(classifyUserAgent(UA.SAFARI_DESKTOP_MAC)).toEqual({ route: 'redirect', why: 'desktop' })
  })

  it('Firefox Windows -> redirect/desktop', () => {
    expect(classifyUserAgent(UA.FIREFOX_DESKTOP_WINDOWS)).toEqual({ route: 'redirect', why: 'desktop' })
  })
})

describe('classifyUserAgent — ausência de User-Agent', () => {
  it('string vazia -> redirect/no-ua', () => {
    expect(classifyUserAgent('')).toEqual({ route: 'redirect', why: 'no-ua' })
  })

  it('null -> redirect/no-ua', () => {
    expect(classifyUserAgent(null)).toEqual({ route: 'redirect', why: 'no-ua' })
  })

  it('undefined -> redirect/no-ua', () => {
    expect(classifyUserAgent(undefined)).toEqual({ route: 'redirect', why: 'no-ua' })
  })
})
