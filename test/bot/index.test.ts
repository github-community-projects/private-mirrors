import * as index from '../../src/bot/index'
import * as config from '../../src/bot/config'
import * as controller from '../../src/server/git/controller'
import { syncPushToFork, syncPushToMirror } from '../../src/bot'
import { PushEvent } from '@octokit/webhooks-types'

const fakeOctokitData = {
  accessToken: 'fake-token',
  octokit: {
    rest: {
      repos: {
        get: jest.fn().mockResolvedValue({
          data: {
            default_branch: 'defaultBranch',
          },
        }),
      },
    },
  },
  installationId: 'fake-installation-id',
}
jest.mock('../../src/bot/octokit', () => ({
  getAuthenticatedOctokit: () => ({
    contribution: fakeOctokitData,
    private: fakeOctokitData,
  }),
}))
const gitController = jest
  .spyOn(controller, 'syncReposHandler')
  .mockResolvedValue({
    success: true,
  })

describe('Bot index', () => {
  beforeEach(() => {
    gitController.mockReset()
  })

  it('should call helper method to sync to fork with correct input values', async () => {
    jest.spyOn(index, 'getPrivateAccessToken').mockResolvedValue('token')
    const gitController = jest
      .spyOn(controller, 'syncReposHandler')
      .mockResolvedValue({
        success: true,
      })

    const payload = {
      organization: {
        id: 'orgId',
      },
      repository: {
        owner: {
          login: 'login',
        },
        name: 'name',
      },
    }
    const forkNameWithOwner = 'org/repo'
    const branch = 'branch'

    await syncPushToFork(
      payload as unknown as PushEvent,
      forkNameWithOwner,
      branch,
    )

    expect(gitController).toHaveBeenCalledTimes(1)
    expect(gitController).toHaveBeenCalledWith({
      input: {
        accessToken: 'token',
        orgId: 'orgId',
        destinationTo: 'fork',
        forkOwner: 'org',
        forkName: 'repo',
        mirrorOwner: 'login',
        mirrorName: 'name',
        mirrorBranchName: 'branch',
        forkBranchName: 'name',
      },
    })
  })

  it('should call helper method to sync to mirror with correct input values', async () => {
    jest.spyOn(index, 'getPrivateAccessToken').mockResolvedValue('token')
    jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'publicOrg',
      privateOrg: 'privateOrg',
    })

    const payload = {
      ref: 'refs/heads/branch',
      organization: {
        id: 'orgId',
      },
      repository: {
        owner: {
          login: 'login',
        },
        name: 'name',
      },
    }

    await syncPushToMirror(payload as unknown as PushEvent)

    //expect(gitController).toHaveBeenCalledTimes(1)
    expect(gitController).toHaveBeenCalledWith({
      input: {
        accessToken: 'token',
        orgId: 'orgId',
        destinationTo: 'mirror',
        forkOwner: 'login',
        forkName: 'name',
        mirrorOwner: 'privateOrg',
        mirrorName: 'branch',
        mirrorBranchName: 'defaultBranch',
        forkBranchName: 'branch',
      },
    })
  })
})
