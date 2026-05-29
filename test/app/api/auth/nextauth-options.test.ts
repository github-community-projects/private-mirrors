import { afterEach, describe, expect, it, vi } from 'vitest'

describe('nextAuthOptions GitHub Enterprise wiring', () => {
  afterEach(() => {
    delete process.env.GITHUB_CLIENT_ID
    delete process.env.GITHUB_CLIENT_SECRET
    delete process.env.NEXTAUTH_SECRET
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('fetches user emails from the configured API host', async () => {
    vi.resetModules()
    process.env.GITHUB_CLIENT_ID = 'client-id'
    process.env.GITHUB_CLIENT_SECRET = 'client-secret'
    process.env.NEXTAUTH_SECRET = 'secret'

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { email: 'primary@example.com', primary: true, verified: true },
      ],
    })
    vi.stubGlobal('fetch', fetchSpy)

    const { createGitHubUserinfoRequest } = await import(
      '../../../../src/app/api/auth/lib/nextauth-options'
    )
    const request = createGitHubUserinfoRequest(
      'https://ghes.example.com/api/v3',
    )

    const profile = await request({
      client: {
        userinfo: vi.fn().mockResolvedValue({ email: null }),
      },
      tokens: { access_token: 'user-token' },
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://ghes.example.com/api/v3/user/emails',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token user-token',
        }),
      }),
    )
    expect(profile.email).toBe('primary@example.com')
  })
})
