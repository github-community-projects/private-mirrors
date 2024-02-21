// TODO: We should only mock out clone and push but keep the rest of the options
// the same. This will allow us to test the actual git commands.
const stubbedGit = {
  clone: jest.fn(),
  push: jest.fn(),
  addRemote: jest.fn(),
  fetch: jest.fn(),
  checkoutBranch: jest.fn(),
  mergeFromTo: jest.fn(),
}

jest.mock('simple-git', () => {
  return () => stubbedGit
})

import { gitRouter } from '../../src/server/routers/git'
import { Octomock } from '../octomock'
const om = new Octomock()

jest.mock('../../src/bot/octokit', () => ({
  generateAppAccessToken: async () => 'fake-token',
  appOctokit: () => om.getOctokitImplementation(),
  installationOctokit: () => om.getOctokitImplementation(),
}))

const fakeForkRepo = {
  status: 200,
  data: {
    clone_url: 'https://github.com/github-test/fork-test.git',
    login: 'fork-test',
    owner: {
      login: 'github-test',
    },
  },
}

const fakeMirrorRepo = {
  status: 200,
  data: {
    clone_url: 'https://github.com/github-test/mirror-test.git',
    login: 'mirror-test',
    owner: {
      login: 'github-test',
    },
  },
}

const fakeOrg = {
  status: 200,
  data: {
    login: 'github-test',
  },
}

const fakeInstallationId = 'fake-installation-id'

const fakeOrgInstallation = {
  status: 200,
  data: {
    id: fakeInstallationId,
  },
}

const repoNotFound = {
  status: 404,
  data: {
    message: 'Not Found',
  },
}

describe('Git router', () => {
  beforeEach(() => {
    om.resetMocks()
    jest.resetAllMocks()
  })

  test('should create a mirror when repo does not exist exist', async () => {
    const caller = gitRouter.createCaller({})

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeForkRepo)
    om.mockFunctions.rest.repos.createInOrg.mockResolvedValue(fakeMirrorRepo)

    const res = await caller.createMirror({
      forkId: 'test',
      orgId: 'test',
      forkRepoName: 'fork-test',
      forkRepoOwner: 'github',
      newBranchName: 'test',
      newRepoName: 'test',
    })

    // TODO: use real git operations and verify fs state after
    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(2)
    expect(stubbedGit.clone).toHaveBeenCalledTimes(1)
    expect(stubbedGit.addRemote).toHaveBeenCalledTimes(1)
    expect(stubbedGit.push).toHaveBeenCalledTimes(2)
    expect(stubbedGit.checkoutBranch).toHaveBeenCalledTimes(1)
    expect(res).toEqual({
      success: true,
      data: fakeMirrorRepo.data,
    })
  })

  test('should throw an error when repo already exists', async () => {
    const caller = gitRouter.createCaller({})

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValue(fakeMirrorRepo)
    om.mockFunctions.rest.repos.delete.mockResolvedValue({})

    await caller
      .createMirror({
        forkId: 'test',
        orgId: 'test',
        forkRepoName: 'fork-test',
        forkRepoOwner: 'github',
        newBranchName: 'test',
        newRepoName: 'test',
      })
      .catch((error) => {
        expect(error.message).toEqual('Repo github-test/test already exists')
      })

    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.delete).toHaveBeenCalledTimes(0)
    expect(stubbedGit.clone).toHaveBeenCalledTimes(0)
  })

  test('should cleanup repos when there is an error', async () => {
    const caller = gitRouter.createCaller({})

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeMirrorRepo)
    om.mockFunctions.rest.repos.delete.mockResolvedValue({})

    stubbedGit.clone.mockRejectedValue(new Error('clone error'))

    await caller
      .createMirror({
        forkId: 'test',
        orgId: 'test',
        forkRepoName: 'fork-test',
        forkRepoOwner: 'github',
        newBranchName: 'test',
        newRepoName: 'test',
      })
      .catch((error) => {
        expect(error.message).toEqual('clone error')
      })

    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(2)
    expect(om.mockFunctions.rest.repos.delete).toHaveBeenCalledTimes(1)
    expect(stubbedGit.clone).toHaveBeenCalledTimes(1)
  })
})
