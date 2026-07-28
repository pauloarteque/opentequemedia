/**
 * O tipo Alvo (YouTubeTarget) e os motivos de recusa. Único lugar que define essas formas —
 * ids.ts, path-format.ts, parse-youtube-url.ts, parse-openteque-path.ts e build-url.ts todos
 * importam daqui. Ver SPEC.md §2.4.
 */

export type YouTubeTarget =
  | { kind: 'video'; id: string; startSeconds: number | null }
  | { kind: 'short'; id: string }
  | { kind: 'channelId'; id: string }
  | { kind: 'handle'; handle: string }
  | { kind: 'vanity'; name: string }
  | { kind: 'user'; name: string }
  | { kind: 'playlist'; id: string }

export type ChannelFamilyTarget = Extract<
  YouTubeTarget,
  { kind: 'channelId' | 'handle' | 'vanity' | 'user' }
>

export type ParseFailureReason =
  // formato de entrada (gerador, superfície 1)
  | 'EMPTY_INPUT'
  | 'INPUT_TOO_LONG'
  | 'NOT_A_URL'
  | 'UNSUPPORTED_SCHEME'
  | 'HOST_NOT_ALLOWED'
  // host reconhecido, caminho recusado deliberadamente
  | 'UNSUPPORTED_CLIP'
  | 'UNSUPPORTED_POST'
  | 'UNSUPPORTED_SEARCH'
  | 'UNSUPPORTED_FEED'
  | 'UNSUPPORTED_CHANNEL_TAB'
  | 'UNSUPPORTED_EMBED'
  | 'PERSONAL_PLAYLIST'
  | 'UNKNOWN_YOUTUBE_PATH'
  // caminho reconhecido, identificador malformado
  | 'MISSING_VIDEO_ID'
  | 'MALFORMED_VIDEO_ID'
  | 'MALFORMED_CHANNEL_ID'
  | 'MALFORMED_HANDLE'
  | 'MALFORMED_VANITY'
  | 'MALFORMED_USER'
  | 'MALFORMED_PLAYLIST_ID'
  // timestamp
  | 'MALFORMED_TIMESTAMP'
  | 'FRACTIONAL_TIMESTAMP'
  | 'TIMESTAMP_OUT_OF_RANGE'
  // só direção de caminho (rotas do servidor)
  | 'UNKNOWN_PREFIX'
  | 'WRONG_SEGMENT_COUNT'
  | 'PERCENT_ENCODED_SEGMENT'

export interface ParseFailure {
  ok: false
  reason: ParseFailureReason
  /** Eco do que causou a recusa (host, caminho). Nunca renderizado sem escapar. */
  detail?: string
}

export interface ParseSuccess {
  ok: true
  target: YouTubeTarget
  /** true quando a URL colada tinha ?list=... e ele foi descartado (vídeo dentro de playlist). */
  ignoredPlaylist?: boolean
}

export type ParseResult = ParseSuccess | ParseFailure

export function ok(target: YouTubeTarget, ignoredPlaylist?: boolean): ParseSuccess {
  return ignoredPlaylist ? { ok: true, target, ignoredPlaylist: true } : { ok: true, target }
}

export function fail(reason: ParseFailureReason, detail?: string): ParseFailure {
  return detail === undefined ? { ok: false, reason } : { ok: false, reason, detail }
}
