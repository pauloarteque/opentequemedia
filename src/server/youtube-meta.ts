import 'server-only'
import { buildDestinationUrl } from '@/core/build-url'
import type { YouTubeTarget } from '@/core/types'

/** Decodifica em UMA passagem — decodificar em sequência (amp depois lt) corromperia
 * um título que já contivesse "&amp;lt;" como texto literal. Ver SPEC.md §6. */
const ENTITY_RE = /&(amp|lt|gt|quot|apos|#39|#039|#x27);/g

function decodeBasicEntities(s: string): string {
  return s.replace(ENTITY_RE, (whole, entity: string) => {
    switch (entity) {
      case 'amp':
        return '&'
      case 'lt':
        return '<'
      case 'gt':
        return '>'
      case 'quot':
        return '"'
      case 'apos':
      case '#39':
      case '#039':
      case '#x27':
        return "'"
      default:
        return whole
    }
  })
}

// ---------------------------------------------------------------------------
// oEmbed — título e thumbnail de vídeo, short e playlist. Sem chave de API.
// ---------------------------------------------------------------------------

export interface OEmbedData {
  title: string
  authorName: string
  authorUrl: string
  thumbnailUrl: string
  isPortrait: boolean
}

export type OEmbedResult =
  | { ok: true; data: OEmbedData }
  | { ok: false; kind: 'not-found' | 'bad-request' | 'restricted' | 'timeout' | 'network' }

/**
 * O corpo de erro do oEmbed é TEXTO PURO ("Not Found", "Bad Request"), não JSON.
 * Checar o status antes de chamar .json() — chamar direto lançaria exceção.
 */
export async function fetchOEmbed(youtubeUrl: string, timeoutMs = 400): Promise<OEmbedResult> {
  const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youtubeUrl)}`

  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(timeoutMs) })

    if (res.status === 404) return { ok: false, kind: 'not-found' }
    if (res.status === 400) return { ok: false, kind: 'bad-request' }
    if (res.status === 401) return { ok: false, kind: 'restricted' }
    if (!res.ok) return { ok: false, kind: 'network' }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return { ok: false, kind: 'network' }

    const json = (await res.json()) as Record<string, unknown>
    const title = decodeBasicEntities(String(json.title ?? ''))
    const authorName = decodeBasicEntities(String(json.author_name ?? ''))
    let authorUrl = String(json.author_url ?? '')
    if (authorUrl.startsWith('/')) authorUrl = `https://www.youtube.com${authorUrl}`

    const width = Number(json.width ?? 0)
    const height = Number(json.height ?? 0)

    return {
      ok: true,
      data: {
        title,
        authorName,
        authorUrl,
        thumbnailUrl: String(json.thumbnail_url ?? ''),
        isPortrait: height > width,
      },
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') return { ok: false, kind: 'timeout' }
    return { ok: false, kind: 'network' }
  }
}

// ---------------------------------------------------------------------------
// Página de canal — título e logo, quando oEmbed não serve (canal/handle/legado).
// ---------------------------------------------------------------------------

export interface ChannelMeta {
  title: string | null
  imageUrl: string | null
}

export type ChannelMetaResult =
  | { ok: true; data: ChannelMeta }
  | { ok: false; kind: 'not-found' | 'timeout' | 'no-tags' | 'network' }

// Medido ao vivo: og:image de /@MrBeast aparece por volta do byte 740.000 de um
// documento de ~1,4 MB. O teto cobre isso com folga sem baixar o documento inteiro.
const MAX_CHANNEL_SCRAPE_BYTES = 1_000_000
const CHANNEL_FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

const OG_IMAGE_RE = /<meta property="og:image" content="([^"]*)"/
const OG_TITLE_RE = /<meta property="og:title" content="([^"]*)"/

/**
 * Leitura em FLUXO que aborta assim que acha as duas etiquetas (ou o teto de bytes).
 * O YouTube ignora pedido de Range parcial (confirmado ao vivo) — por isso o corte tem
 * que acontecer do lado de cá, lendo e cancelando, não pedindo um intervalo ao servidor.
 */
export async function fetchChannelMeta(url: string, timeoutMs = 600): Promise<ChannelMetaResult> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': CHANNEL_FETCH_USER_AGENT },
    })

    if (res.status === 404) return { ok: false, kind: 'not-found' }
    if (!res.ok || !res.body) return { ok: false, kind: 'network' }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let bytesRead = 0
    let title: string | null = null
    let image: string | null = null

    while (bytesRead < MAX_CHANNEL_SCRAPE_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      bytesRead += value.byteLength
      buffer += decoder.decode(value, { stream: true })

      if (!image) {
        const m = OG_IMAGE_RE.exec(buffer)
        if (m?.[1] !== undefined) image = decodeBasicEntities(m[1])
      }
      if (!title) {
        const m = OG_TITLE_RE.exec(buffer)
        if (m?.[1] !== undefined) title = decodeBasicEntities(m[1])
      }

      if (title && image) {
        await reader.cancel().catch(() => {})
        return { ok: true, data: { title, imageUrl: image } }
      }
    }

    await reader.cancel().catch(() => {})
    if (title || image) return { ok: true, data: { title, imageUrl: image } }
    return { ok: false, kind: 'no-tags' }
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') return { ok: false, kind: 'timeout' }
    return { ok: false, kind: 'network' }
  }
}

// ---------------------------------------------------------------------------
// Thumbnail. defaultThumbnailUrl é DETERMINÍSTICA, zero rede — é o que a página
// inteligente usa, porque nada no caminho crítico do intent pode esperar rede (ver
// SPEC.md §2.3b). pickBestThumbnail FAZ um probe HTTP curto — só a página de bot
// pode pagar esse custo, já que não está competindo com o disparo do intent.
// ---------------------------------------------------------------------------

export interface ThumbnailChoice {
  url: string
  width: number
  height: number
  isPortrait: boolean
}

function thumbnailKind(target: YouTubeTarget): 'video' | 'short' | null {
  if (target.kind === 'video') return 'video'
  if (target.kind === 'short') return 'short'
  return null
}

export function defaultThumbnailUrl(target: YouTubeTarget): ThumbnailChoice | null {
  const kind = thumbnailKind(target)
  if (kind === null) return null
  const id = target.kind === 'video' || target.kind === 'short' ? target.id : ''
  if (kind === 'short') {
    return { url: `https://i.ytimg.com/vi/${id}/oardefault.jpg`, width: 720, height: 1280, isPortrait: true }
  }
  return { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360, isPortrait: false }
}

// A imagem cinza de placeholder que o YouTube devolve com um 404 tem 1097 bytes.
// Exigir mais que isso descarta o placeholder sem baixar o corpo inteiro da imagem boa.
const MIN_VALID_THUMB_BYTES = 1200

async function probeImageExists(url: string, timeoutMs = 500): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return false
    const lengthHeader = res.headers.get('content-length')
    if (lengthHeader === null) return true
    return Number(lengthHeader) >= MIN_VALID_THUMB_BYTES
  } catch {
    return false
  }
}

export async function pickBestThumbnail(target: YouTubeTarget, timeoutMs = 500): Promise<ThumbnailChoice | null> {
  const kind = thumbnailKind(target)
  if (kind === null) return null
  const id = target.kind === 'video' || target.kind === 'short' ? target.id : ''

  const upgrade: ThumbnailChoice =
    kind === 'short'
      ? { url: `https://i.ytimg.com/vi/${id}/oardefault.jpg`, width: 720, height: 1280, isPortrait: true }
      : { url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, width: 1280, height: 720, isPortrait: false }

  if (await probeImageExists(upgrade.url, timeoutMs)) return upgrade

  return { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360, isPortrait: false }
}

// ---------------------------------------------------------------------------
// Cache em memória. Guarda só título e endereço de imagem — nunca destino. Pura
// otimização (SPEC.md §2.3b): se ficar frio ou morrer com o processo, nada quebra,
// só o título passa a faltar com mais frequência.
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const MAX_CACHE_ENTRIES = 500
const cache = new Map<string, CacheEntry<unknown>>()

function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  // reinsere no fim (ordem de inserção do Map) pra aproximar um LRU simples
  cache.delete(key)
  cache.set(key, entry)
  return entry.value as T
}

function cacheSet<T>(key: string, value: T): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey !== undefined) cache.delete(oldestKey)
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

export function clearMetaCacheForTests(): void {
  cache.clear()
}

// ---------------------------------------------------------------------------
// Orquestradores
// ---------------------------------------------------------------------------

function cacheKeyFor(target: YouTubeTarget): string {
  return JSON.stringify(target)
}

async function fetchTitleAndChannelImage(
  target: YouTubeTarget,
  timeoutMs: number,
): Promise<{ title: string | null; channelImageUrl: string | null }> {
  if (target.kind === 'video' || target.kind === 'short' || target.kind === 'playlist') {
    const destination = buildDestinationUrl(target)
    const result = await fetchOEmbed(destination, timeoutMs)
    return result.ok ? { title: result.data.title, channelImageUrl: null } : { title: null, channelImageUrl: null }
  }

  // canal, handle, vanity, user: sem chave de API não dá pra pegar pelo oEmbed —
  // a página do próprio canal serve og:title/og:image (SPEC.md §4.2).
  const destination = buildDestinationUrl(target)
  const result = await fetchChannelMeta(destination, timeoutMs)
  return result.ok
    ? { title: result.data.title, channelImageUrl: result.data.imageUrl }
    : { title: null, channelImageUrl: null }
}

export interface SmartPageMeta {
  title: string | null
  thumbnailUrl: string | null
}

/**
 * Usado pela página inteligente. A thumbnail NUNCA depende disto (é sempre
 * determinística, ver defaultThumbnailUrl) — só o título passa por aqui, com cache e
 * prazo curto, e pode faltar sem quebrar nada.
 */
export async function getSmartPageMeta(target: YouTubeTarget, timeoutMs = 400): Promise<SmartPageMeta> {
  const key = cacheKeyFor(target)
  const cached = cacheGet<SmartPageMeta>(key)
  if (cached) return cached

  const { title, channelImageUrl } = await fetchTitleAndChannelImage(target, timeoutMs)
  const thumbnailUrl = channelImageUrl ?? defaultThumbnailUrl(target)?.url ?? null
  const meta: SmartPageMeta = { title, thumbnailUrl }
  cacheSet(key, meta)
  return meta
}

export interface BotPageMeta {
  title: string | null
  imageUrl: string | null
  imageWidth: number
  imageHeight: number
}

/**
 * Usado pela página de bot (prévia de link). Pode pagar o probe de thumbnail de alta
 * qualidade porque não está competindo com o disparo de intent.
 */
export async function getBotPageMeta(target: YouTubeTarget, timeoutMs = 1500): Promise<BotPageMeta> {
  const key = `bot:${cacheKeyFor(target)}`
  const cached = cacheGet<BotPageMeta>(key)
  if (cached) return cached

  const [{ title, channelImageUrl }, thumb] = await Promise.all([
    fetchTitleAndChannelImage(target, timeoutMs),
    pickBestThumbnail(target, timeoutMs),
  ])

  const meta: BotPageMeta = channelImageUrl
    ? { title, imageUrl: channelImageUrl, imageWidth: 900, imageHeight: 900 }
    : {
        title,
        imageUrl: thumb?.url ?? null,
        imageWidth: thumb?.width ?? 0,
        imageHeight: thumb?.height ?? 0,
      }

  cacheSet(key, meta)
  return meta
}
