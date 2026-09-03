import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = join(import.meta.dirname, '..', '..')

describe('Dockerfile and docs for GHE runtime configuration', () => {
  it('does not duplicate GitHub configuration as client build args', () => {
    const dockerfile = readFileSync(join(repoRoot, 'Dockerfile'), 'utf8')

    expect(dockerfile).not.toContain('NEXT_PUBLIC_GITHUB')
  })

  it('documents runtime configuration for client-side consumers', () => {
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
    const developing = readFileSync(
      join(repoRoot, 'docs/developing.md'),
      'utf8',
    )

    expect(readme).toContain('GitHub configuration is read at runtime')
    expect(readme).not.toContain('NEXT_PUBLIC_GITHUB_SERVER_URL')
    expect(developing).toContain(
      'production builds and Docker images do not require separate `NEXT_PUBLIC_*` variables',
    )
  })
})
