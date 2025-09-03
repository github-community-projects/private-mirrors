import { syncReposHandler } from '../../../src/server/git/controller'
import * as config from '../../../src/bot/config'
import * as auth from '../../../src/utils/auth'
import * as dir from '../../../src/utils/dir'
import simpleGit from 'simple-git'

const getRefSpy = jest.fn()

const fakeOctokitData = {
  accessToken: 'fake-token',
  octokit: {
    rest: {
      git: {
        getRef: getRefSpy,
      },
      repos: {
        get: jest.fn().mockResolvedValue({
          data: {
            owner: {
              login: 'login',
            },
            name: 'name',
          },
        }),
      },
    },
  },
  installationId: 'fake-installation-id',
}
jest.mock('../../../src/bot/octokit', () => ({
  getAuthenticatedOctokit: () => ({
    contribution: fakeOctokitData,
    private: fakeOctokitData,
  }),
}))

jest.mock('simple-git')
const simpleGitMock = simpleGit as jest.Mock
const gitMock = {
  addRemote: jest.fn(),
  branch: jest.fn().mockResolvedValue({
    all: [],
  }),
  checkoutBranch: jest.fn(),
  fetch: jest.fn().mockResolvedValueOnce({}),
  init: jest.fn(),
  pull: jest.fn().mockResolvedValueOnce({}),
  push: jest.fn().mockResolvedValueOnce({}),
  raw: jest.fn(),
  rebase: jest.fn().mockResolvedValue(''),
  reset: jest.fn().mockResolvedValueOnce(''),
  status: jest.fn(),
}
simpleGitMock.mockReturnValue(gitMock)

describe('Git controller', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    gitMock.checkoutBranch.mockReset()
    gitMock.push.mockReset()
    gitMock.rebase.mockReset()
    gitMock.reset.mockReset()
    jest.resetModules()
    process.env = { ...OLD_ENV }
    process.env = OLD_ENV
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('should call checkout, rebase, and push once for sync to fork if the PR is merged with rebase', async () => {
    jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    getRefSpy.mockResolvedValueOnce({
      data: {
        object: {
          sha: 'fork-sha',
        },
      },
    })

    getRefSpy.mockResolvedValueOnce({
      data: {
        object: {
          sha: 'mirror-sha',
        },
      },
    })

    jest
      .spyOn(auth, 'generateAuthUrl')
      .mockReturnValueOnce(
        'https://x-access-token:contributionAccessToken@github.com/forkOwner/forkRepo',
      )
      .mockReturnValueOnce(
        'https://x-access-token:privateAccessToken@github.com/mirrorOwner/mirrorRepo',
      )
    jest.spyOn(dir, 'temporaryDirectory').mockReturnValue('directory')

    process.env.TRIM_INTERNAL_MERGE_COMMITS = '' // Empty string is falsy

    await syncReposHandler({
      input: {
        accessToken: '123',
        orgId: 'test-org',
        destinationTo: 'fork',
        forkOwner: 'github',
        forkName: 'fork-repo',
        mirrorOwner: 'github-test',
        mirrorName: 'mirror-repo',
        mirrorBranchName: 'mirror-branch',
        forkBranchName: 'fork-branch',
      },
    })

    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(1)
    expect(gitMock.checkoutBranch).toHaveBeenCalledWith(
      'mirror-branch',
      'mirror/mirror-branch',
    )
    expect(gitMock.reset).toHaveBeenCalledTimes(0)
    expect(gitMock.rebase).toHaveBeenCalledTimes(1)
    expect(gitMock.rebase).toHaveBeenCalledWith(['fork/fork-branch'])
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(gitMock.push).toHaveBeenCalledWith(
      'fork',
      'mirror-branch:fork-branch',
    )
  })

  it('should call checkout, rebase, and push once for sync to fork if the PR is merged with merge', async () => {
    jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    getRefSpy.mockResolvedValueOnce({
      data: {
        object: {
          sha: 'fork-sha',
        },
      },
    })

    getRefSpy.mockResolvedValueOnce({
      data: {
        object: {
          sha: 'mirror-sha',
        },
      },
    })

    jest
      .spyOn(auth, 'generateAuthUrl')
      .mockReturnValueOnce(
        'https://x-access-token:contributionAccessToken@github.com/forkOwner/forkRepo',
      )
      .mockReturnValueOnce(
        'https://x-access-token:privateAccessToken@github.com/mirrorOwner/mirrorRepo',
      )
    jest.spyOn(dir, 'temporaryDirectory').mockReturnValue('directory')

    process.env.TRIM_INTERNAL_MERGE_COMMITS = 'true' // Any string is truthy

    await syncReposHandler({
      input: {
        accessToken: '123',
        orgId: 'test-org',
        destinationTo: 'fork',
        forkOwner: 'github',
        forkName: 'fork-repo',
        mirrorOwner: 'github-test',
        mirrorName: 'mirror-repo',
        mirrorBranchName: 'mirror-branch',
        forkBranchName: 'fork-branch',
      },
    })

    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(1)
    expect(gitMock.checkoutBranch).toHaveBeenCalledWith(
      'mirror-branch',
      'mirror/mirror-branch',
    )
    expect(gitMock.reset).toHaveBeenCalledTimes(1)
    expect(gitMock.reset).toHaveBeenCalledWith(['--hard', 'HEAD^2'])
    expect(gitMock.rebase).toHaveBeenCalledTimes(1)
    expect(gitMock.rebase).toHaveBeenCalledWith(['fork/fork-branch', '-r'])
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(gitMock.push).toHaveBeenCalledWith(
      'fork',
      'mirror-branch:fork-branch',
    )
  })

  it('should call checkout, rebase, and push once for sync to mirror', async () => {
    jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    getRefSpy.mockResolvedValueOnce({
      data: {
        object: {
          sha: 'fork-sha',
        },
      },
    })

    getRefSpy.mockResolvedValueOnce({
      data: {
        object: {
          sha: 'mirror-sha',
        },
      },
    })

    jest
      .spyOn(auth, 'generateAuthUrl')
      .mockReturnValueOnce(
        'https://x-access-token:contributionAccessToken@github.com/forkOwner/forkRepo',
      )
      .mockReturnValueOnce(
        'https://x-access-token:privateAccessToken@github.com/mirrorOwner/mirrorRepo',
      )
    jest.spyOn(dir, 'temporaryDirectory').mockReturnValue('directory')

    await syncReposHandler({
      input: {
        accessToken: '123',
        orgId: 'test-org',
        destinationTo: 'mirror',
        forkOwner: 'github',
        forkName: 'fork-repo',
        mirrorOwner: 'github-test',
        mirrorName: 'mirror-repo',
        mirrorBranchName: 'mirror-branch',
        forkBranchName: 'fork-branch',
      },
    })

    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(1)
    expect(gitMock.checkoutBranch).toHaveBeenCalledWith(
      'mirror-branch',
      'mirror/mirror-branch',
    )
    expect(gitMock.rebase).toHaveBeenCalledTimes(1)
    expect(gitMock.rebase).toHaveBeenCalledWith(['fork/fork-branch'])
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(gitMock.push).toHaveBeenCalledWith(['--force'])
  })

  it('should return success early if the fork and mirror are already in sync', async () => {
    jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    getRefSpy.mockResolvedValueOnce({
      data: {
        object: {
          sha: 'sha',
        },
      },
    })

    getRefSpy.mockResolvedValueOnce({
      data: {
        object: {
          sha: 'sha',
        },
      },
    })

    const result = await syncReposHandler({
      input: {
        accessToken: '123',
        orgId: 'test-org',
        destinationTo: 'mirror',
        forkOwner: 'github',
        forkName: 'fork-repo',
        mirrorOwner: 'github-test',
        mirrorName: 'mirror-repo',
        mirrorBranchName: 'mirror-branch',
        forkBranchName: 'fork-branch',
      },
    })

    expect(result).toEqual({ success: true })
    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(0)
    expect(gitMock.rebase).toHaveBeenCalledTimes(0)
    expect(gitMock.push).toHaveBeenCalledTimes(0)
  })
})
