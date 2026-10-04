import type { ParseFailureReason } from '@/core/types'

/**
 * Mensagem específica por motivo de recusa — nunca uma mensagem genérica. Ver
 * SPEC.md §3 ("Falha fechada... mensagem específica por motivo").
 */
export function messageForFailure(reason: ParseFailureReason, detail?: string): string {
  switch (reason) {
    case 'EMPTY_INPUT':
      return 'Cole um link do YouTube para começar.'
    case 'INPUT_TOO_LONG':
      return 'Esse texto é longo demais para ser um link.'
    case 'NOT_A_URL':
      return 'Isso não parece um link válido.'
    case 'UNSUPPORTED_SCHEME':
      return 'Esse tipo de endereço não é suportado.'
    case 'HOST_NOT_ALLOWED':
      return detail ? `"${detail}" não é um endereço do YouTube.` : 'Esse não é um endereço do YouTube.'
    case 'UNSUPPORTED_CLIP':
      return 'Clipes não abrem no aplicativo. Use o link do vídeo completo, com o tempo inicial se quiser.'
    case 'UNSUPPORTED_POST':
      return 'Publicações da comunidade do YouTube não são suportadas.'
    case 'UNSUPPORTED_SEARCH':
      return 'Isso é uma busca, não um vídeo, canal ou playlist.'
    case 'UNSUPPORTED_FEED':
      return 'Isso é uma página inicial ou feed do YouTube. Cole o link de um vídeo, canal ou playlist específico.'
    case 'UNSUPPORTED_CHANNEL_TAB':
      return 'Cole o link do canal sem a aba (vídeos, shorts, playlists...).'
    case 'UNSUPPORTED_EMBED':
      return 'Link de incorporação não é suportado. Use o link de assistir ao vídeo.'
    case 'PERSONAL_PLAYLIST':
      return 'Essa playlist pertence a quem está olhando, não a quem compartilha. Ela não pode virar link.'
    case 'UNKNOWN_YOUTUBE_PATH':
      return 'Não reconheci esse formato de link do YouTube.'
    case 'MISSING_VIDEO_ID':
      return 'Esse link não indica um vídeo.'
    case 'MALFORMED_VIDEO_ID':
      return 'O identificador do vídeo não parece válido.'
    case 'MALFORMED_CHANNEL_ID':
      return 'O identificador do canal não parece válido.'
    case 'MALFORMED_HANDLE':
      return 'O nome de usuário (@) não parece válido.'
    case 'MALFORMED_VANITY':
      return 'O nome do canal não parece válido.'
    case 'MALFORMED_USER':
      return 'O nome de usuário não parece válido.'
    case 'MALFORMED_PLAYLIST_ID':
      return 'O identificador da playlist não parece válido.'
    case 'MALFORMED_TIMESTAMP':
      return 'O tempo inicial (t=) não está num formato reconhecido. Use segundos (125) ou 1h2m3s.'
    case 'FRACTIONAL_TIMESTAMP':
      return 'O tempo inicial não aceita casas decimais.'
    case 'TIMESTAMP_OUT_OF_RANGE':
      return 'O tempo inicial é grande demais.'
    case 'UNKNOWN_PREFIX':
    case 'WRONG_SEGMENT_COUNT':
    case 'PERCENT_ENCODED_SEGMENT':
      // Só ocorrem na direção do servidor (parseOpenPath), nunca a partir do que o
      // gerador produz — mantidos aqui só para o switch continuar exaustivo.
      return 'Link inválido.'
  }
}
