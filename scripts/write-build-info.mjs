import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'src', 'generated')
mkdirSync(outDir, { recursive: true })

function readCommitSha() {
  try {
    const sha = execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    return sha.length > 0 ? sha : null
  } catch {
    return null
  }
}

const commit = readCommitSha()

// buildId precisa vir do artefato, não de um valor digitado — sem commit disponível,
// um UUID por build preserva essa propriedade (fica óbvio se dois "builds" têm o
// mesmo id, o que só aconteceria se ninguém tivesse rodado o script de novo).
const info = {
  commit,
  buildId: commit ?? `local-${randomUUID().slice(0, 12)}`,
  builtAt: new Date().toISOString(),
}

writeFileSync(join(outDir, 'build-info.json'), `${JSON.stringify(info, null, 2)}\n`)

console.log(`[build-info] commit=${info.commit ?? '(sem commit)'} buildId=${info.buildId} builtAt=${info.builtAt}`)
