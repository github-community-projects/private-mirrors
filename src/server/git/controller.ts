import { getConfig } from '../../bot/config'
import { getAuthenticatedOctokit } from '../../bot/octokit'
import { logger } from '../../utils/logger'
import { CreateMirrorSchema, SyncReposSchema } from './schema'
import { generateAuthUrl } from '../../utils/auth'
import { temporaryDirectory } from '../../utils/dir'
import simpleGit, { SimpleGitOptions } from 'simple-git'

const gitApiLogger = logger.getSubLogger({ name: 'git-api' })

export const syncReposHandler = async ({
  input,
}: {
  input: SyncReposSchema
}) => {
  try {
    gitApiLogger.info('Syncing repos', { input })

    const config = await getConfig(input.orgId)

    gitApiLogger.debug('Fetched config', config)

    const { publicOrg, privateOrg } = config

    const octokitData = await getAuthenticatedOctokit(publicOrg, privateOrg)
    const contributionOctokit = octokitData.contribution.octokit
    const contributionAccessToken = octokitData.contribution.accessToken

    const privateOctokit = octokitData.private.octokit
    const privateInstallationId = octokitData.private.installationId
    const privateAccessToken = octokitData.private.accessToken

    const forkRepo = await contributionOctokit.rest.repos.get({
      owner: input.forkOwner,
      repo: input.forkName,
    })

    const mirrorRepo = await privateOctokit.rest.repos.get({
      owner: input.mirrorOwner,
      repo: input.mirrorName,
    })

    gitApiLogger.debug('Fetched both fork and mirror repos')

    const forkRemote = generateAuthUrl(
      contributionAccessToken,
      forkRepo.data.owner.login,
      forkRepo.data.name,
    )

    const mirrorRemote = generateAuthUrl(
      privateAccessToken,
      mirrorRepo.data.owner.login,
      mirrorRepo.data.name,
    )

    // First clone the fork and mirror repos into the same folder
    const tempDir = temporaryDirectory()

    const options: Partial<SimpleGitOptions> = {
      config: [
        `user.name=internal-contribution-forks[bot]`,
        `user.email=${privateInstallationId}+internal-contribution-forks[bot]@users.noreply.github.com`,
      ],
    }

    const git = simpleGit(tempDir, options)
    await git.init()
    await git.addRemote('fork', forkRemote)
    await git.addRemote('mirror', mirrorRemote)
    await git.fetch(['fork'])
    await git.fetch(['mirror'])

    // Check if the branch exists on both repos
    const forkBranches = await git.branch(['--list', 'fork/*'])
    const mirrorBranches = await git.branch(['--list', 'mirror/*'])

    gitApiLogger.debug('branches', {
      forkBranches: forkBranches.all,
      mirrorBranches: mirrorBranches.all,
    })

    if (input.destinationTo === 'fork') {
      await git.checkoutBranch(
        input.forkBranchName,
        `fork/${input.forkBranchName}`,
      )
      gitApiLogger.debug('Checked out branch', input.forkBranchName)
      await git.mergeFromTo(
        `mirror/${input.mirrorBranchName}`,
        input.forkBranchName,
      )
      gitApiLogger.debug('Merged branches')
      gitApiLogger.debug('git status', await git.status())
      await git.push('fork', input.forkBranchName)
    } else {
      await git.checkoutBranch(
        input.mirrorBranchName,
        `mirror/${input.mirrorBranchName}`,
      )
      gitApiLogger.debug('Checked out branch', input.mirrorBranchName)
      await git.mergeFromTo(
        `fork/${input.forkBranchName}`,
        input.mirrorBranchName,
      )
      gitApiLogger.debug('Merged branches')
      gitApiLogger.debug('git status', await git.status())
      await git.push('mirror', input.mirrorBranchName)
    }

    return {
      success: true,
    }
  } catch (error) {
    gitApiLogger.error('Error syncing repos', { error })
  }
}

export const createMirrorHandler = async ({
  input,
}: {
  input: CreateMirrorSchema
}) => {
  try {
    gitApiLogger.info('createMirror', { input: input })

    const config = await getConfig(input.orgId)

    gitApiLogger.debug('Fetched config', config)

    const { publicOrg, privateOrg } = config

    const octokitData = await getAuthenticatedOctokit(publicOrg, privateOrg)
    const contributionOctokit = octokitData.contribution.octokit
    const contributionAccessToken = octokitData.contribution.accessToken

    const privateOctokit = octokitData.private.octokit
    const privateInstallationId = octokitData.private.installationId
    const privateAccessToken = octokitData.private.accessToken

    const orgData = await contributionOctokit.rest.orgs.get({
      org: publicOrg,
    })

    try {
      const exists = await contributionOctokit.rest.repos.get({
        owner: orgData.data.login,
        repo: input.newRepoName,
      })
      if (exists.status === 200) {
        gitApiLogger.info(
          `Repo ${orgData.data.login}/${input.newRepoName} already exists`,
        )
        throw new Error(
          `Repo ${orgData.data.login}/${input.newRepoName} already exists`,
        )
      }
    } catch (e) {
      // We just threw this error, so we know it's safe to rethrow
      if ((e as Error).message.includes('already exists')) {
        throw e
      }

      if (!(e as Error).message.includes('Not Found')) {
        logger.error({ error: e })
        throw e
      }
    }

    try {
      const forkData = await contributionOctokit.rest.repos.get({
        owner: input.forkRepoOwner,
        repo: input.forkRepoName,
      })

      // Now create a temporary directory to clone the repo into
      const tempDir = temporaryDirectory()

      const options: Partial<SimpleGitOptions> = {
        config: [
          `user.name=internal-contribution-forks[bot]`,
          // We want to use the private installation ID as the email so that we can push to the private repo
          `user.email=${privateInstallationId}+internal-contribution-forks[bot]@users.noreply.github.com`,
        ],
      }
      const git = simpleGit(tempDir, options)
      const remote = generateAuthUrl(
        contributionAccessToken,
        input.forkRepoOwner,
        input.forkRepoName,
      )

      await git.clone(remote, tempDir)

      // Get the organization custom properties
      const orgCustomProps =
        await privateOctokit.rest.orgs.getAllCustomProperties({
          org: privateOrg,
        })

      // Creates custom property fork in the org if it doesn't exist
      if (
        !orgCustomProps.data.some(
          (prop: { property_name: string }) => prop.property_name === 'fork',
        )
      ) {
        await privateOctokit.rest.orgs.createOrUpdateCustomProperty({
          org: privateOrg,
          custom_property_name: 'fork',
          value_type: 'string',
        })
      }

      // This repo needs to be created in the private org
      const newRepo = await privateOctokit.rest.repos.createInOrg({
        name: input.newRepoName,
        org: privateOrg,
        private: true,
        description: `Mirror of ${input.forkRepoOwner}/${input.forkRepoName}`,
        custom_properties: {
          fork: `${input.forkRepoOwner}/${input.forkRepoName}`,
        },
      })

      const defaultBranch = forkData.data.default_branch

      // Add the mirror remote
      const upstreamRemote = generateAuthUrl(
        privateAccessToken,
        newRepo.data.owner.login,
        newRepo.data.name,
      )
      await git.addRemote('upstream', upstreamRemote)
      await git.push('upstream', defaultBranch)

      // Create a new branch on both
      await git.checkoutBranch(input.newBranchName, defaultBranch)
      await git.push('origin', input.newBranchName)

      return {
        success: true,
        data: newRepo.data,
      }
    } catch (e) {
      // Clean up the repo made
      await privateOctokit.rest.repos.delete({
        owner: orgData.data.login,
        repo: input.newRepoName,
      })

      logger.error({ error: e })

      throw e
    }
  } catch (error) {}
}
