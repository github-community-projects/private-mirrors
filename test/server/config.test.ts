import * as config from '../../src/bot/config'
import * as auth from '../../src/utils/auth'
import configRouter from '../../src/server/config/router'
import { Octomock } from '../octomock'
import { createTestContext } from '../utils/auth'

const om = new Octomock()

jest.mock('../../src/bot/config')

jest.spyOn(auth, 'checkGitHubAuth').mockResolvedValue()

describe('Config router', () => {
  beforeEach(() => {
    om.resetMocks()
    jest.resetAllMocks()
  })

  it('should fetch the values from the config', async () => {
    const caller = configRouter.createCaller(createTestContext())

    const configSpy = jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    const res = await caller.getConfig({
      orgId: 'github',
    })

    expect(res).toEqual({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })
    expect(configSpy).toHaveBeenCalledTimes(1)
  })
})
