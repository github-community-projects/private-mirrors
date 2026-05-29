import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getCommitterEmailDomainWithWarning', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('warns once when a non-github.com server uses the default noreply domain', async () => {
    vi.stubEnv('GITHUB_SERVER_URL', 'https://ghes.example.com')

    const warnSpy = vi.fn()
    vi.doMock('../../../src/utils/logger', () => ({
      logger: {
        getSubLogger: vi.fn().mockReturnValue({ warn: warnSpy }),
      },
    }))

    const { getCommitterEmailDomainWithWarning } = await import(
      '../../../src/utils/server/committer-email'
    )

    expect(getCommitterEmailDomainWithWarning()).toBe(
      'users.noreply.github.com',
    )
    expect(getCommitterEmailDomainWithWarning()).toBe(
      'users.noreply.github.com',
    )
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('does not warn when the committer email domain is configured explicitly', async () => {
    vi.stubEnv('GITHUB_SERVER_URL', 'https://ghes.example.com')
    vi.stubEnv('GITHUB_USER_EMAIL_DOMAIN', 'users.noreply.ghes.example.com')

    const warnSpy = vi.fn()
    vi.doMock('../../../src/utils/logger', () => ({
      logger: {
        getSubLogger: vi.fn().mockReturnValue({ warn: warnSpy }),
      },
    }))

    const { getCommitterEmailDomainWithWarning } = await import(
      '../../../src/utils/server/committer-email'
    )

    expect(getCommitterEmailDomainWithWarning()).toBe(
      'users.noreply.ghes.example.com',
    )
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
