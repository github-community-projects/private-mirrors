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

    // Checkout the source branch so that we can perform some checks before attempting to merge into destination branch
    await git.checkoutBranch(
      input.source.branch,
      `source/${input.source.branch}`,
    )
    gitApiLogger.debug('Checked out branch', input.source.branch)

    const syncIsFastForwardable = await git
      .raw([
        'merge-base',
        '--is-ancestor',
        destinationRef.data.object.sha,
        'HEAD',
      ])
      .then(() => true)
      .catch(() => false)
    if (!syncIsFastForwardable) {
      gitApiLogger.debug(
        'Sync Failed: Destination branch has commits not present on source branch. Fast forward not possible.',
      )
      return {
        success: false,
      }
    }

    if (input.removeHeadMergeCommit) {
      const parentShas = await git.show([
        '--no-patch',
        '--format=%p',
        sourceRef.data.object.sha,
      ])
      const parentsList = parentShas.split(' ')
      if (parentsList.length === 1) {
        gitApiLogger.debug('Not a merge commit')
      } else {
        const mergedBranchesCommonAncestor = (
          await git.raw(['merge-base', 'HEAD^1', 'HEAD^2'])
        ).trim()

        if (mergedBranchesCommonAncestor !== destinationRef.data.object.sha) {
          gitApiLogger.debug('Need to keep merge commit')
        } else {
          // NOTE: If the most recent commit after PR merge commit is also a merge commit where parent 1 is the pre-push HEAD commit (non-FF merge), this will also recreate it as a fast-forward
          await git.reset(['--hard', 'HEAD^2'])
          gitApiLogger.info(
            'Reset branch back one commit, removing merge commit from PR',
          )

          // Push this back to the source branch to retrigger the sync
          await git.push(['--force'])

          // Return to end function call
          return {
            success: null,
          }
        }
      }
    }

    // Checkout the destination branch so that we can merge in source branch
    await git.checkoutBranch(
      input.destination.branch,
      `destination/${input.destination.branch}`,
    )
    gitApiLogger.debug('Checked out branch', input.destination.branch)

    // Fast Forward merge the source branch on top of the destination branch
    await git.merge(['--ff-only', input.source.branch]) // shouldn't fail because of check above, but nothing done to handle a failure
    gitApiLogger.debug(
      `Merged source branch: ${input.source.branch} into destination branch: ${input.destination.branch} using fast forward`,
    )

    await git.push(['--force'])

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
