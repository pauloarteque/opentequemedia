/**
 * ÚNICA definição da GRAMÁTICA do caminho /c/... — o que separa "canal por ID", "handle" e
 * "canal legado" nos segmentos depois do prefixo. build-url.ts e parse-openteque-path.ts NÃO
 * conhecem esse formato: só chamam encode/decodeChannelSegments. Trocar /c/@nome por
 * /c/at/nome (ou pelo @ codificado) é uma mudança CONTIDA NESTE ARQUIVO. Ver SPEC.md §5.
 */
import { isChannelId, isHandleBody, isLegacyName } from './ids'
import type { ChannelFamilyTarget } from './types'

export function encodeChannelSegments(target: ChannelFamilyTarget): string[] {
  switch (target.kind) {
    case 'channelId':
      return [target.id]
    case 'handle':
      return [`@${target.handle}`]
    case 'vanity':
      return ['c', target.name]
    case 'user':
      return ['user', target.name]
  }
}

export function decodeChannelSegments(segments: readonly string[]): ChannelFamilyTarget | null {
  if (segments.length === 1) {
    const only = segments[0]
    if (only === undefined) return null
    if (isChannelId(only)) return { kind: 'channelId', id: only }
    if (only.startsWith('@')) {
      const body = only.slice(1)
      if (isHandleBody(body)) return { kind: 'handle', handle: body }
    }
    return null
  }

  if (segments.length === 2) {
    const prefix = segments[0]
    const name = segments[1]
    if (prefix === undefined || name === undefined || !isLegacyName(name)) return null
    if (prefix === 'c') return { kind: 'vanity', name }
    if (prefix === 'user') return { kind: 'user', name }
    return null
  }

  return null
}
