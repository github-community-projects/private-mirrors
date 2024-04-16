import { Context, Probot } from 'probot'
import { trpcServer } from '../server/trpc'
import { logger } from '../utils/logger'
import {
  branchProtectionRulesetGQL,
  getBranchProtectionRulesetGQL,
} from './graphql'
import { Repository } from '@octokit/graphql-schema'

type CustomProperties = Record<string, string>

const botLogger = logger.getSubLogger({ name: 'bot' })

// Helper function to get the fork name from the repository custom properties
export const getForkName = async (props: CustomProperties) => {
  return props.fork ?? null
}

// Helper function to create branch protection rulesets
export const createBranchProtectionRuleset = async (
  context: Context<'repository.created' | 'repository.edited' | 'push'>,
  bypassActorId: string,
  ruleName: string,
  includeRefs: string[],
) => {
  // Get the current branch protection rulesets
  const getBranchProtectionRuleset = await context.octokit.graphql<{
    repository: Repository
  }>(getBranchProtectionRulesetGQL, {
    owner: context.payload.repository.owner.login,
    name: context.payload.repository.name,
  })

  if (
    getBranchProtectionRuleset.repository.rulesets?.nodes?.find(
      (ruleset) => ruleset?.name === 'default-branch-protection-icf',
    )
  ) {
    botLogger.info('Branch protection rule already exists', {
      getBranchProtectionRuleset,
    })

    return
  }

  // Create the branch protection ruleset
  const branchProtectionRuleset = await context.octokit.graphql(
    branchProtectionRulesetGQL,
    {
      repositoryId: context.payload.repository.node_id,
      ruleName,
      bypassActorId,
      includeRefs,
    },
  )

  botLogger.info('Created branch protection rule', {
    branchProtectionRuleset,
  })
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
      botLogger.debug('Creating branch protection rule for fork', {
        repositoryOwner: context.payload.repository.owner.login,
        repositoryName: context.payload.repository.name,
      })

      // Add branch protection via rulesets to the all branches
      await createBranchProtectionRuleset(
        context,
        authenticatedApp.data.node_id,
        'default-branch-protection-icf',
        ['~ALL'],
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

    // Skip if not a mirror
    if (!forkNameWithOwner) {
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

    // Add branch protections via ruleset to the default branch
    await createBranchProtectionRuleset(
      context,
      authenticatedApp.data.node_id,
      'default-branch-protection-icf',
      ['~DEFAULT_BRANCH'],
    )
  })

  /**
   * We listen for repository edited events in case someone plays with branch protections
   */
  app.on('repository.edited', async (context) => {
    // If the repository is a private repository, add branch protections to the default branch
    // Check repo properties to see if this is a mirror
    const forkNameWithOwner = await getForkName(
      (context.payload.repository as any).custom_properties as CustomProperties,
    )

    const authenticatedApp = await context.octokit.apps.getAuthenticated()

    // Skip if not a mirror
    if (!forkNameWithOwner) {
      botLogger.info('Not a mirror repo, skipping')
      return
    }

    // Get the default branch
    const defaultBranch = context.payload.repository.default_branch

    botLogger.debug('Adding branch protections to default branch', {
      defaultBranch,
    })

    // Add branch protections via ruleset to the default branch
    await createBranchProtectionRuleset(
      context,
      authenticatedApp.data.node_id,
      'default-branch-protection-icf',
      ['~DEFAULT_BRANCH'],
    )
  })

  app.on('push', async (context) => {
    botLogger.info('Push event')

    // Check repo properties to see if this is a mirror
    const forkNameWithOwner = await getForkName(
      (context.payload.repository as any).custom_properties as CustomProperties,
    )

    const authenticatedApp = await context.octokit.apps.getAuthenticated()

    // Skip if not a mirror
    if (!forkNameWithOwner) {
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

    const forkRepoNwo = forkNameWithOwner
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

      // Add branch protections via ruleset to the default branch
      await createBranchProtectionRuleset(
        context,
        authenticatedApp.data.node_id,
        'default-branch-protection-icf',
        ['~DEFAULT_BRANCH'],
      )
    } catch (error) {
      botLogger.error('Failed to add branch protections', { error })
    }
  })
}

export default bot
