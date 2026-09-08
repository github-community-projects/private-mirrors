import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getBotGitOptions', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('uses the installation ID and configured email domain', async () => {
    vi.stubEnv('GITHUB_USER_EMAIL_DOMAIN', 'users.noreply.github.example.com')
    vi.resetModules()

    const { getBotGitOptions } = await import('../../src/utils/git')

    expect(getBotGitOptions('12345')).toEqual({
      config: [
        'user.name=pma[bot]',
        'user.email=12345+pma[bot]@users.noreply.github.example.com',
      ],
    })
  })
})
