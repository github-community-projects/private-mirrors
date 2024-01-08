import { Probot } from 'probot'
import { trpcServer } from '../server/trpc'
import { logger } from '../utils/logger'
import { branchProtectionGQL } from './graphql'

const botLogger = logger.getSubLogger({ name: 'bot' })

// Helper function to get the metadata from the repository description
export const getMetadata = (description: string | null) => {
  botLogger.debug('Getting metadata from repository description', {
    description,
  })

  if (!description) {
    return {}
  }

  try {
    return JSON.parse(description)
  } catch (error) {
    botLogger.error('Failed to parse repository description', { description })
    return {}
  }
}

function bot(app: Probot) {
  // Catch-all to log all webhook events
  app.onAny(async (context) => {
    botLogger.debug('Received webhook event `onAny`', { event: context.name })
  })

  // Good for debugging :)
  app.on('ping', async (_) => {
    botLogger.debug('pong')
  })

  app.on('repository.created', async (context) => {
    botLogger.info('Repository created', {
      isFork: context.payload.repository.fork,
      repositoryOwner: context.payload.repository.owner.login,
      repositoryName: context.payload.repository.name,
    })

    // Create branch protection rules on forks
    // if the repository is a fork, change branch protection rules to only allow the bot to push to it
    if (context.payload.repository.fork) {
      botLogger.debug('Creating branch protection rule for fork', {
        repositoryOwner: context.payload.repository.owner.login,
        repositoryName: context.payload.repository.name,
      })

      const res = await context.octokit.apps.getAuthenticated()

      const branchProtectionRule = await context.octokit.graphql(
        branchProtectionGQL,
        {
          repositoryId: context.payload.repository.node_id,
          pattern: '*',
          actorId: res.data?.node_id,
        },
      )

      botLogger.info('Created branch protection rule', {
        branchProtectionRule,
      })
    }

    // Check if this is a mirror and get the metadata if so
    const metadata = getMetadata(context.payload.repository.description)

    // Skip if not a mirror
    if (!metadata.mirror) {
      botLogger.info('Not a mirror repo, skipping', {
        repositoryOwner: context.payload.repository.owner.login,
        repositoryName: context.payload.repository.name,
      })
      return
    }

    // Get the default branch
    const defaultBranch = context.payload.repository.default_branch

    botLogger.debug('Adding branch protections to default branch', {
      defaultBranch,
      repositoryOwner: context.payload.repository.owner.login,
      repositoryName: context.payload.repository.name,
    })

    // Add branch protections to the default branch
    const res = await context.octokit.repos.updateBranchProtection({
      branch: defaultBranch,
      enforce_admins: true,
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      required_pull_request_reviews: {
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false,
        required_approving_review_count: 1,
        dismissal_restrictions: {
          users: [],
          teams: [],
        },
      },
      required_status_checks: null,
      restrictions: null,
    })

    botLogger.info('Created branch protection rule to default branch', {
      res,
      repositoryOwner: context.payload.repository.owner.login,
      repositoryName: context.payload.repository.name,
    })
  })

  /**
   * We listen for repository edited events in case someone plays with branch protections
   */
  app.on('repository.edited', async (context) => {
    // If the repository is a private repository, add branch protections to the default branch
    // Check if this is a mirror and get the metadata if so
    const metadata = getMetadata(context.payload.repository.description)

    // Skip if not a mirror
    if (!metadata.mirror) {
      botLogger.info('Not a mirror repo, skipping')
      return
    }

    // Get the default branch
    const defaultBranch = context.payload.repository.default_branch

    botLogger.debug('Adding branch protections to default branch', {
      defaultBranch,
    })

    // Add branch protections to the default branch
    const res = await context.octokit.repos.updateBranchProtection({
      branch: defaultBranch,
      enforce_admins: true,
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      required_pull_request_reviews: {
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false,
        required_approving_review_count: 1,
        dismissal_restrictions: {
          users: [],
          teams: [],
        },
      },
      required_status_checks: null,
      restrictions: null,
    })

    botLogger.info(res)
  })

  app.on('push', async (context) => {
    botLogger.info('Push event')

    // Check if this is a mirror and get the metadata if so
    const metadata = getMetadata(context.payload.repository.description)

    // Skip if not a mirror
    if (!metadata.mirror) {
      botLogger.info('Not a mirror repo, skipping')
      return
    }

    // Ignore if it was the bot
    if (context.payload.sender.name === 'ospo-repo-sync-test[bot]') {
      botLogger.info('Push was from bot, skipping')
      return
    }

    // Get the branch this was pushed to
    const branch = context.payload.ref.replace('refs/heads/', '')

    // Skip if not the default branch
    if (branch !== context.payload.repository.default_branch) {
      botLogger.info('Not the default branch, skipping', {
        branch,
        defaultBranch: context.payload.repository.default_branch,
      })
      return
    }

    const forkRepoNwo = metadata.mirror
    const [forkOwner, forkName] = forkRepoNwo.split('/')
    const mirrorOwner = context.payload.repository.owner.login
    const mirrorName = context.payload.repository.name
    const orgId = String(context.payload.organization!.id)

    const res = await trpcServer.git.syncRepos.mutate({
      forkBranchName: mirrorName,
      mirrorBranchName: branch,
      destinationTo: 'fork',
      forkName,
      forkOwner,
      mirrorName,
      mirrorOwner,
      orgId,
    })

    botLogger.info('Synced repos on default branch push', { res })

    try {
      // Get the default branch
      const defaultBranch = context.payload.repository.default_branch

      botLogger.debug(
        'Adding branch protections to default branch in case repo.edited did not fire',
        {
          defaultBranch,
        },
      )

      // Add branch protections to the default branch
      const res = await context.octokit.repos.updateBranchProtection({
        branch: defaultBranch,
        enforce_admins: true,
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        required_pull_request_reviews: {
          dismiss_stale_reviews: true,
          require_code_owner_reviews: false,
          required_approving_review_count: 1,
          dismissal_restrictions: {
            users: [],
            teams: [],
          },
        },
        required_status_checks: null,
        restrictions: null,
      })

      botLogger.info(res)
    } catch (error) {
      botLogger.error('Failed to add branch protections', { error })
    }
  })
}

export default bot
