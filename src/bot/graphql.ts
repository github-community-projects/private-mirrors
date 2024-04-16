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

export const branchProtectionRulesetGQL = `
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
