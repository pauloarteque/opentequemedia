/**
 * Propriedade: parseOpenPath(...split(buildShortPath(alvo))) === alvo, para os 7 tipos.
 * Prova que o caminho de ida (montar link) e o de volta (ler link) concordam — ambos
 * passam pelos mesmos módulos de core, então não existe onde divergir.
 */
import { describe, expect, it } from 'vitest'
import { buildShortPath } from '@/core/build-url'
import { parseOpenPath } from '@/core/parse-openteque-path'
import type { OpenPrefix } from '@/core/constants'
import type { YouTubeTarget } from '@/core/types'

function splitBuiltPath(path: string): { prefix: OpenPrefix; segments: string[]; query: URLSearchParams } {
  const [pathname, search] = path.split('?')
  const parts = (pathname ?? '').split('/').filter((s) => s.length > 0)
  const prefix = parts[0] as OpenPrefix
  const segments = parts.slice(1)
  return { prefix, segments, query: new URLSearchParams(search ?? '') }
}

const ALL_TARGETS: YouTubeTarget[] = [
  { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null },
  { kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: 3723 },
  { kind: 'short', id: 'dQw4w9WgXcQ' },
  { kind: 'channelId', id: 'UCX6OQ3DkcsbYNE6H8uQQuVA' },
  { kind: 'handle', handle: 'MrBeast' },
  { kind: 'vanity', name: 'veritasium' },
  { kind: 'user', name: 'PewDiePie' },
  { kind: 'playlist', id: 'PLC77007E23FF423C6' },
]

describe('ida e volta: buildShortPath -> parseOpenPath', () => {
  for (const target of ALL_TARGETS) {
    const path = buildShortPath(target)
    it(`${target.kind} (${path}) sobrevive à volta intacto`, () => {
      const { prefix, segments, query } = splitBuiltPath(path)
      const result = parseOpenPath(prefix, segments, query)
      expect(result).toEqual({ ok: true, target })
    })
  }
})

describe('propriedade cruzada: /s/ nunca decodifica como vídeo, /v/ nunca decodifica como short', () => {
  it('short construído e relido continua short', () => {
    const path = buildShortPath({ kind: 'short', id: 'dQw4w9WgXcQ' })
    const { prefix, segments, query } = splitBuiltPath(path)
    const result = parseOpenPath(prefix, segments, query)
    expect(result.ok && result.target.kind).toBe('short')
  })

  it('vídeo construído e relido continua vídeo', () => {
    const path = buildShortPath({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null })
    const { prefix, segments, query } = splitBuiltPath(path)
    const result = parseOpenPath(prefix, segments, query)
    expect(result.ok && result.target.kind).toBe('video')
  })
})
