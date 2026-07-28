import { describe, expect, it } from 'vitest'
import { buildDestinationUrl, buildShortPath } from '@/core/build-url'
import type { YouTubeTarget } from '@/core/types'

describe('buildDestinationUrl', () => {
  it('vídeo sem timestamp', () => {
    expect(buildDestinationUrl({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null })).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('vídeo com timestamp', () => {
    expect(buildDestinationUrl({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: 3723 })).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3723',
    )
  })

  it('short vai para /shorts/, NUNCA /watch', () => {
    const url = buildDestinationUrl({ kind: 'short', id: 'dQw4w9WgXcQ' })
    expect(url).toBe('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    expect(url).not.toContain('/watch')
  })

  it('canal por id', () => {
    expect(buildDestinationUrl({ kind: 'channelId', id: 'UCX6OQ3DkcsbYNE6H8uQQuVA' })).toBe(
      'https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA',
    )
  })

  it('handle', () => {
    expect(buildDestinationUrl({ kind: 'handle', handle: 'MrBeast' })).toBe('https://www.youtube.com/@MrBeast')
  })

  it('vanity legado', () => {
    expect(buildDestinationUrl({ kind: 'vanity', name: 'veritasium' })).toBe('https://www.youtube.com/c/veritasium')
  })

  it('user legado', () => {
    expect(buildDestinationUrl({ kind: 'user', name: 'PewDiePie' })).toBe('https://www.youtube.com/user/PewDiePie')
  })

  it('playlist', () => {
    expect(buildDestinationUrl({ kind: 'playlist', id: 'PLC77007E23FF423C6' })).toBe(
      'https://www.youtube.com/playlist?list=PLC77007E23FF423C6',
    )
  })
})

describe('buildShortPath', () => {
  it('vídeo com timestamp', () => {
    expect(buildShortPath({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: 3723 })).toBe('/v/dQw4w9WgXcQ?t=3723')
  })

  it('vídeo sem timestamp não tem ?t= sobrando', () => {
    expect(buildShortPath({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null })).toBe('/v/dQw4w9WgXcQ')
  })

  it('short usa /s/, nunca /v/', () => {
    const path = buildShortPath({ kind: 'short', id: 'dQw4w9WgXcQ' })
    expect(path).toBe('/s/dQw4w9WgXcQ')
    expect(path.startsWith('/v/')).toBe(false)
  })

  it('família de canal usa /c/', () => {
    const cases: YouTubeTarget[] = [
      { kind: 'channelId', id: 'UCX6OQ3DkcsbYNE6H8uQQuVA' },
      { kind: 'handle', handle: 'MrBeast' },
      { kind: 'vanity', name: 'veritasium' },
      { kind: 'user', name: 'PewDiePie' },
    ]
    for (const target of cases) {
      expect(buildShortPath(target).startsWith('/c/')).toBe(true)
    }
  })

  it('playlist usa /p/', () => {
    expect(buildShortPath({ kind: 'playlist', id: 'PLC77007E23FF423C6' })).toBe('/p/PLC77007E23FF423C6')
  })
})
