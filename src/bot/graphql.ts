export const getBranchProtectionRulesetGQL = `
query(
  $owner: String!
  $name: String!
) {
  repository(owner: $owner, name: $name) {
    rulesets(first: 50) {
      nodes {
        name
      }
    }
  }
}
`

export const forkBranchProtectionRulesetGQL = `
mutation CreateRepositoryRuleset(
  $repositoryId: ID!
  $ruleName: String!
  $bypassActorId: ID!
  $includeRefs: [String!]!
) {
  createRepositoryRuleset(
    input: {
      sourceId: $repositoryId
      name: $ruleName
      target: BRANCH
      conditions: {
        refName: {
          include: $includeRefs
          exclude: []
        }
      }
      rules: [
        {
          type: CREATION
        },
        {
          type: UPDATE
          parameters:{
            update:{
              updateAllowsFetchAndMerge: true
            }
          }
        },
        {
          type: DELETION
        }
      ]
      enforcement: ACTIVE
      bypassActors: {
        actorId:  $bypassActorId
        bypassMode: ALWAYS
      }
    }
  ) {
    ruleset {
      id
    }
  }
}
`

export const mirrorBranchProtectionRulesetGQL = `
mutation CreateRepositoryRuleset(
  $repositoryId: ID!
  $ruleName: String!
  $bypassActorId: ID!
  $includeRefs: [String!]!
) {
  createRepositoryRuleset(
    input: {
      sourceId: $repositoryId
      name: $ruleName
      target: BRANCH
      conditions: {
        refName: {
          include: $includeRefs
          exclude: []
        }
      }
      rules: [
        {
          type: PULL_REQUEST
          parameters: {
            pullRequest: {
              dismissStaleReviewsOnPush: true
              requireCodeOwnerReview: false
              requireLastPushApproval: false
              requiredApprovingReviewCount: 1
              requiredReviewThreadResolution: true
            }
          }
        }
      ]
      enforcement: ACTIVE
      bypassActors: {
        actorId:  $bypassActorId
        bypassMode: ALWAYS
      }
    }
  ) {
    ruleset {
      id
    }
  }
}
`

export const forkBranchProtectionGQL = `
mutation AddBranchProtection(
  $repositoryId: ID!
  $actorId: ID!
  $pattern: String!
) {
  createBranchProtectionRule(
    input: {
      repositoryId: $repositoryId
      isAdminEnforced: true
      pushActorIds: [$actorId]
      pattern: $pattern
      restrictsPushes: true
      blocksCreations: true
    }
  ) {
    branchProtectionRule {
      id
    }
  }
}
`

export const mirrorBranchProtectionGQL = `
mutation AddBranchProtection(
  $repositoryId: ID!
  $actorId: ID!
  $pattern: String!
) {
  createBranchProtectionRule(
    input: {
      repositoryId: $repositoryId
      requiresApprovingReviews:true
      requiredApprovingReviewCount: 1
      pattern: $pattern
      dismissesStaleReviews:true
      pushActorIds: [$actorId]
    }
  ) {
    branchProtectionRule {
      id
    }
  }
}
`

export const getRepoLanguagesGQL = `
query(
  $owner: String!
  $name: String!
) {
  repository(owner: $owner, name: $name) {
    languages(first: 2) {
      nodes {
        color
        name
      }
    }
  }
}
`

export const getReposInOrgGQL = `
query(
  $login: String!
  $isFork: Boolean
) {
  organization(login: $login) {
    repositories(first: 50, isFork: $isFork) {
      totalCount
      nodes {
        databaseId
        name
        isPrivate
        updatedAt
        owner {
          login
          avatarUrl
        }
        parent {
          name
          owner {
            login
            avatarUrl
          }
        }
        languages(first: 4) {
          nodes {
            color
            name
          }
        }
        refs(refPrefix: "refs/") {
          totalCount
        }
      }
    }
  }
}
`
