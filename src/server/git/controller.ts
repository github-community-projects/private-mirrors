import simpleGit, { SimpleGitOptions } from 'simple-git'
import { getConfig } from '../../bot/config'
import { getAuthenticatedOctokit } from '../../bot/octokit'
import { generateAuthUrl } from '../../utils/auth'
import { temporaryDirectory } from '../../utils/dir'
import { logger } from '../../utils/logger'
import { SyncReposSchema } from './schema'

const gitApiLogger = logger.getSubLogger({ name: 'git-api' })

// Syncs the fork and mirror repos
export const syncReposHandler = async ({
  input,
}: {
  input: SyncReposSchema
}) => {
  try {
    gitApiLogger.info('Syncing repos', { ...input, accessToken: 'none' })

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
        `user.name=pma[bot]`,
        `user.email=${privateInstallationId}+pma[bot]@users.noreply.github.com`,
        // Disable any global git hooks to prevent potential interference when running the app locally
        'core.hooksPath=/dev/null',
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
    return {
      success: false,
    }
  }
}
