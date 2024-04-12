// This holds the elevated git permissions needed to run the git commands
import { getConfig } from 'bot/config'
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
 * Fetches octokit installations for both the contribution org and the private org
 * @param contributionOrgId Id of the contribution org
 * @param privateOrgId Id of the private org
 * @returns octokit instances for both the contribution and private orgs
 */
const getAuthenticatedOctokit = async (
  contributionOrgId: string,
  privateOrgId: string,
) => {
  gitLogger.info('Fetching app installations')
  const contributionInstallationId =
    await appOctokit().rest.apps.getOrgInstallation({
      org: contributionOrgId,
    })

  const contributionAccessToken = await generateAppAccessToken(
    String(contributionInstallationId.data.id),
  )
  const contributionOctokit = installationOctokit(
    String(contributionInstallationId.data.id),
  )

  const privateInstallationId = await appOctokit().rest.apps.getOrgInstallation(
    {
      org: privateOrgId,
    },
  )

  const privateAccessToken = await generateAppAccessToken(
    String(privateInstallationId.data.id),
  )
  const privateOctokit = installationOctokit(
    String(privateInstallationId.data.id),
  )

  return {
    contribution: {
      accessToken: contributionAccessToken,
      octokit: contributionOctokit,
      installationId: String(contributionInstallationId.data.id),
    },
    private: {
      accessToken: privateAccessToken,
      octokit: privateOctokit,
      installationId: String(privateInstallationId.data.id),
    },
  }
}

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
  syncRepos: procedure
    .input(
      z.object({
        orgId: z.string(),
        destinationTo: z.enum(['mirror', 'fork']),
        forkOwner: z.string(),
        forkName: z.string(),
        mirrorName: z.string(),
        mirrorOwner: z.string(),
        mirrorBranchName: z.string(),
        forkBranchName: z.string(),
      }),
    )
    .mutation(async (opts) => {
      gitLogger.info('syncRepos', { input: opts.input })

      const config = await getConfig(opts.input.orgId)

      gitLogger.debug('Fetched config', config)

      const { publicOrg, privateOrg } = config

      const octokitData = await getAuthenticatedOctokit(publicOrg, privateOrg)
      const contributionOctokit = octokitData.contribution.octokit
      const contributionAccessToken = octokitData.contribution.accessToken

      const privateOctokit = octokitData.private.octokit
      const privateInstallationId = octokitData.private.installationId
      const privateAccessToken = octokitData.private.accessToken

      const forkRepo = await contributionOctokit.rest.repos.get({
        owner: opts.input.forkOwner,
        repo: opts.input.forkName,
      })

      const mirrorRepo = await privateOctokit.rest.repos.get({
        owner: opts.input.mirrorOwner,
        repo: opts.input.mirrorName,
      })

      gitLogger.debug('Fetched both fork and mirror repos')

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

      const config = await getConfig(opts.input.orgId)

      gitLogger.debug('Fetched config', config)

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
        const forkData = await contributionOctokit.rest.repos.get({
          owner: opts.input.forkRepoOwner,
          repo: opts.input.forkRepoName,
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
          opts.input.forkRepoOwner,
          opts.input.forkRepoName,
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
          name: opts.input.newRepoName,
          org: privateOrg,
          private: true,
          description: `Mirror of ${opts.input.forkRepoOwner}/${opts.input.forkRepoName}`,
          custom_properties: {
            fork: `${opts.input.forkRepoOwner}/${opts.input.forkRepoName}`,
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
        await git.checkoutBranch(opts.input.newBranchName, defaultBranch)
        await git.push('origin', opts.input.newBranchName)

        return {
          success: true,
          data: newRepo.data,
        }
      } catch (e) {
        // Clean up the repo made
        await privateOctokit.rest.repos.delete({
          owner: orgData.data.login,
          repo: opts.input.newRepoName,
        })

        logger.error({ error: e })

        throw e
      }
    }),
})
