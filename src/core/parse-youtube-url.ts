/**
 * URL colada pelo usuário -> Alvo | Recusa. Usado pelo navegador (componente do gerador).
 * Ver SPEC.md §3.
 */
import { ALLOWED_YOUTUBE_HOSTS } from './constants'
import { isChannelId, isHandleBody, isLegacyName, isPersonalPlaylistId, isPlaylistId, isVideoId } from './ids'
import { parseTimestamp } from './timestamp'
import { fail, ok } from './types'
import type { ParseResult } from './types'

const MAX_INPUT_LENGTH = 2048

export function isAllowedHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, '')
  return (ALLOWED_YOUTUBE_HOSTS as readonly string[]).includes(normalized)
}

function tryParseUrl(raw: string): URL | null {
  try {
    return new URL(raw)
  } catch {
    // sem esquema — tenta de novo assumindo https, só para tolerar colar sem "https://"
  }
  try {
    return new URL(`https://${raw}`)
  } catch {
    return null
  }
}

export function parseShareUrl(rawInput: string): ParseResult {
  const raw = rawInput.trim()
  if (raw.length === 0) return fail('EMPTY_INPUT')
  if (raw.length > MAX_INPUT_LENGTH) return fail('INPUT_TOO_LONG')

  const url = tryParseUrl(raw)
  if (!url) return fail('NOT_A_URL')

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return fail('UNSUPPORTED_SCHEME')
  }

  if (!isAllowedHost(url.hostname)) {
    return fail('HOST_NOT_ALLOWED', url.hostname)
  }

  return parseYouTubePath(url)
}

function parseYouTubePath(url: URL): ParseResult {
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  const segments = url.pathname.split('/').filter((s) => s.length > 0)

  if (host === 'youtu.be') {
    if (segments.length !== 1) return fail('UNKNOWN_YOUTUBE_PATH', url.pathname)
    const id = segments[0]
    if (id === undefined || !isVideoId(id)) return fail('MALFORMED_VIDEO_ID')
    return finishVideo(id, url.searchParams)
  }

  const first = segments[0]
  if (first === undefined) {
    return fail('UNSUPPORTED_FEED', '/')
  }
  const second = segments[1]

  switch (first) {
    case 'watch': {
      const v = url.searchParams.get('v')
      if (!v) return fail('MISSING_VIDEO_ID')
      if (!isVideoId(v)) return fail('MALFORMED_VIDEO_ID')
      return finishVideo(v, url.searchParams)
    }
    case 'shorts': {
      if (second === undefined || !isVideoId(second)) return fail('MALFORMED_VIDEO_ID')
      return ok({ kind: 'short', id: second })
    }
    case 'live': {
      if (second === undefined || !isVideoId(second)) return fail('MALFORMED_VIDEO_ID')
      return finishVideo(second, url.searchParams)
    }
    case 'embed':
    case 'v':
      return fail('UNSUPPORTED_EMBED', url.pathname)
    case 'playlist': {
      const list = url.searchParams.get('list')
      if (!list) return fail('MALFORMED_PLAYLIST_ID')
      return finishPlaylist(list)
    }
    case 'channel': {
      if (second === undefined || !isChannelId(second)) return fail('MALFORMED_CHANNEL_ID')
      if (segments.length > 2) return fail('UNSUPPORTED_CHANNEL_TAB', url.pathname)
      return ok({ kind: 'channelId', id: second })
    }
    case 'c': {
      if (second === undefined) return fail('MALFORMED_VANITY')
      if (segments.length > 2) return fail('UNSUPPORTED_CHANNEL_TAB', url.pathname)
      if (!isLegacyName(second)) return fail('MALFORMED_VANITY')
      return ok({ kind: 'vanity', name: second })
    }
    case 'user': {
      if (second === undefined) return fail('MALFORMED_USER')
      if (segments.length > 2) return fail('UNSUPPORTED_CHANNEL_TAB', url.pathname)
      if (!isLegacyName(second)) return fail('MALFORMED_USER')
      return ok({ kind: 'user', name: second })
    }
    case 'clip':
      return fail('UNSUPPORTED_CLIP', url.pathname)
    case 'post':
      return fail('UNSUPPORTED_POST', url.pathname)
    case 'results':
      return fail('UNSUPPORTED_SEARCH', url.pathname)
    case 'feed':
      return fail('UNSUPPORTED_FEED', url.pathname)
    default: {
      if (first.startsWith('@')) {
        if (segments.length > 1) return fail('UNSUPPORTED_CHANNEL_TAB', url.pathname)
        const body = first.slice(1)
        if (!isHandleBody(body)) return fail('MALFORMED_HANDLE')
        return ok({ kind: 'handle', handle: body })
      }
      return fail('UNKNOWN_YOUTUBE_PATH', url.pathname)
    }
  }
}

function finishVideo(id: string, searchParams: URLSearchParams): ParseResult {
  const tRaw = searchParams.get('t') ?? searchParams.get('start')
  let startSeconds: number | null = null

  if (tRaw !== null && tRaw !== '') {
    const t = parseTimestamp(tRaw)
    if (!t.ok) return fail(t.reason)
    startSeconds = t.seconds
  }

  const list = searchParams.get('list')
  const ignoredPlaylist = Boolean(list) && list !== null && !isPersonalPlaylistId(list)

  return ok({ kind: 'video', id, startSeconds }, ignoredPlaylist)
}

function finishPlaylist(id: string): ParseResult {
  if (isPersonalPlaylistId(id)) return fail('PERSONAL_PLAYLIST', id)
  if (!isPlaylistId(id)) return fail('MALFORMED_PLAYLIST_ID')
  return ok({ kind: 'playlist', id })
}
