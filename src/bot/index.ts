import { Probot } from 'probot'
import { trpc } from '../utils/trpc'
import { logger } from '../utils/logger'
import { appOctokit, generateAppAccessToken } from './octokit'
import { createAllPushProtection, createDefaultBranchProtection } from './rules'

type CustomProperties = Record<string, string>

const botLogger = logger.getSubLogger({ name: 'bot' })

// Helper function to get the fork name from the repository custom properties
export const getForkName = async (props: CustomProperties) => {
  return props.fork ?? null
}

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
    botLogger.warn('Failed to parse repository description', { description })
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

    const authenticatedApp = await context.octokit.apps.getAuthenticated()

    // Create branch protection rules on forks
    // if the repository is a fork, change branch protection rules to only allow the bot to push to it
    if (context.payload.repository.fork) {
      await createAllPushProtection(
        context,
        context.payload.repository.node_id,
        authenticatedApp.data.node_id,
      )
    }

    // Check repo properties to see if this is a mirror
    const forkNameWithOwner = await getForkName(
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
        authenticatedApp.data.node_id,
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

    if (context.payload.repository.fork) {
      await createAllPushProtection(
        context,
        context.payload.repository.node_id,
        authenticatedApp.data.node_id,
      )
    }

    // Check repo properties to see if this is a mirror
    const forkNameWithOwner = await getForkName(
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

    try {
      // Get the default branch
      const defaultBranch = context.payload.repository.default_branch

      botLogger.debug('Adding branch protections to default branch', {
        defaultBranch,
      })

      await createDefaultBranchProtection(
        context,
        context.payload.repository.node_id,
        authenticatedApp.data.node_id,
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
    const forkNameWithOwner = await getForkName(
      (
        context.payload.repository as typeof context.payload.repository & {
          custom_properties: CustomProperties
        }
      ).custom_properties,
    )

    const authenticatedApp = await context.octokit.apps.getAuthenticated()

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

    const { mutate } = trpc.syncRepos.useMutation({
      onSuccess: (res) => {
        botLogger.info('Synced repos on default branch push', res)
      },
      onError: (error) => {
        botLogger.error('Failed to sync repos on default branch push', error)
      },
    })

    mutate({
      accessToken: privateAccessToken,
      forkBranchName: mirrorName,
      mirrorBranchName: branch,
      destinationTo: 'fork',
      forkName,
      forkOwner,
      mirrorName,
      mirrorOwner,
      orgId,
    })

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
        authenticatedApp.data.node_id,
        defaultBranch,
      )
    } catch (error) {
      botLogger.error('Failed to add branch protections', { error })
    }
  })
}

export default bot
