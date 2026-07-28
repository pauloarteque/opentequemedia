import { execSync } from 'node:child_process'
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

const info = {
  commit: readCommitSha(),
  builtAt: new Date().toISOString(),
}

writeFileSync(join(outDir, 'build-info.json'), `${JSON.stringify(info, null, 2)}\n`)

console.log(`[build-info] commit=${info.commit ?? '(sem commit)'} builtAt=${info.builtAt}`)
