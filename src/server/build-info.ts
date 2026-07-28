import 'server-only'
import buildInfo from '@/generated/build-info.json'

/**
 * buildId é capturado no momento do build (scripts/write-build-info.mjs, prebuild)
 * e embutido no bundle como import estático — nunca lido do disco em tempo de
 * requisição. Isso é obrigatório, não só preferível: no Worker do Cloudflare não
 * existe .next/BUILD_ID para ler depois que o bundle está empacotado. Sem commit
 * disponível, o script gera um UUID por build — a propriedade da fase 0 (o
 * identificador vem do artefato, não de um valor digitado) continua valendo.
 */
export interface BuildStamp {
  buildId: string
  commit: string | null
  builtAt: string
}

export function getBuildStamp(): BuildStamp {
  return {
    buildId: buildInfo.buildId,
    commit: buildInfo.commit,
    builtAt: buildInfo.builtAt,
  }
}

export function formatBuildStampText(stamp: BuildStamp): string {
  return [
    `buildId: ${stamp.buildId}`,
    `commit: ${stamp.commit ?? '(sem commit no momento da compilação)'}`,
    `builtAt: ${stamp.builtAt}`,
    '',
  ].join('\n')
}
