import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import * as auth from '../../src/utils/auth'
import { gitProcedure, procedure, t } from '../../src/utils/trpc-server'
import { createTestContext } from './auth'

vi.mock('../../src/utils/auth')

const input = {
  orgId: 'org-1',
  accessToken: 'app-token',
  mirrorOwner: 'owner',
  mirrorName: 'mirror',
}

const ok = (p: typeof procedure) =>
  p.input(z.record(z.string(), z.string())).query(() => 'ok')

const caller = t.createCallerFactory(
  t.router({ user: ok(procedure), app: ok(gitProcedure) }),
)(createTestContext())

describe('tRPC auth middleware', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([
    {
      name: 'verifyAuth',
      call: () => caller.user(input),
      check: auth.checkGitHubAuth,
      args: ['fake-access-token', 'org-1'],
    },
    {
      name: 'verifyGitHubAppAuth',
      call: () => caller.app(input),
      check: auth.checkGitHubAppInstallationAuth,
      args: ['app-token', 'owner', 'mirror'],
    },
  ])(
    '$name passes raw input to its auth check',
    async ({ call, check, args }) => {
      await expect(call()).resolves.toBe('ok')
      expect(check).toHaveBeenCalledWith(...args)
    },
  )

  it('rejects when the auth check throws', async () => {
    vi.mocked(auth.checkGitHubAuth).mockRejectedValue(new Error('denied'))

    await expect(caller.user(input)).rejects.toThrow('denied')
  })
})
