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

const rulesLogger = logger.child({ name: 'bot' })

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
  rulesLogger.debug('Creating branch protection ruleset for fork', {
    repositoryOwner: context.payload.repository.owner.login,
    repositoryName: context.payload.repository.name,
  })

  try {
    // Add branch protection via rulesets to the all branches
    await createBranchProtectionRuleset(
      context,
      actorNodeId,
      'all-branch-protections-icf',
      ['~ALL'],
    )
  } catch (error) {
    rulesLogger.error(
      new Error(
        'Failed to create branch protection ruleset for fork, falling back to branch protections',
      ),
    )

    try {
      const createBranchProtectionRes = await createBranchProtection(
        context,
        repositoryNodeId,
        '*',
        actorNodeId,
      )

      rulesLogger.info('Branch protection created', {
        response: JSON.parse(JSON.stringify(createBranchProtectionRes)),
      })
    } catch (error) {
      rulesLogger.error(new Error('Failed to create branch protection'))
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
  rulesLogger.debug('Creating branch protection ruleset for mirror', {
    repositoryOwner: context.payload.repository.owner.login,
    repositoryName: context.payload.repository.name,
  })

  try {
    // Add branch protections via ruleset to the default branch
    await createBranchProtectionRuleset(
      context,
      actorNodeId,
      'default-branch-protection-icf',
      ['~DEFAULT_BRANCH'],
      true,
    )
  } catch (error) {
    rulesLogger.error(
      new Error(
        'Failed to add branch protection ruleset to default branch, trying BP GQL instead',
      ),
    )

    try {
      const createBranchProtectionRes = await createBranchProtection(
        context,
        repositoryNodeId,
        defaultBranch,
        actorNodeId,
        true,
      )

      rulesLogger.info('Branch protection created', {
        response: JSON.parse(JSON.stringify(createBranchProtectionRes)),
      })
    } catch (error) {
      rulesLogger.error(
        new Error(
          'Failed to create branch protection from BP GQL, trying REST instead',
        ),
      )

      try {
        const createBranchProtectionRes = await createBranchProtectionREST(
          context,
          defaultBranch,
        )

        rulesLogger.info('Branch protection created', {
          response: JSON.parse(JSON.stringify(createBranchProtectionRes)),
        })
      } catch (error) {
        rulesLogger.error(new Error('Failed to create branch protection'))
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
    rulesLogger.info('Branch protection rule already exists', {
      response: JSON.parse(JSON.stringify(getBranchProtectionRuleset)),
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

  rulesLogger.info('Created branch protection rule', {
    response: JSON.parse(JSON.stringify(branchProtectionRuleset)),
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
  rulesLogger.info('Creating branch protection', {
    isMirror,
  })

  const query = isMirror ? mirrorBranchProtectionGQL : forkBranchProtectionGQL

  const forkBranchProtection = await context.octokit.graphql(query, {
    repositoryId: repositoryNodeId,
    pattern,
    actorId,
  })

  rulesLogger.info('Created branch protection', {
    response: JSON.parse(JSON.stringify(forkBranchProtection)),
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

  rulesLogger.info('Created branch protection rule to default branch', {
    response: JSON.parse(JSON.stringify(res)),
    repositoryOwner: context.payload.repository.owner.login,
    repositoryName: context.payload.repository.name,
  })
}
