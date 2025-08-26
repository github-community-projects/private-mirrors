import { Probot } from 'probot'
import { logger } from '../utils/logger'
import { syncReposHandler } from '../server/git/controller'
import {
  appOctokit,
  generateAppAccessToken,
  getAuthenticatedOctokit,
} from './octokit'
import { createAllPushProtection, createDefaultBranchProtection } from './rules'
import { getConfig } from './config'
import { PushEvent } from '@octokit/webhooks-types'
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

// Helper function to get the private access token
export const getPrivateAccessToken = async (orgId: string) => {
  // Need to validate that the bot itself is the one making this request
  const privateInstallationId = await appOctokit().rest.apps.getOrgInstallation(
    {
      org: orgId,
    },
  )

  return await generateAppAccessToken(String(privateInstallationId.data.id))
}

// Helper function to sync changes to mirror default branch back to fork branch
export const syncPushToFork = async (
  payload: PushEvent,
  forkNameWithOwner: string,
  branch: string,
) => {
  const orgId = String(payload.organization!.id)
  const privateAccessToken = await getPrivateAccessToken(orgId)

  const [forkOwner, forkName] = forkNameWithOwner.split('/')
  const mirrorOwner = payload.repository.owner.login
  const mirrorName = payload.repository.name

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
}

// Helper function to sync changes to fork branch back to mirror default branch
export const syncPushToMirror = async (payload: PushEvent) => {
  // Get the branch this was pushed to
  const branch = payload.ref.replace('refs/heads/', '')

  const orgId = String(payload.organization!.id)
  const privateAccessToken = await getPrivateAccessToken(orgId)

  const config = await getConfig(orgId)
  const { publicOrg, privateOrg } = config

  const forkOwner = payload.repository.owner.login
  const forkName = payload.repository.name

  const octokitData = await getAuthenticatedOctokit(publicOrg, privateOrg)
  const privateOctokit = octokitData.private.octokit
  const mirrorRepo = await privateOctokit.rest.repos.get({
    owner: privateOrg,
    repo: branch,
  })
  const mirrorBranchName = mirrorRepo.data.default_branch

  try {
    console.log('syncing to mirror')
    const res = await syncReposHandler({
      input: {
        accessToken: privateAccessToken,
        forkBranchName: branch,
        mirrorBranchName,
        destinationTo: 'mirror',
        forkName,
        forkOwner,
        mirrorName: branch,
        mirrorOwner: privateOrg,
        orgId,
      },
    })
    botLogger.info('Synced repository', { res })
  } catch (error) {
    botLogger.error('Failed to sync repository', { error })
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
    botLogger.info('Context: ', context.payload)

    // Check repo properties to see if this is a mirror
    const forkNameWithOwner = getForkName(
      (
        context.payload.repository as typeof context.payload.repository & {
          custom_properties: CustomProperties
        }
      ).custom_properties,
    )
    const isMirror = !!forkNameWithOwner
    botLogger.info('Fork name with owner: ', forkNameWithOwner)

    const authenticatedApp = await context.octokit.apps.getAuthenticated()
    if (!authenticatedApp?.data) {
      botLogger.error('Failed to get authenticated app')
      return
    }
    const actorNodeId: string = authenticatedApp.data?.node_id

    // Check repo description to see if this is a mirror
    const metadata = getMetadata(context.payload.repository.description)
    botLogger.info('Metadata: ', metadata)

    // Call sync logic for either (1) fork branch change or (2) mirror default change
    if (!isMirror && !metadata.mirror) {
      await syncPushToMirror(context.payload)
    } else {
      // Get the branch this was pushed to
      const branch = context.payload.ref.replace('refs/heads/', '')

      // Skip if not the default branch
      const defaultBranch = context.payload.repository.default_branch
      if (branch !== defaultBranch) {
        botLogger.info('Not the default branch, skipping', {
          branch,
          defaultBranch: defaultBranch,
        })
        return
      }
      await syncPushToFork(context.payload, forkNameWithOwner, branch)

      if (process.env.SKIP_BRANCH_PROTECTION_CREATION) return

      try {
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
    }
  })
}

export default bot
