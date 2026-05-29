import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = join(import.meta.dirname, '..', '..')

describe('Dockerfile and docs for GHE client build args', () => {
  it('forwards NEXT_PUBLIC GitHub build args during the Docker build', () => {
    const dockerfile = readFileSync(join(repoRoot, 'Dockerfile'), 'utf8')

    expect(dockerfile).toContain('ARG NEXT_PUBLIC_GITHUB_SERVER_URL')
    expect(dockerfile).toContain('ARG NEXT_PUBLIC_GITHUB_API_URL')
    expect(dockerfile).toContain(
      'ENV NEXT_PUBLIC_GITHUB_SERVER_URL=$NEXT_PUBLIC_GITHUB_SERVER_URL',
    )
    expect(dockerfile).toContain(
      'ENV NEXT_PUBLIC_GITHUB_API_URL=$NEXT_PUBLIC_GITHUB_API_URL',
    )
  })

  it('documents that the bundled Dockerfile already forwards the build args', () => {
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
    const developing = readFileSync(
      join(repoRoot, 'docs/developing.md'),
      'utf8',
    )

    expect(readme).toContain('The bundled `Dockerfile` already forwards them')
    expect(readme).not.toContain('update the `Dockerfile`')
    expect(developing).toContain(
      'The bundled `Dockerfile` already forwards these build args',
    )
  })
})
