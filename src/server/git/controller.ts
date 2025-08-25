import simpleGit, { SimpleGitOptions } from 'simple-git'
import { generateAuthUrl } from '../../utils/auth'
import { temporaryDirectory } from '../../utils/dir'
import { logger } from '../../utils/logger'
import { SyncReposSchema } from './schema'

const gitApiLogger = logger.getSubLogger({ name: 'git-api' })

// Syncs a branch from one repo to another
export const syncReposHandler = async ({
  input,
}: {
  input: SyncReposSchema // owner, name, branch, accessToken
}) => {
  try {
    gitApiLogger.info(
      'Syncing source repo: ',
      { ...input.source, octokit: {} },
      'to destination repo: ',
      { ...input.destination, octokit: {} },
    )

    const sourceRef = await input.source.octokit.octokit.rest.git.getRef({
      owner: input.source.org,
      repo: input.source.repo,
      ref: `heads/${input.source.branch}`,
    })

    const destinationRef =
      await input.destination.octokit.octokit.rest.git.getRef({
        owner: input.destination.org,
        repo: input.destination.repo,
        ref: `heads/${input.destination.branch}`,
      })

    if (sourceRef.data.object.sha === destinationRef.data.object.sha) {
      gitApiLogger.debug('Source and destination are already in sync')
      return {
        success: true,
      }
    }

    const sourceRemote = generateAuthUrl(
      input.source.octokit.accessToken,
      input.source.org,
      input.source.repo,
    )

    const destinationRemote = generateAuthUrl(
      input.destination.octokit.accessToken,
      input.destination.org,
      input.destination.repo,
    )

    // First clone the source and destination repos into the same folder
    const tempDir = temporaryDirectory()

    const options: Partial<SimpleGitOptions> = {
      config: [
        `user.name=pma[bot]`,
        `user.email=${input.source.octokit.installationId}+pma[bot]@users.noreply.github.com`,
        // Disable any global git hooks to prevent potential interference when running the app locally
        'core.hooksPath=/dev/null',
      ],
    }

    const git = simpleGit(tempDir, options)
    await git.init()
    await git.addRemote('source', sourceRemote)
    await git.addRemote('destination', destinationRemote)
    await git.fetch(['source'])
    await git.fetch(['destination'])

    // Check if the branch exists on both repos
    const sourceBranches = await git.branch(['--list', 'source/*'])
    const destinationBranches = await git.branch(['--list', 'destination/*'])

    gitApiLogger.debug('branches', {
      sourceBranches: sourceBranches.all,
      destinationBranches: destinationBranches.all,
    })

    // Checkout the source branch so that we can rebase any changes from it on top of the destination branch
    await git.checkoutBranch(
      input.source.branch,
      `source/${input.source.branch}`,
    )

    gitApiLogger.debug('Checked out branch', input.source.branch)

    // Rebase to fast forward the new source commits on top of the destination branch in case they differ
    await git.rebase([`destination/${input.destination.branch}`]) // may need to add more complex handling in the future for failed rebases

    gitApiLogger.debug(
      `Rebased source branch: ${input.source.branch} onto destination branch: ${input.destination.branch}`,
    )

    await git.push('destination', input.destination.branch, ['--force'])

    gitApiLogger.debug(
      `Pushed to ${input.destination.org}/${input.destination.repo}/${input.destination.branch}`,
    )

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
