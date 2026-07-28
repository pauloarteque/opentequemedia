import 'server-only'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import buildInfo from '@/generated/build-info.json'

/**
 * buildId vem de .next/BUILD_ID — gerado pelo próprio Next.js a cada `next build`.
 * Muda mesmo sem nenhuma mudança de código quando não há commit disponível
 * (generateBuildId retorna null em next.config.ts, e o Next cai no hash aleatório
 * dele, que é sempre novo). É essa propriedade que prova, na fase 0, que o
 * identificador vem do artefato compilado e não de um valor digitado.
 */
function readBuildId(): string {
  try {
    return readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim()
  } catch {
    return '(dev — sem build de produção)'
  }
}

export interface BuildStamp {
  buildId: string
  commit: string | null
  builtAt: string
}

export function getBuildStamp(): BuildStamp {
  return {
    buildId: readBuildId(),
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
