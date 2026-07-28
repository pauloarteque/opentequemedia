/**
 * Allowlist de host na entrada do gerador. Comparação EXATA contra esta lista, sobre o
 * host já parseado por `new URL(...)`, nunca busca de substring. Ver SPEC.md §3.
 */
export const ALLOWED_YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
] as const

export type OpenPrefix = 'v' | 's' | 'c' | 'p'
