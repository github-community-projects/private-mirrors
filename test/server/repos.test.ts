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

import * as config from '../../src/bot/config'
import * as auth from '../../src/utils/auth'
import reposRouter from '../../src/server/repos/router'
import { Octomock } from '../octomock'
import { createTestContext } from '../utils/auth'
import { t } from '../../src/utils/trpc-server'
const om = new Octomock()

jest.mock('../../src/bot/config')
jest.mock('../../src/bot/octokit', () => ({
  generateAppAccessToken: async () => 'fake-token',
  appOctokit: () => om.getOctokitImplementation(),
  installationOctokit: () => om.getOctokitImplementation(),
  getAuthenticatedOctokit: () => ({
    contribution: {
      accessToken: 'fake-token',
      octokit: om.getOctokitImplementation(),
      installationId: 'fake-installation-id',
    },
    private: {
      accessToken: 'fake-token',
      octokit: om.getOctokitImplementation(),
      installationId: 'fake-installation-id',
    },
  }),
}))
jest.mock('../../src/utils/auth')

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

const fakeOrgCustomProperties = {
  status: 200,
  data: [
    {
      property_name: 'fork',
      value_type: 'string',
      required: false,
      values_editable_by: 'org_actors',
    },
  ],
}

jest.spyOn(auth, 'checkGitHubAuth').mockResolvedValue()

describe('Repos router', () => {
  beforeEach(() => {
    om.resetMocks()
    jest.resetAllMocks()
  })

  it('should create a mirror when repo does not exist exist', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeForkRepo)
    om.mockFunctions.rest.orgs.getAllCustomProperties.mockResolvedValue(
      fakeOrgCustomProperties,
    )
    om.mockFunctions.rest.orgs.createOrUpdateCustomProperty.mockResolvedValue(
      fakeOrgCustomProperties,
    )
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
    expect(configSpy).toHaveBeenCalledTimes(1)
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

  it('should throw an error when repo already exists', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

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

    expect(configSpy).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.delete).toHaveBeenCalledTimes(0)
    expect(stubbedGit.clone).toHaveBeenCalledTimes(0)
  })

  it('should cleanup repos when there is an error', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeMirrorRepo)
    stubbedGit.clone.mockResolvedValue({})
    om.mockFunctions.rest.orgs.getAllCustomProperties.mockResolvedValue({
      data: [{ fork: 'test' }],
    })
    om.mockFunctions.rest.repos.createInOrg.mockResolvedValue({
      data: { owner: { login: 'github' } },
    })

    // error after repo creation so that cleanup can be tested
    stubbedGit.addRemote.mockRejectedValue(new Error('error adding remote'))

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
        expect(error.message).toEqual('error adding remote')
      })

    expect(configSpy).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(2)
    expect(om.mockFunctions.rest.repos.delete).toHaveBeenCalledWith({
      owner: 'github',
      repo: 'test',
    })
    expect(stubbedGit.clone).toHaveBeenCalledTimes(1)
  })

  it('dual-org: should cleanup repos when there is an error', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = jest.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeMirrorRepo)
    stubbedGit.clone.mockResolvedValue({})
    om.mockFunctions.rest.orgs.getAllCustomProperties.mockResolvedValue({
      data: [{ fork: 'test' }],
    })
    om.mockFunctions.rest.repos.createInOrg.mockResolvedValue({
      data: { owner: { login: 'github-test' } },
    })
    om.mockFunctions.rest.repos.delete.mockResolvedValue({})

    // error after repo creation so that cleanup can be tested
    stubbedGit.addRemote.mockRejectedValue(new Error('error adding remote'))

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
        expect(error.message).toEqual('error adding remote')
      })

    expect(configSpy).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(2)
    expect(om.mockFunctions.rest.repos.delete).toHaveBeenCalledWith({
      owner: 'github-test',
      repo: 'test',
    })
    expect(stubbedGit.clone).toHaveBeenCalledTimes(1)
  })

  it('reject repository names over the character limit', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    await caller
      .createMirror({
        forkId: 'test',
        orgId: 'test',
        forkRepoName: 'fork-test',
        forkRepoOwner: 'github',
        newBranchName: 'test',
        newRepoName: 'a'.repeat(101),
      })
      .catch((error) => {
        expect(error.message).toMatch(
          /String must contain at most 100 character\(s\)/,
        )
      })
  })
})
