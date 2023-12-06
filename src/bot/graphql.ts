export const mirrorMainBranchProtectionGQL = `
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
`;

export const branchProtectionGQL = `
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
`;
