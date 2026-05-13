import { vi, describe, beforeEach, it, expect } from 'vitest'
import { syncReposHandler } from '../../../src/server/git/controller'
import * as auth from '../../../src/utils/auth'
import * as dir from '../../../src/utils/dir'
import simpleGit from 'simple-git'
import type { Mock } from 'vitest'
import type { SyncReposSchema } from '../../../src/server/git/schema'

const getRefSpy = vi.fn()

const fakeOctokitData = {
  accessToken: 'fake-token',
  octokit: {
    rest: {
      git: {
        getRef: getRefSpy,
      },
      repos: {
        get: vi.fn().mockResolvedValue({
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
} as unknown as SyncReposSchema['source']['octokit']

vi.mock('simple-git')
const simpleGitMock = simpleGit as unknown as Mock
const gitMock = {
  addRemote: vi.fn(),
  branch: vi.fn().mockResolvedValue({
    all: [],
  }),
  checkoutBranch: vi.fn(),
  fetch: vi.fn().mockResolvedValueOnce({}),
  init: vi.fn(),
  merge: vi.fn().mockResolvedValueOnce({}),
  push: vi.fn().mockResolvedValueOnce({}),
  raw: vi.fn(),
  reset: vi.fn().mockResolvedValueOnce(''),
  show: vi.fn(),
}
simpleGitMock.mockReturnValue(gitMock)

describe('Git controller', () => {
  beforeEach(() => {
    gitMock.checkoutBranch.mockReset()
    gitMock.merge.mockReset()
    gitMock.push.mockReset()
    gitMock.raw.mockReset()
    gitMock.reset.mockReset()
    gitMock.show.mockReset()
  })

  it('should not be syncable', async () => {
    getRefSpy
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'source-sha',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'destination-sha',
          },
        },
      })

    vi.spyOn(auth, 'generateAuthUrl')
      .mockReturnValueOnce(
        'https://x-access-token:contributionAccessToken@github.com/sourceOwner/sourceRepo',
      )
      .mockReturnValueOnce(
        'https://x-access-token:privateAccessToken@github.com/destinationOwner/destinationRepo',
      )
    vi.spyOn(dir, 'temporaryDirectory').mockReturnValue('directory')

    gitMock.raw.mockImplementation(() => {
      throw new Error('Not an ancestor')
    })

    const response = await syncReposHandler({
      input: {
        source: {
          org: 'sourceOrg',
          repo: 'sourceRepo',
          branch: 'sourceBranch',
          octokit: fakeOctokitData,
        },
        destination: {
          org: 'destinationOrg',
          repo: 'destinationRepo',
          branch: 'destinationBranch',
          octokit: fakeOctokitData,
        },
        removeHeadMergeCommit: true,
      },
    })

    expect(response).toEqual({ success: false })
    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(1)
    expect(gitMock.checkoutBranch).toHaveBeenCalledWith(
      'sourceBranch',
      'source/sourceBranch',
    )
    expect(gitMock.raw).toHaveBeenCalledTimes(1)
    expect(gitMock.raw).toHaveBeenCalledWith([
      'merge-base',
      '--is-ancestor',
      'destination-sha',
      'HEAD',
    ])
  })

  it('should be syncable, but have the environment flag set to false', async () => {
    getRefSpy
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'source-sha',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'destination-sha',
          },
        },
      })

    vi.spyOn(auth, 'generateAuthUrl')
      .mockReturnValueOnce(
        'https://x-access-token:contributionAccessToken@github.com/sourceOwner/sourceRepo',
      )
      .mockReturnValueOnce(
        'https://x-access-token:privateAccessToken@github.com/destinationOwner/destinationRepo',
      )
    vi.spyOn(dir, 'temporaryDirectory').mockReturnValue('directory')

    gitMock.raw.mockResolvedValueOnce('')

    const response = await syncReposHandler({
      input: {
        source: {
          org: 'sourceOrg',
          repo: 'sourceRepo',
          branch: 'sourceBranch',
          octokit: fakeOctokitData,
        },
        destination: {
          org: 'destinationOrg',
          repo: 'destinationRepo',
          branch: 'destinationBranch',
          octokit: fakeOctokitData,
        },
        removeHeadMergeCommit: false,
      },
    })

    expect(response).toEqual({ success: true })
    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(2)
    expect(gitMock.checkoutBranch).toHaveBeenNthCalledWith(
      1,
      'sourceBranch',
      'source/sourceBranch',
    )
    expect(gitMock.raw).toHaveBeenCalledTimes(1)
    expect(gitMock.raw).toHaveBeenCalledWith([
      'merge-base',
      '--is-ancestor',
      'destination-sha',
      'HEAD',
    ])
    expect(gitMock.checkoutBranch).toHaveBeenNthCalledWith(
      2,
      'destinationBranch',
      'destination/destinationBranch',
    )
    expect(gitMock.merge).toHaveBeenCalledTimes(1)
    expect(gitMock.merge).toHaveBeenCalledWith([
      '--no-verify',
      '--ff-only',
      'sourceBranch',
    ])
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(gitMock.push).toHaveBeenCalledWith(['--no-verify', '--force'])
  })

  it('should be syncable, have the environment flag set to true, but not be a merge commit', async () => {
    getRefSpy
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'source-sha',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'destination-sha',
          },
        },
      })

    vi.spyOn(auth, 'generateAuthUrl')
      .mockReturnValueOnce(
        'https://x-access-token:contributionAccessToken@github.com/sourceOwner/sourceRepo',
      )
      .mockReturnValueOnce(
        'https://x-access-token:privateAccessToken@github.com/destinationOwner/destinationRepo',
      )
    vi.spyOn(dir, 'temporaryDirectory').mockReturnValue('directory')

    gitMock.raw.mockResolvedValueOnce('')
    gitMock.show.mockResolvedValueOnce('sha1')

    const response = await syncReposHandler({
      input: {
        source: {
          org: 'sourceOrg',
          repo: 'sourceRepo',
          branch: 'sourceBranch',
          octokit: fakeOctokitData,
        },
        destination: {
          org: 'destinationOrg',
          repo: 'destinationRepo',
          branch: 'destinationBranch',
          octokit: fakeOctokitData,
        },
        removeHeadMergeCommit: true,
      },
    })

    expect(response).toEqual({ success: true })
    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(2)
    expect(gitMock.checkoutBranch).toHaveBeenNthCalledWith(
      1,
      'sourceBranch',
      'source/sourceBranch',
    )
    expect(gitMock.raw).toHaveBeenCalledTimes(1)
    expect(gitMock.raw).toHaveBeenCalledWith([
      'merge-base',
      '--is-ancestor',
      'destination-sha',
      'HEAD',
    ])
    expect(gitMock.show).toHaveBeenCalledTimes(1)
    expect(gitMock.show).toHaveBeenCalledWith([
      '--no-patch',
      '--format=%p',
      'source-sha',
    ])
    expect(gitMock.checkoutBranch).toHaveBeenNthCalledWith(
      2,
      'destinationBranch',
      'destination/destinationBranch',
    )
    expect(gitMock.merge).toHaveBeenCalledTimes(1)
    expect(gitMock.merge).toHaveBeenCalledWith([
      '--no-verify',
      '--ff-only',
      'sourceBranch',
    ])
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(gitMock.push).toHaveBeenCalledWith(['--no-verify', '--force'])
  })

  it('should be syncable, have the environment flag set to true, be a merge commit, but not be a merge to main branch', async () => {
    getRefSpy
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'source-sha',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'destination-sha',
          },
        },
      })

    vi.spyOn(auth, 'generateAuthUrl')
      .mockReturnValueOnce(
        'https://x-access-token:contributionAccessToken@github.com/sourceOwner/sourceRepo',
      )
      .mockReturnValueOnce(
        'https://x-access-token:privateAccessToken@github.com/destinationOwner/destinationRepo',
      )
    vi.spyOn(dir, 'temporaryDirectory').mockReturnValue('directory')

    gitMock.raw.mockResolvedValue('')
    gitMock.show.mockResolvedValueOnce('sha1 sha2')

    const response = await syncReposHandler({
      input: {
        source: {
          org: 'sourceOrg',
          repo: 'sourceRepo',
          branch: 'sourceBranch',
          octokit: fakeOctokitData,
        },
        destination: {
          org: 'destinationOrg',
          repo: 'destinationRepo',
          branch: 'destinationBranch',
          octokit: fakeOctokitData,
        },
        removeHeadMergeCommit: true,
      },
    })

    expect(response).toEqual({ success: true })
    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(2)
    expect(gitMock.checkoutBranch).toHaveBeenNthCalledWith(
      1,
      'sourceBranch',
      'source/sourceBranch',
    )
    expect(gitMock.raw).toHaveBeenCalledTimes(2)
    expect(gitMock.raw).toHaveBeenNthCalledWith(1, [
      'merge-base',
      '--is-ancestor',
      'destination-sha',
      'HEAD',
    ])
    expect(gitMock.show).toHaveBeenCalledTimes(1)
    expect(gitMock.show).toHaveBeenCalledWith([
      '--no-patch',
      '--format=%p',
      'source-sha',
    ])
    expect(gitMock.raw).toHaveBeenNthCalledWith(2, [
      'merge-base',
      'HEAD^1',
      'HEAD^2',
    ])
    expect(gitMock.checkoutBranch).toHaveBeenNthCalledWith(
      2,
      'destinationBranch',
      'destination/destinationBranch',
    )
    expect(gitMock.merge).toHaveBeenCalledTimes(1)
    expect(gitMock.merge).toHaveBeenCalledWith([
      '--no-verify',
      '--ff-only',
      'sourceBranch',
    ])
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(gitMock.push).toHaveBeenCalledWith(['--no-verify', '--force'])
  })

  it('should be syncable, have the environment flag set to true, be a merge commit, and be a merge to main branch,', async () => {
    getRefSpy
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'source-sha',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          object: {
            sha: 'destination-sha',
          },
        },
      })

    vi.spyOn(auth, 'generateAuthUrl')
      .mockReturnValueOnce(
        'https://x-access-token:contributionAccessToken@github.com/sourceOwner/sourceRepo',
      )
      .mockReturnValueOnce(
        'https://x-access-token:privateAccessToken@github.com/destinationOwner/destinationRepo',
      )
    vi.spyOn(dir, 'temporaryDirectory').mockReturnValue('directory')

    gitMock.raw
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('destination-sha')
    gitMock.show.mockResolvedValueOnce('sha1 sha2')

    const response = await syncReposHandler({
      input: {
        source: {
          org: 'sourceOrg',
          repo: 'sourceRepo',
          branch: 'sourceBranch',
          octokit: fakeOctokitData,
        },
        destination: {
          org: 'destinationOrg',
          repo: 'destinationRepo',
          branch: 'destinationBranch',
          octokit: fakeOctokitData,
        },
        removeHeadMergeCommit: true,
      },
    })

    expect(response).toEqual({ success: null })
    expect(gitMock.checkoutBranch).toHaveBeenCalledTimes(1)
    expect(gitMock.checkoutBranch).toHaveBeenCalledWith(
      'sourceBranch',
      'source/sourceBranch',
    )
    expect(gitMock.raw).toHaveBeenCalledTimes(2)
    expect(gitMock.raw).toHaveBeenNthCalledWith(1, [
      'merge-base',
      '--is-ancestor',
      'destination-sha',
      'HEAD',
    ])
    expect(gitMock.show).toHaveBeenCalledTimes(1)
    expect(gitMock.show).toHaveBeenCalledWith([
      '--no-patch',
      '--format=%p',
      'source-sha',
    ])
    expect(gitMock.raw).toHaveBeenNthCalledWith(2, [
      'merge-base',
      'HEAD^1',
      'HEAD^2',
    ])
    expect(gitMock.reset).toHaveBeenCalledTimes(1)
    expect(gitMock.reset).toHaveBeenCalledWith(['--hard', 'HEAD^2'])
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(gitMock.push).toHaveBeenCalledWith(['--no-verify', '--force'])
  })
})
