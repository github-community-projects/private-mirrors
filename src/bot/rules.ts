import { Repository } from '@octokit/graphql-schema'
import { Context } from 'probot'
import { logger } from '../utils/logger'
import {
  forkBranchProtectionGQL,
  forkBranchProtectionRulesetGQL,
  getBranchProtectionRulesetGQL,
  mirrorBranchProtectionGQL,
  mirrorBranchProtectionRulesetGQL,
} from './graphql'

const rulesLogger = logger.getSubLogger({ name: 'bot' })

type ContextEvent = Context<'repository.created' | 'repository.edited' | 'push'>

/**
 * Creates branch protection for the all branches
 * First tries to create branch protection via rulesets, if that fails, falls back to branch protection
 * @param context The context object
 * @param repositoryNodeId The repository global node ID
 * @param actorNodeId The actor node ID to bypass branch protections
 */
export const createAllPushProtection = async (
  context: ContextEvent,
  repositoryNodeId: string,
  actorNodeId: string,
) => {
  rulesLogger.info('Creating branch protection for all branches', {
    repositoryOwner: context.payload.repository.owner.login,
    repositoryName: context.payload.repository.name,
  })

  try {
    // Add branch protection via rulesets to all branches
    await createBranchProtectionRuleset(
      context,
      actorNodeId,
      'all-branch-protections-icf',
      ['~ALL'],
    )
  } catch (error) {
    rulesLogger.error(
      'Failed to create branch protection via rulesets, falling back to branch protections',
      {
        error,
      },
    )

    try {
      // Add branch protection via GQL to all branches
      await createBranchProtection(context, repositoryNodeId, '*', actorNodeId)
    } catch (error) {
      rulesLogger.error(
        'Failed to create branch protection via GQL, falling back to REST',
        {
          error,
        },
      )

      try {
        // Add branch protection via REST to all branches
        await createBranchProtectionREST(context, '*')
      } catch (error) {
        rulesLogger.error(
          'Failed to create branch protection for all branches',
          {
            error,
          },
        )
      }
    }
  }
}

/**
 * Creates branch protection for the default branch
 * First tries to create branch protection via rulesets, if that fails, falls back to branch protection
 * @param context The context object
 * @param repositoryNodeId The repository global node ID
 * @param actorNodeId The actor node ID to bypass branch protections
 * @param defaultBranch The default branch name
 */
export const createDefaultBranchProtection = async (
  context: ContextEvent,
  repositoryNodeId: string,
  actorNodeId: string,
  defaultBranch: string,
) => {
  rulesLogger.info('Creating branch protection for default branch', {
    repositoryOwner: context.payload.repository.owner.login,
    repositoryName: context.payload.repository.name,
  })

  try {
    // Add branch protection via ruleset to the default branch
    await createBranchProtectionRuleset(
      context,
      actorNodeId,
      'default-branch-protection-icf',
      ['~DEFAULT_BRANCH'],
      true,
    )
  } catch (error) {
    rulesLogger.error(
      'Failed to add branch protections to default branch, trying BP GQL instead',
      {
        error,
      },
    )

    try {
      // Add branch protection via GQL to the default branch
      await createBranchProtection(
        context,
        repositoryNodeId,
        defaultBranch,
        actorNodeId,
        true,
      )
    } catch (error) {
      rulesLogger.error(
        'Failed to create branch protection from BP GQL, trying REST instead',
        {
          error,
        },
      )

      try {
        // Add branch protection via REST to the default branch
        await createBranchProtectionREST(context, defaultBranch)
      } catch (error) {
        rulesLogger.error(
          'Failed to create branch protection for default branch',
          {
            error,
          },
        )
      }
    }
  }
}

/**
 * Creates branch protections rulesets
 * @param context The context object
 * @param bypassActorId The actor node ID to bypass branch protections
 * @param ruleName The name of the branch protection ruleset
 * @param includeRefs The refs to include in the branch protection ruleset
 */
const createBranchProtectionRuleset = async (
  context: ContextEvent,
  bypassActorId: string,
  ruleName: string,
  includeRefs: string[],
  isMirror = false,
) => {
  rulesLogger.info('Creating branch protection via rulesets', {
    isMirror,
  })

  // Get the current branch protection rulesets
  const getBranchProtectionRuleset = await context.octokit.graphql<{
    repository: Repository
  }>(getBranchProtectionRulesetGQL, {
    owner: context.payload.repository.owner.login,
    name: context.payload.repository.name,
  })

  if (
    getBranchProtectionRuleset.repository.rulesets?.nodes?.find(
      (ruleset) => ruleset?.name === ruleName,
    )
  ) {
    rulesLogger.info('Branch protection ruleset already exists', {
      getBranchProtectionRuleset,
    })

    return
  }

  const query = isMirror
    ? mirrorBranchProtectionRulesetGQL
    : forkBranchProtectionRulesetGQL

  // Create the branch protection ruleset
  const branchProtectionRuleset = await context.octokit.graphql(query, {
    repositoryId: context.payload.repository.node_id,
    ruleName,
    bypassActorId,
    includeRefs,
  })

  rulesLogger.info('Created branch protection via rulesets', {
    branchProtectionRuleset,
  })
}

/**
 * Fallback function to create branch protection if ruleset creation fails
 * @param context The context object
 * @param repositoryNodeId The repository global node ID
 * @param pattern The branch pattern
 * @param actorId The bypass actor ID
 */
const createBranchProtection = async (
  context: ContextEvent,
  repositoryNodeId: string,
  pattern: string,
  actorId: string,
  isMirror = false,
) => {
  rulesLogger.info('Creating branch protection via GQL', {
    isMirror,
  })

  const query = isMirror ? mirrorBranchProtectionGQL : forkBranchProtectionGQL

  const forkBranchProtection = await context.octokit.graphql(query, {
    repositoryId: repositoryNodeId,
    pattern,
    actorId,
  })

  rulesLogger.info('Created branch protection via GQL', {
    forkBranchProtection,
  })
}

/**
 * The REST API fallback function to create branch protections in case GQL fails
 * @param context The context object
 * @param pattern The default branch pattern
 */
const createBranchProtectionREST = async (
  context: ContextEvent,
  pattern: string,
) => {
  rulesLogger.info('Creating branch protection via REST')

  const res = await context.octokit.repos.updateBranchProtection({
    branch: pattern,
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

  rulesLogger.info('Created branch protection via REST', {
    res,
    repositoryOwner: context.payload.repository.owner.login,
    repositoryName: context.payload.repository.name,
  })
}
