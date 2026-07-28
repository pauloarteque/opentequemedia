/**
 * Alvo -> URL canônica do YouTube, e Alvo -> caminho openteque. Único lugar que monta
 * essas strings. Ver SPEC.md §2.4.
 */
import { encodeChannelSegments } from './path-format'
import type { YouTubeTarget } from './types'

export function buildDestinationUrl(target: YouTubeTarget): string {
  switch (target.kind) {
    case 'video': {
      const u = new URL('https://www.youtube.com/watch')
      u.searchParams.set('v', target.id)
      if (target.startSeconds !== null && target.startSeconds > 0) {
        u.searchParams.set('t', String(target.startSeconds))
      }
      return u.toString()
    }
    case 'short':
      return `https://www.youtube.com/shorts/${target.id}`
    case 'channelId':
      return `https://www.youtube.com/channel/${target.id}`
    case 'handle':
      return `https://www.youtube.com/@${target.handle}`
    case 'vanity':
      return `https://www.youtube.com/c/${target.name}`
    case 'user':
      return `https://www.youtube.com/user/${target.name}`
    case 'playlist':
      return `https://www.youtube.com/playlist?list=${target.id}`
  }
}

export function buildShortPath(target: YouTubeTarget): string {
  switch (target.kind) {
    case 'video': {
      const qs = target.startSeconds !== null && target.startSeconds > 0 ? `?t=${target.startSeconds}` : ''
      return `/v/${target.id}${qs}`
    }
    case 'short':
      return `/s/${target.id}`
    case 'channelId':
    case 'handle':
    case 'vanity':
    case 'user':
      return `/c/${encodeChannelSegments(target).join('/')}`
    case 'playlist':
      return `/p/${target.id}`
  }
}
