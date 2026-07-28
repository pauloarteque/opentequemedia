import type { NextConfig } from 'next'
import { execSync } from 'node:child_process'

function readCommitSha(): string | null {
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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  generateBuildId: async () => {
    // null => Next.js falls back to its own hash, which changes on every single
    // build regardless of git state. That fallback is what makes the /build proof
    // in SPEC.md §2.5 work before the first commit exists in this repo.
    return readCommitSha()
  },
}

export default nextConfig
