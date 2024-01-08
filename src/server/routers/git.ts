// This holds the elevated git permissions needed to run the git commands
import simpleGit, { SimpleGitOptions } from 'simple-git'
import * as tempy from 'tempy'
import { z } from 'zod'
import {
  appOctokit,
  generateAppAccessToken,
  installationOctokit,
} from '../../bot/octokit'
import { logger } from '../../utils/logger'
import { procedure, router } from '../trpc'

/**
 * Generates a git url with the access token in it
 * @param accessToken Access token for the app
 * @param owner Repo Owner
 * @param repo Repo Name
 * @returns
 */
const generateAuthUrl = (accessToken: string, owner: string, repo: string) => {
  const USER = 'x-access-token'
  const PASS = accessToken
  const REPO = `github.com/${owner}/${repo}`
  return `https://${USER}:${PASS}@${REPO}`
}

// FIXME: Had to downgrade tempy to not use esm
const temporaryDirectory = () => tempy.directory()

const gitLogger = logger.getSubLogger({ name: 'git' })

export const gitRouter = router({
  // Queries

  // Mutations
  getDiff: procedure
    .input(
      z.object({
        forkOwner: z.string(),
        forkName: z.string(),
        mirrorName: z.string(),
        mirrorOwner: z.string(),
        branchName: z.string(),
        orgId: z.string(),
      }),
    )
    .mutation(async (opts) => {
      gitLogger.info('getDiff', { input: opts.input })
      const installationId = await appOctokit().apps.getOrgInstallation({
        org: opts.input.orgId,
      })

      const octokit = installationOctokit(String(installationId.data.id))

      const forkRepo = await octokit.repos.get({
        owner: opts.input.forkOwner,
        repo: opts.input.forkName,
      })

      const mirrorRepo = await octokit.repos.get({
        owner: opts.input.mirrorOwner,
        repo: opts.input.mirrorName,
      })

      gitLogger.debug('Fetched both fork and mirror repos')

      // First clone the fork and mirror repos into the same folder
      const workingDir = temporaryDirectory()
      const git = simpleGit(workingDir)
      await git.init()
      await git.addRemote('fork', forkRepo.data.clone_url)
      await git.addRemote('mirror', mirrorRepo.data.clone_url)
      await git.fetch(['fork'])
      await git.fetch(['mirror'])
      const remotes = await git.remote(['-v'])

      gitLogger.debug('Remotes', remotes)

      const diffSummary = await git.diffSummary([
        '--stat',
        `fork/${opts.input.branchName}`,
        `mirror/${opts.input.branchName}`,
      ])

      const diff = await git.diff([
        `fork/${opts.input.branchName}`,
        `mirror/${opts.input.branchName}`,
      ])

      return {
        success: true,
        data: { diffSummary, diff },
      }
    }),

  syncRepos: procedure
    .input(
      z.object({
        destinationTo: z.enum(['mirror', 'fork']),
        forkOwner: z.string(),
        forkName: z.string(),
        mirrorName: z.string(),
        mirrorOwner: z.string(),
        orgId: z.string(),
        mirrorBranchName: z.string(),
        forkBranchName: z.string(),
      }),
    )
    .mutation(async (opts) => {
      gitLogger.info('syncRepos', { input: opts.input })
      const installationId = await appOctokit().apps.getOrgInstallation({
        org: opts.input.orgId,
      })

      const octokit = installationOctokit(String(installationId.data.id))

      const accessToken = await generateAppAccessToken(
        String(installationId.data.id),
      )

      const forkRepo = await octokit.repos.get({
        owner: opts.input.forkOwner,
        repo: opts.input.forkName,
      })

      const mirrorRepo = await octokit.repos.get({
        owner: opts.input.mirrorOwner,
        repo: opts.input.mirrorName,
      })

      gitLogger.debug('Fetched both fork and mirror repos')

      const forkRemote = generateAuthUrl(
        accessToken,
        forkRepo.data.owner.login,
        forkRepo.data.name,
      )
      const mirrorRemote = generateAuthUrl(
        accessToken,
        mirrorRepo.data.owner.login,
        mirrorRepo.data.name,
      )

      // First clone the fork and mirror repos into the same folder
      const tempDir = temporaryDirectory()

      const options: Partial<SimpleGitOptions> = {
        config: [
          `user.name=repo-sync[bot]`,
          `user.email=${installationId.data.id}+repo-sync[bot]@users.noreply.github.com`,
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

      gitLogger.debug('branches', {
        forkBranches: forkBranches.all,
        mirrorBranches: mirrorBranches.all,
      })

      if (opts.input.destinationTo === 'fork') {
        await git.checkoutBranch(
          opts.input.forkBranchName,
          `fork/${opts.input.forkBranchName}`,
        )
        gitLogger.debug('Checked out branch', opts.input.forkBranchName)
        await git.mergeFromTo(
          `mirror/${opts.input.mirrorBranchName}`,
          opts.input.forkBranchName,
        )
        gitLogger.debug('Merged branches')
        gitLogger.debug('git status', await git.status())
        await git.push('fork', opts.input.forkBranchName)
      } else {
        await git.checkoutBranch(
          opts.input.mirrorBranchName,
          `mirror/${opts.input.mirrorBranchName}`,
        )
        gitLogger.debug('Checked out branch', opts.input.mirrorBranchName)
        await git.mergeFromTo(
          `fork/${opts.input.forkBranchName}`,
          opts.input.mirrorBranchName,
        )
        gitLogger.debug('Merged branches')
        gitLogger.debug('git status', await git.status())
        await git.push('mirror', opts.input.mirrorBranchName)
      }

      return {
        success: true,
      }
    }),

  createMirror: procedure
    .input(
      z.object({
        orgId: z.string(),
        forkRepoOwner: z.string(),
        forkRepoName: z.string(),
        forkId: z.string(),
        newRepoName: z.string(),
        newBranchName: z.string(),
      }),
    )
    .mutation(async (opts) => {
      gitLogger.info('createMirror', { input: opts.input })
      const installationId = await appOctokit().apps.getOrgInstallation({
        org: opts.input.orgId,
      })

      const accessToken = await generateAppAccessToken(
        String(installationId.data.id),
      )
      const octokit = installationOctokit(String(installationId.data.id))

      const orgData = await octokit.orgs.get({
        org: opts.input.orgId,
      })

      try {
        const exists = await octokit.repos.get({
          owner: orgData.data.login,
          repo: opts.input.newRepoName,
        })
        if (exists.status === 200) {
          gitLogger.info(
            `Repo ${orgData.data.login}/${opts.input.newRepoName} already exists`,
          )
          throw new Error(
            `Repo ${orgData.data.login}/${opts.input.newRepoName} already exists`,
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
        const forkData = await octokit.repos.get({
          owner: opts.input.forkRepoOwner,
          repo: opts.input.forkRepoName,
        })

        // Now create a temporary directory to clone the repo into
        const tempDir = temporaryDirectory()

        const options: Partial<SimpleGitOptions> = {
          config: [
            `user.name=repo-sync[bot]`,
            `user.email=${installationId.data.id}+repo-sync[bot]@users.noreply.github.com`,
          ],
        }
        const git = simpleGit(tempDir, options)
        const remote = generateAuthUrl(
          accessToken,
          opts.input.forkRepoOwner,
          opts.input.forkRepoName,
        )

        await git.clone(remote, tempDir)

        const description = {
          mirror: `${opts.input.forkRepoOwner}/${opts.input.forkRepoName}`,
          branch: opts.input.newBranchName,
        }

        const newRepo = await octokit.repos.createInOrg({
          name: opts.input.newRepoName,
          org: opts.input.orgId,
          private: true,
          description: JSON.stringify(description),
        })

        const defaultBranch = forkData.data.default_branch

        // Add the mirror remote
        const upstreamRemote = generateAuthUrl(
          accessToken,
          newRepo.data.owner.login,
          newRepo.data.name,
        )
        await git.addRemote('upstream', upstreamRemote)
        await git.push('upstream', defaultBranch)

        // Create a new branch on both
        await git.checkoutBranch(opts.input.newBranchName, defaultBranch)
        await git.push('origin', opts.input.newBranchName)

        return {
          success: true,
          data: newRepo.data,
        }
      } catch (e) {
        // Clean up the repo made
        await octokit.repos.delete({
          owner: orgData.data.login,
          repo: opts.input.newRepoName,
        })

        logger.error({ error: e })

        throw e
      }
    }),
})
