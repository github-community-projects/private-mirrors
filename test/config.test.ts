import * as config from '../src/bot/config'
import { Octomock } from './octomock'
const om = new Octomock()

jest.mock('../src/bot/octokit', () => ({
  generateAppAccessToken: async () => 'fake-token',
  appOctokit: () => om.getOctokitImplementation(),
  installationOctokit: () => om.getOctokitImplementation(),
}))

describe('ICF Config', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    delete process.env.PUBLIC_ORG
    delete process.env.PRIVATE_ORG
  })

  it('should use env variables when they are available', async () => {
    // set the env variables
    process.env.PUBLIC_ORG = 'github'
    process.env.PRIVATE_ORG = 'github-test'

    const res = await config.getConfig()

    expect(res).toEqual({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })
  })

  it('should use the public org for both values when only PUBLIC_ORG provided', async () => {
    // set the env variables
    process.env.PUBLIC_ORG = 'github'

    const res = await config.getConfig()

    expect(res).toEqual({
      publicOrg: 'github',
      privateOrg: 'github',
    })
  })

  it('should throw an error when no env and no org id provided', async () => {
    await config.getConfig().catch((error) => {
      expect(error.message).toContain('Organization ID is required')
    })
  })
})
