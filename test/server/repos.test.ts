import { vi, describe, beforeEach, it, expect } from 'vitest'
// TODO: We should only mock out clone and push but keep the rest of the options
// the same. This will allow us to test the actual git commands.
const stubbedGit = {
  clone: vi.fn(),
  push: vi.fn(),
  addRemote: vi.fn(),
  fetch: vi.fn(),
  checkoutBranch: vi.fn(),
  mergeFromTo: vi.fn(),
  raw: vi.fn(),
}

vi.mock('simple-git', () => ({
  default: () => stubbedGit,
}))

import * as config from '../../src/bot/config'
import * as auth from '../../src/utils/auth'
import reposRouter from '../../src/server/repos/router'
import { Octomock } from '../octomock'
import { createTestContext } from '../utils/auth'
import { t } from '../../src/utils/trpc-server'
const om = new Octomock()
const UNMODIFIED_ENV = process.env

vi.mock('../../src/bot/config')
vi.mock('../../src/bot/octokit', () => ({
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
vi.mock('../../src/utils/auth')

const fakeForkRepo = {
  status: 200,
  data: {
    clone_url: 'https://github.com/github-test/fork-test.git',
    login: 'fork-test',
    default_branch: 'main',
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

const fakeBranchRef = {
  status: 200,
  data: {
    object: {
      sha: 'deadbeef',
    },
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

vi.spyOn(auth, 'checkGitHubAuth').mockResolvedValue()

describe('Repos router', () => {
  beforeEach(() => {
    om.resetMocks()
    vi.resetAllMocks()
    process.env = { ...UNMODIFIED_ENV }
    // Default to a small commit count so the chunked push loop is skipped and
    // only the final tip push runs. Tests that exercise chunking override this.
    stubbedGit.raw.mockResolvedValue('2\n')
  })

  it('should create a mirror when repo does not exist', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = vi.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeForkRepo)
    om.mockFunctions.rest.git.getRef.mockResolvedValue(fakeBranchRef)
    om.mockFunctions.rest.git.createRef.mockResolvedValue({ status: 201 })
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
      newRepoName: 'test',
    })

    // TODO: use real git operations and verify fs state after
    expect(configSpy).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(2)
    expect(om.mockFunctions.rest.git.getRef).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.git.createRef).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: 'refs/heads/test',
        sha: 'deadbeef',
      }),
    )
    expect(stubbedGit.clone).toHaveBeenCalledTimes(1)
    const cloneArgs = stubbedGit.clone.mock.calls[0]
    expect(cloneArgs[2]).toEqual([
      '--single-branch',
      '--branch',
      'main',
      '--no-tags',
    ])
    expect(stubbedGit.addRemote.mock.calls[0][0]).toBe('mirror')
    expect(stubbedGit.push).toHaveBeenCalledTimes(1)
    expect(stubbedGit.push).toHaveBeenCalledWith([
      '--no-verify',
      'mirror',
      'main',
    ])
    expect(stubbedGit.checkoutBranch).not.toHaveBeenCalled()

    expect(res).toEqual({
      success: true,
      pending: false,
      data: fakeMirrorRepo.data,
    })
  })

  it('should throw an error when repo already exists', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = vi.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValue(fakeMirrorRepo)
    om.mockFunctions.rest.repos.delete.mockResolvedValue({})

    await expect(
      caller.createMirror({
        forkId: 'test',
        orgId: 'test',
        forkRepoName: 'fork-test',
        forkRepoOwner: 'github',
        newRepoName: 'test',
      }),
    ).rejects.toThrow('a mirror named test already exists in github')

    expect(configSpy).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.delete).toHaveBeenCalledTimes(0)
    expect(stubbedGit.clone).toHaveBeenCalledTimes(0)
  })

  it('should cleanup repos when there is an error', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = vi.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeForkRepo)
    om.mockFunctions.rest.git.getRef.mockResolvedValue(fakeBranchRef)
    om.mockFunctions.rest.git.createRef.mockResolvedValue({ status: 201 })
    stubbedGit.clone.mockResolvedValue({})
    om.mockFunctions.rest.orgs.getAllCustomProperties.mockResolvedValue({
      data: [{ fork: 'test' }],
    })
    om.mockFunctions.rest.repos.createInOrg.mockResolvedValue({
      data: { owner: { login: 'github' }, name: 'test' },
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
    expect(om.mockFunctions.rest.git.deleteRef).toHaveBeenCalledWith({
      owner: 'github',
      repo: 'fork-test',
      ref: 'heads/test',
    })
    expect(stubbedGit.clone).toHaveBeenCalledTimes(1)
  })

  it('dual-org: should cleanup repos when there is an error', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = vi.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeForkRepo)
    om.mockFunctions.rest.git.getRef.mockResolvedValue(fakeBranchRef)
    om.mockFunctions.rest.git.createRef.mockResolvedValue({ status: 201 })
    stubbedGit.clone.mockResolvedValue({})
    om.mockFunctions.rest.orgs.getAllCustomProperties.mockResolvedValue({
      data: [{ fork: 'test' }],
    })
    om.mockFunctions.rest.repos.createInOrg.mockResolvedValue({
      data: { owner: { login: 'github-test' }, name: 'test' },
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
    expect(om.mockFunctions.rest.git.deleteRef).toHaveBeenCalledWith({
      owner: 'github',
      repo: 'fork-test',
      ref: 'heads/test',
    })
    expect(stubbedGit.clone).toHaveBeenCalledTimes(1)
  })

  it('should create an internal repo when the CREATE_MIRRORS_WITH_INTERNAL_VISIBILITY flag is used', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    const configSpy = vi.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeForkRepo)
    om.mockFunctions.rest.git.getRef.mockResolvedValue(fakeBranchRef)
    om.mockFunctions.rest.git.createRef.mockResolvedValue({ status: 201 })
    om.mockFunctions.rest.orgs.getAllCustomProperties.mockResolvedValue(
      fakeOrgCustomProperties,
    )
    om.mockFunctions.rest.orgs.createOrUpdateCustomProperty.mockResolvedValue(
      fakeOrgCustomProperties,
    )
    om.mockFunctions.rest.repos.createInOrg.mockResolvedValue(fakeMirrorRepo)

    // set the environment variable to trigger mirrors being created with internal visibility
    process.env.CREATE_MIRRORS_WITH_INTERNAL_VISIBILITY = 'true'

    const res = await caller.createMirror({
      forkId: 'test',
      orgId: 'test',
      forkRepoName: 'fork-test',
      forkRepoOwner: 'github',
      newRepoName: 'test',
    })

    // TODO: use real git operations and verify fs state after
    expect(configSpy).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.get).toHaveBeenCalledTimes(2)
    expect(stubbedGit.clone).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.createInOrg).toHaveBeenCalledTimes(1)
    expect(om.mockFunctions.rest.repos.createInOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: 'internal',
      }),
    )
    expect(stubbedGit.addRemote).toHaveBeenCalledTimes(1)
    expect(stubbedGit.push).toHaveBeenCalledTimes(1)
    expect(stubbedGit.checkoutBranch).not.toHaveBeenCalled()

    expect(res).toEqual({
      success: true,
      pending: false,
      data: fakeMirrorRepo.data,
    })
  })

  it('pushes large repos in chunks of commits', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    vi.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeForkRepo)
    om.mockFunctions.rest.git.getRef.mockResolvedValue(fakeBranchRef)
    om.mockFunctions.rest.git.createRef.mockResolvedValue({ status: 201 })
    om.mockFunctions.rest.orgs.getAllCustomProperties.mockResolvedValue(
      fakeOrgCustomProperties,
    )
    om.mockFunctions.rest.repos.createInOrg.mockResolvedValue(fakeMirrorRepo)

    // 5 commits with chunk size 2: loop iterates at skip=3 (c2) and skip=1
    // (c4), then a final tip push lands the actual branch — three pushes.
    // rev-list returns commits newest-first, so --skip=N from a 5-commit
    // history returns the commit at oldest-first index (4 - N).
    const commits = ['c1', 'c2', 'c3', 'c4', 'c5']
    stubbedGit.raw.mockImplementation(async (args: string[]) => {
      if (args.includes('--count')) return `${commits.length}\n`
      const skipArg = args.find((a) => a.startsWith('--skip='))!
      const skip = Number(skipArg.split('=')[1])
      return `${commits[commits.length - 1 - skip]}\n`
    })
    vi.stubEnv('MIRROR_PUSH_CHUNK_SIZE', '2')

    const res = await caller.createMirror({
      forkId: 'test',
      orgId: 'test',
      forkRepoName: 'fork-test',
      forkRepoOwner: 'github',
      newRepoName: 'test',
    })

    expect(stubbedGit.push).toHaveBeenCalledTimes(3)
    expect(stubbedGit.push).toHaveBeenNthCalledWith(1, [
      '--no-verify',
      'mirror',
      'c2:refs/heads/main',
    ])
    expect(stubbedGit.push).toHaveBeenNthCalledWith(2, [
      '--no-verify',
      'mirror',
      'c4:refs/heads/main',
    ])
    expect(stubbedGit.push).toHaveBeenNthCalledWith(3, [
      '--no-verify',
      'mirror',
      'main',
    ])

    expect(res).toEqual({
      success: true,
      pending: false,
      data: fakeMirrorRepo.data,
    })
  })

  it('returns pending when git work exceeds the sync timeout and cleans up on background failure', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    vi.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
      fakeOrgInstallation,
    )
    om.mockFunctions.rest.orgs.get.mockResolvedValue(fakeOrg)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(repoNotFound)
    om.mockFunctions.rest.repos.get.mockResolvedValueOnce(fakeForkRepo)
    om.mockFunctions.rest.git.getRef.mockResolvedValue(fakeBranchRef)
    om.mockFunctions.rest.git.createRef.mockResolvedValue({ status: 201 })
    om.mockFunctions.rest.orgs.getAllCustomProperties.mockResolvedValue(
      fakeOrgCustomProperties,
    )
    om.mockFunctions.rest.repos.createInOrg.mockResolvedValue(fakeMirrorRepo)

    // Force the git work to never resolve during the sync window so the
    // timeout branch is taken. Capture the reject so we can trip it after.
    let rejectPush: (err: Error) => void = () => {}
    const pushPromise = new Promise((_resolve, reject) => {
      rejectPush = reject
    })
    stubbedGit.clone.mockResolvedValue({})
    stubbedGit.addRemote.mockResolvedValue({})
    stubbedGit.push.mockReturnValue(pushPromise)

    // Resolve when cleanup actually runs, so the test waits exactly until the
    // background .catch handler completes
    const cleanupCalled = new Promise<void>((resolve) => {
      om.mockFunctions.rest.git.deleteRef.mockImplementation(async () => {
        resolve()
        return {}
      })
    })
    om.mockFunctions.rest.repos.delete.mockResolvedValue({})

    // Shrink the sync timeout so the test completes quickly without fake timers.
    vi.stubEnv('MIRROR_SYNC_TIMEOUT_MS', '50')

    const res = await caller.createMirror({
      forkId: 'test',
      orgId: 'test',
      forkRepoName: 'fork-test',
      forkRepoOwner: 'github',
      newRepoName: 'test',
    })

    expect(res).toEqual({
      success: true,
      pending: true,
      data: fakeMirrorRepo.data,
    })

    // Trip the background failure and wait for cleanup to actually run.
    rejectPush(new Error('background push failed'))
    await cleanupCalled

    expect(om.mockFunctions.rest.repos.delete).toHaveBeenCalledWith({
      owner: 'github-test',
      repo: 'test',
    })
    expect(om.mockFunctions.rest.git.deleteRef).toHaveBeenCalledWith({
      owner: 'github',
      repo: 'fork-test',
      ref: 'heads/test',
    })
  })

  it('reject repository names over the character limit', async () => {
    const caller = t.createCallerFactory(reposRouter)(createTestContext())

    await caller
      .createMirror({
        forkId: 'test',
        orgId: 'test',
        forkRepoName: 'fork-test',
        forkRepoOwner: 'github',
        newRepoName: 'a'.repeat(101),
      })
      .catch((error) => {
        expect(error.message).toMatch(
          /Mirror name cannot exceed 100 characters/,
        )
      })
  })

  describe('editMirror', () => {
    it('renames the mirror and the sync branch ref on the public fork', async () => {
      const caller = t.createCallerFactory(reposRouter)(createTestContext())

      vi.spyOn(config, 'getConfig').mockResolvedValue({
        publicOrg: 'github',
        privateOrg: 'github-test',
      })

      om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
        fakeOrgInstallation,
      )
      om.mockFunctions.rest.repos.getCustomPropertiesValues.mockResolvedValue({
        status: 200,
        data: [{ property_name: 'fork', value: 'github/fork-test' }],
      })
      om.mockFunctions.rest.repos.update.mockResolvedValue({
        status: 200,
        data: { name: 'renamed' },
      })
      om.mockFunctions.rest.repos.renameBranch.mockResolvedValue({
        status: 201,
      })

      const res = await caller.editMirror({
        orgId: 'test',
        mirrorName: 'old-name',
        newMirrorName: 'new-name',
      })

      expect(om.mockFunctions.rest.repos.update).toHaveBeenCalledWith({
        owner: 'github-test',
        repo: 'old-name',
        name: 'new-name',
      })
      expect(om.mockFunctions.rest.repos.renameBranch).toHaveBeenCalledWith({
        owner: 'github',
        repo: 'fork-test',
        branch: 'old-name',
        new_name: 'new-name',
      })
      expect(res.success).toBe(true)
    })

    it('still succeeds when the fork ref rename fails', async () => {
      const caller = t.createCallerFactory(reposRouter)(createTestContext())

      vi.spyOn(config, 'getConfig').mockResolvedValue({
        publicOrg: 'github',
        privateOrg: 'github-test',
      })

      om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
        fakeOrgInstallation,
      )
      om.mockFunctions.rest.repos.getCustomPropertiesValues.mockResolvedValue({
        status: 200,
        data: [{ property_name: 'fork', value: 'github/fork-test' }],
      })
      om.mockFunctions.rest.repos.update.mockResolvedValue({
        status: 200,
        data: { name: 'renamed' },
      })
      om.mockFunctions.rest.repos.renameBranch.mockRejectedValue(
        new Error('no branch'),
      )

      const res = await caller.editMirror({
        orgId: 'test',
        mirrorName: 'old-name',
        newMirrorName: 'new-name',
      })

      expect(om.mockFunctions.rest.repos.update).toHaveBeenCalled()
      expect(res.success).toBe(true)
    })

    it('skips the branch rename when the fork custom property cannot be read', async () => {
      const caller = t.createCallerFactory(reposRouter)(createTestContext())

      vi.spyOn(config, 'getConfig').mockResolvedValue({
        publicOrg: 'github',
        privateOrg: 'github-test',
      })

      om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
        fakeOrgInstallation,
      )
      om.mockFunctions.rest.repos.getCustomPropertiesValues.mockRejectedValue(
        new Error('nope'),
      )
      om.mockFunctions.rest.repos.update.mockResolvedValue({
        status: 200,
        data: { name: 'renamed' },
      })

      const res = await caller.editMirror({
        orgId: 'test',
        mirrorName: 'old-name',
        newMirrorName: 'new-name',
      })

      expect(om.mockFunctions.rest.repos.update).toHaveBeenCalledWith({
        owner: 'github-test',
        repo: 'old-name',
        name: 'new-name',
      })
      expect(om.mockFunctions.rest.repos.renameBranch).not.toHaveBeenCalled()
      expect(res.success).toBe(true)
    })
  })

  describe('deleteMirror', () => {
    it('deletes the mirror and the sync branch ref on the public fork', async () => {
      const caller = t.createCallerFactory(reposRouter)(createTestContext())

      vi.spyOn(config, 'getConfig').mockResolvedValue({
        publicOrg: 'github',
        privateOrg: 'github-test',
      })

      om.mockFunctions.rest.apps.getOrgInstallation.mockResolvedValue(
        fakeOrgInstallation,
      )
      om.mockFunctions.rest.repos.getCustomPropertiesValues.mockResolvedValue({
        status: 200,
        data: [{ property_name: 'fork', value: 'github/fork-test' }],
      })
      om.mockFunctions.rest.repos.delete.mockResolvedValue({ status: 204 })
      om.mockFunctions.rest.git.deleteRef.mockResolvedValue({ status: 204 })

      const res = await caller.deleteMirror({
        orgId: 'test',
        mirrorName: 'to-delete',
      })

      expect(om.mockFunctions.rest.repos.delete).toHaveBeenCalledWith({
        owner: 'github-test',
        repo: 'to-delete',
      })
      expect(om.mockFunctions.rest.git.deleteRef).toHaveBeenCalledWith({
        owner: 'github',
        repo: 'fork-test',
        ref: 'heads/to-delete',
      })
      expect(res.success).toBe(true)
    })
  })
})
