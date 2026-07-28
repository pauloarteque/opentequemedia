/**
 * User-Agents REAIS, capturados de dispositivos/apps de verdade (2024-2025), usados nos
 * testes de classify-ua.ts. Fontes: pesquisa ao vivo desta sessão (shalanah/inapp-spy,
 * documentação da Google/Bing/Meta/Slack/Apple para os bots).
 */

export const INSTAGRAM_ANDROID =
  'Mozilla/5.0 (Linux; Android 11; Mi A3 Build/RKQ1.200903.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.14 Mobile Safari/537.36 Instagram 355.0.0.37.103 Android (30/11; 320dpi; 720x1411; Xiaomi; Mi A3; laurel_sprout; qcom; pt_BR; 657300861)'

export const INSTAGRAM_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 Instagram 393.1.0.36.70 (iPhone15,3; iOS 18_5; en_US; en; scale=3.00; 1290x2796; IABMV/1; 776538208) Safari/604.1'

export const FACEBOOK_IOS_LEGACY_FBAN =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 [FBAN/FBIOS;FBAV/488.0.0.68.101;FBBV/658219612;FBDV/iPhone12,8;FBMD/iPhone;FBSN/iOS;FBSV/18.1;FBSS/2;FBID/phone;FBLC/en_US;FBOP/5;FBRV/0;IABMV/1]'

/** 2025+: SEM FBAN/FBAV. A lista original do dono do produto perderia este caso. */
export const FACEBOOK_IOS_2025_METAIAB =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G100 Safari/604.1 MetaIAB Facebook'

export const FACEBOOK_ANDROID =
  'Mozilla/5.0 (Linux; Android 10; SM-N976V Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.136 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/255.0.0.33.121;FBBV/45904160;FBDM/{density=3.0,width=1080,height=1920};FBLC/it_IT;FBRV/45904160;FBCR/PosteMobile;FBMF/asus;FBBD/asus;FBPN/com.facebook.katana;FBDV/ASUS_Z00AD;FBSV/5.0;FBOP/1;FBCA/x86:armeabi-v7a;]'

export const MESSENGER_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/470.0.0.0]'

export const MESSENGER_ANDROID =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 [FB_IAB/MESSENGER;FBAV/470.0.0.0]'

export const GOOGLEBOT_SMARTPHONE =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

export const GOOGLEBOT_DESKTOP =
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/125.0.0.0 Safari/537.36'

export const BINGBOT_MOBILE =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'

export const FACEBOOK_EXTERNAL_HIT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

export const META_EXTERNAL_AGENT =
  'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)'

export const WHATSAPP_PREVIEW_BOT = 'WhatsApp/2.23.20.0 A'

export const TELEGRAM_BOT_CRAWLER = 'TelegramBot (like TwitterBot)'

export const DISCORDBOT = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'

export const TWITTERBOT = 'Twitterbot/1.0'

export const LINKEDINBOT = 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)'

export const SLACKBOT_LINK_EXPANDING = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'

export const SLACKBOT = 'Slackbot 1.0 (+https://api.slack.com/robots)'

export const APPLEBOT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/8.0.2 Safari/600.2.5 (Applebot/0.1; +http://www.apple.com/go/applebot)'

export const TIKTOK_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_33.2.1 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US'

export const SNAPCHAT_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Snapchat/12.72.0.39 (like Safari/8617.2.4.10.8, panda)'

export const LINKEDIN_APP_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30.1753'

export const TWITTER_X_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/14D27 Twitter for iPhone'

export const WHATSAPP_INAPP_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1 [WAiOS/2.25.31]'

export const LINE_INAPP_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/14D27 Safari Line/7.3.2'

/** Indistinguível de Safari comum por User-Agent — perda conhecida e aceita. */
export const TELEGRAM_INAPP_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'

export const SAFARI_IPHONE_REAL_BROWSER =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'

export const CHROME_ANDROID_REAL_BROWSER =
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'

export const CHROME_DESKTOP_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export const SAFARI_DESKTOP_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'

export const FIREFOX_DESKTOP_WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0'

/**
 * O celular é de marca "Cubot" — o User-Agent contém a substring "bot" (dentro de
 * "Cubot"), mas NÃO é nenhum bot. Prova que a classificação busca por NOME DE PRODUTO
 * específico, nunca por trecho de texto genérico "bot". Ver SPEC.md §4.
 */
export const CUBOT_ANDROID_PHONE =
  'Mozilla/5.0 (Linux; Android 11; Cubot X30 Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Mobile Safari/537.36'

/** iPadOS moderno se anuncia como Mac por padrão — indistinguível de desktop de propósito. */
export const IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
