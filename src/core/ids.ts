/**
 * ÚNICA definição de formato de ID. Nenhum outro arquivo do projeto valida um ID do
 * YouTube com sua própria regex — todos importam daqui. Ver SPEC.md §3 e CLAUDE.md.
 *
 * Nenhuma regex aqui usa as flags g/y (module-scope regex com essas flags carrega
 * lastIndex entre chamadas e faz .test() alternar true/false de forma incorreta).
 */

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/

// Handle: o YouTube aceita dezenas de scripts Unicode com regras próprias de
// comprimento por script. A checagem exata de charset não é a fronteira de segurança
// deste projeto — o allowlist de host e a estrutura de prefixo são. Aqui validamos
// comprimento (3-30) e a ausência de caracteres que quebrariam um segmento de caminho.
const HANDLE_BODY_RE = /^[^\s/?#@]{3,30}$/

// Nome de canal legado (/c/nome, /user/nome): historicamente restrito a ASCII simples.
const LEGACY_NAME_RE = /^[A-Za-z0-9_-]{1,100}$/

const UU_BASE_RE = /^UU[A-Za-z0-9_-]{22}$/
const UU_VARIANT_RE = /^UU(?:LF|SH)[A-Za-z0-9_-]{22}$/
const PL_RE = /^PL[A-Za-z0-9_-]{16,}$/
const OLAK_RE = /^OLAK5uy_[A-Za-z0-9_-]{20,}$/
const RD_RE = /^RD[A-Za-z0-9_-]{9,}$/

// Playlists pessoais: pertencem a quem está olhando, não a quem compartilhou.
// WL = Watch Later, LL = Liked videos, FL = Favorites. Ver SPEC.md §3.
const PERSONAL_PLAYLIST_RE = /^(?:WL|LL|FL)$/

export function isVideoId(s: string): boolean {
  return VIDEO_ID_RE.test(s)
}

export function isChannelId(s: string): boolean {
  return CHANNEL_ID_RE.test(s)
}

export function isHandleBody(s: string): boolean {
  return HANDLE_BODY_RE.test(s)
}

export function isLegacyName(s: string): boolean {
  return LEGACY_NAME_RE.test(s)
}

export function isPersonalPlaylistId(s: string): boolean {
  return PERSONAL_PLAYLIST_RE.test(s)
}

export function isPlaylistId(s: string): boolean {
  return PL_RE.test(s) || UU_BASE_RE.test(s) || UU_VARIANT_RE.test(s) || OLAK_RE.test(s) || RD_RE.test(s)
}
