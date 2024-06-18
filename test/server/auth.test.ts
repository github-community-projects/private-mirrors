import { healthCheckerRouter } from '../../src/app/api/trpc/trpc-router'
import { Octomock } from '../octomock'
import { createTestContext } from '../utils/auth'
import { t } from '../../src/utils/trpc-server'
const om = new Octomock()

jest.mock('../../src/bot/octokit', () => ({
  personalOctokit: () => om.getOctokitImplementation(),
}))

describe('Git router', () => {
  beforeEach(() => {
    om.resetMocks()
    jest.resetAllMocks()
  })

  it('should allow users that are authenticated', async () => {
    const caller =
      t.createCallerFactory(healthCheckerRouter)(createTestContext())

    om.mockFunctions.rest.users.getAuthenticated.mockResolvedValue({
      status: 200,
      data: {
        login: 'test-user',
      },
    })

    const res = await caller.healthChecker()

    expect(res).toEqual('ok')

    expect(om.mockFunctions.rest.users.getAuthenticated).toHaveBeenCalledTimes(
      1,
    )
  })

  it('should throw on invalid sessions', async () => {
    const caller = t.createCallerFactory(healthCheckerRouter)(
      createTestContext({
        user: {
          name: 'fake-username',
          email: 'fake-email',
          image: 'fake-image',
          accessToken: 'bad-token',
        },
        expires: new Date('2030-01-01').toISOString(),
      }),
    )

    om.mockFunctions.rest.users.getAuthenticated.mockResolvedValue({
      status: 401,
      data: {
        message: 'Bad credentials',
      },
    })

    await caller.healthChecker().catch((error) => {
      expect(error.code).toContain('UNAUTHORIZED')
    })

    expect(om.mockFunctions.rest.users.getAuthenticated).toHaveBeenCalledTimes(
      1,
    )
  })
})
