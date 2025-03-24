import { Probot } from 'probot'
import { logger } from '../utils/logger'
import { syncReposHandler } from '../server/git/controller'
import { appOctokit, generateAppAccessToken } from './octokit'
import { createAllPushProtection, createDefaultBranchProtection } from './rules'

import '../utils/proxy'

type CustomProperties = Record<string, string>

const botLogger = logger.getSubLogger({ name: 'bot' })

// Helper function to get the fork name from the repository custom properties
export const getForkName = (props: CustomProperties) => {
  return props.fork ?? null
}

// Helper function to get the metadata from the repository description
export const getMetadata = (
  description: string | null,
): Record<string, string> => {
  botLogger.debug('Getting metadata from repository description', {
    description,
  })

  if (!description) {
    return {}
  }

  try {
    return JSON.parse(description) as Record<string, string>
  } catch {
    botLogger.warn('Failed to parse repository description', { description })
    return {}
  }
}

function bot(app: Probot) {
  // Catch-all to log all webhook events
  app.onAny((context) => {
    botLogger.debug('Received webhook event `onAny`', { event: context.name })
  })

  // Good for debugging :)
  app.on('ping', () => {
    botLogger.debug('pong')
  })

  app.on('repository.created', async (context) => {
    botLogger.info('Repository created', {
      isFork: context.payload.repository.fork,
      repositoryOwner: context.payload.repository.owner.login,
      repositoryName: context.payload.repository.name,
    })

    const authenticatedApp = await context.octokit.apps.getAuthenticated()
    if (!authenticatedApp?.data) {
      botLogger.error('Failed to get authenticated app')
      return
    }
    const actorNodeId = authenticatedApp.data.node_id

    // Create branch protection rules on forks
    // if the repository is a fork, change branch protection rules to only allow the bot to push to it
    if (context.payload.repository.fork) {
      await createAllPushProtection(
        context,
        context.payload.repository.node_id,
        actorNodeId,
      )
    }

    // Check repo properties to see if this is a mirror
    const forkNameWithOwner = getForkName(
      (
        context.payload.repository as typeof context.payload.repository & {
          custom_properties: CustomProperties
        }
      ).custom_properties,
    )

    // Check repo description to see if this is a mirror
    const metadata = getMetadata(context.payload.repository.description)

    // Skip if not a mirror
    if (!forkNameWithOwner && !metadata.mirror) {
      botLogger.info('Not a mirror repo, skipping', {
        repositoryOwner: context.payload.repository.owner.login,
        repositoryName: context.payload.repository.name,
      })
      return
    }

    if (process.env.SKIP_BRANCH_PROTECTION_CREATION) return

    try {
      // Get the default branch
      const defaultBranch = context.payload.repository.default_branch

      botLogger.debug('Adding branch protections to default branch', {
        defaultBranch,
        repositoryOwner: context.payload.repository.owner.login,
        repositoryName: context.payload.repository.name,
      })

      await createDefaultBranchProtection(
        context,
        context.payload.repository.node_id,
        actorNodeId,
        defaultBranch,
      )
    } catch (error) {
      botLogger.error('Failed to add branch protections', {
        error,
      })
    }
  })

  // We listen for repository edited events in case someone plays with branch protections
  app.on('repository.edited', async (context) => {
    const authenticatedApp = await context.octokit.apps.getAuthenticated()
    if (!authenticatedApp?.data) {
      botLogger.error('Failed to get authenticated app')
      return
    }
    const actorNodeId: string = authenticatedApp.data?.node_id

    if (context.payload.repository.fork) {
      await createAllPushProtection(
        context,
        context.payload.repository.node_id,
        actorNodeId,
      )
    }

    // Check repo properties to see if this is a mirror
    const forkNameWithOwner = getForkName(
      (
        context.payload.repository as typeof context.payload.repository & {
          custom_properties: CustomProperties
        }
      ).custom_properties,
    )

    // Check repo description to see if this is a mirror
    const metadata = getMetadata(context.payload.repository.description)

    // Skip if not a mirror
    if (!forkNameWithOwner && !metadata.mirror) {
      botLogger.info('Not a mirror repo, skipping')
      return
    }

    if (process.env.SKIP_BRANCH_PROTECTION_CREATION) return

    try {
      // Get the default branch
      const defaultBranch = context.payload.repository.default_branch

      botLogger.debug('Adding branch protections to default branch', {
        defaultBranch,
      })

      await createDefaultBranchProtection(
        context,
        context.payload.repository.node_id,
        actorNodeId,
        defaultBranch,
      )
    } catch (error) {
      botLogger.error('Failed to add branch protections', {
        error,
      })
    }
  })

  app.on('push', async (context) => {
    botLogger.info('Push event')

    // Check repo properties to see if this is a mirror
    const forkNameWithOwner = getForkName(
      (
        context.payload.repository as typeof context.payload.repository & {
          custom_properties: CustomProperties
        }
      ).custom_properties,
    )

    const authenticatedApp = await context.octokit.apps.getAuthenticated()
    if (!authenticatedApp?.data) {
      botLogger.error('Failed to get authenticated app')
      return
    }
    const actorNodeId: string = authenticatedApp.data?.node_id

    // Check repo description to see if this is a mirror
    const metadata = getMetadata(context.payload.repository.description)

    // Skip if not a mirror
    if (!forkNameWithOwner && !metadata.mirror) {
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

    const [forkOwner, forkName] = forkNameWithOwner.split('/')
    const mirrorOwner = context.payload.repository.owner.login
    const mirrorName = context.payload.repository.name
    const orgId = String(context.payload.organization!.id)

    // Need to validate that the bot itself is the one making this request
    const privateInstallationId =
      await appOctokit().rest.apps.getOrgInstallation({
        org: orgId,
      })

    const privateAccessToken = await generateAppAccessToken(
      String(privateInstallationId.data.id),
    )

    try {
      const res = await syncReposHandler({
        input: {
          accessToken: privateAccessToken,
          forkBranchName: mirrorName,
          mirrorBranchName: branch,
          destinationTo: 'fork',
          forkName,
          forkOwner,
          mirrorName,
          mirrorOwner,
          orgId,
        },
      })
      botLogger.info('Synced repository', { res })
    } catch (error) {
      botLogger.error('Failed to sync repository', { error })
    }

    if (process.env.SKIP_BRANCH_PROTECTION_CREATION) return

    try {
      // Get the default branch
      const defaultBranch = context.payload.repository.default_branch

      botLogger.debug(
        'Adding branch protections to default branch in case repo.edited did not fire',
        {
          defaultBranch,
        },
      )

      await createDefaultBranchProtection(
        context,
        context.payload.repository.node_id,
        actorNodeId,
        defaultBranch,
      )
    } catch (error) {
      botLogger.error('Failed to add branch protections', { error })
    }
  })
}

export default bot
