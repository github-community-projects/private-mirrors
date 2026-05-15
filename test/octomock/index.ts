// This is taken from https://github.com/Chocrates/octomock
/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi, type Mock } from 'vitest'

const mockFunctions = {
  config: {
    get: vi.fn(),
  },
  rest: {
    apps: {
      getOrgInstallation: vi.fn(),
    },
    orgs: {
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      listBlockedUsers: vi.fn(),
      checkBlockedUser: vi.fn(),
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      listHooks: vi.fn(),
      createHook: vi.fn(),
      getHook: vi.fn(),
      updateHook: vi.fn(),
      deleteHook: vi.fn(),
      pingHook: vi.fn(),
      listInstallations: vi.fn(),
      listPendingInvitations: vi.fn(),
      createInvitation: vi.fn(),
      listInvitationTeams: vi.fn(),
      listMembers: vi.fn(),
      checkMembership: vi.fn(),
      removeMember: vi.fn(),
      getMembership: vi.fn(),
      addOrUpdateMembership: vi.fn(),
      removeMembership: vi.fn(),
      listOutsideCollaborators: vi.fn(),
      removeOutsideCollaborator: vi.fn(),
      convertMemberToOutsideCollaborator: vi.fn(),
      listPublicMembers: vi.fn(),
      checkPublicMembership: vi.fn(),
      publicizeMembership: vi.fn(),
      concealMembership: vi.fn(),
      listMemberships: vi.fn(),
      getMembershipForAuthenticatedUser: vi.fn(),
      updateMembership: vi.fn(),
      listForAuthenticatedUser: vi.fn(),
      listForUser: vi.fn(),
      getAllCustomProperties: vi.fn(),
      createOrUpdateCustomProperty: vi.fn(),
    },
    repos: {
      listForOrg: vi.fn(),
      createInOrg: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      enableAutomatedSecurityFixes: vi.fn(),
      disableAutomatedSecurityFixes: vi.fn(),
      listBranches: vi.fn(),
      getBranch: vi.fn(),
      getBranchProtection: vi.fn(),
      updateBranchProtection: vi.fn(),
      removeBranchProtection: vi.fn(),
      getProtectedBranchAdminEnforcement: vi.fn(),
      addProtectedBranchAdminEnforcement: vi.fn(),
      removeProtectedBranchAdminEnforcement: vi.fn(),
      getProtectedBranchPullRequestReviewEnforcement: vi.fn(),
      updateProtectedBranchPullRequestReviewEnforcement: vi.fn(),
      removeProtectedBranchPullRequestReviewEnforcement: vi.fn(),
      getProtectedBranchRequiredSignatures: vi.fn(),
      addProtectedBranchRequiredSignatures: vi.fn(),
      removeProtectedBranchRequiredSignatures: vi.fn(),
      getProtectedBranchRequiredStatusChecks: vi.fn(),
      updateProtectedBranchRequiredStatusChecks: vi.fn(),
      removeProtectedBranchRequiredStatusChecks: vi.fn(),
      listProtectedBranchRequiredStatusChecksContexts: vi.fn(),
      replaceProtectedBranchRequiredStatusChecksContexts: vi.fn(),
      addProtectedBranchRequiredStatusChecksContexts: vi.fn(),
      removeProtectedBranchRequiredStatusChecksContext: vi.fn(),
      getProtectedBranchRestrictions: vi.fn(),
      removeProtectedBranchRestrictions: vi.fn(),
      getAppsWithAccessToProtectedBranch: vi.fn(),
      listAppsWithAccessToProtectedBranch: vi.fn(),
      replaceProtectedBranchAppRestrictions: vi.fn(),
      addProtectedBranchAppRestrictions: vi.fn(),
      removeProtectedBranchAppRestrictions: vi.fn(),
      getTeamsWithAccessToProtectedBranch: vi.fn(),
      listProtectedBranchTeamRestrictions: vi.fn(),
      listTeamsWithAccessToProtectedBranch: vi.fn(),
      replaceProtectedBranchTeamRestrictions: vi.fn(),
      addProtectedBranchTeamRestrictions: vi.fn(),
      removeProtectedBranchTeamRestrictions: vi.fn(),
      getUsersWithAccessToProtectedBranch: vi.fn(),
      listProtectedBranchUserRestrictions: vi.fn(),
      listUsersWithAccessToProtectedBranch: vi.fn(),
      replaceProtectedBranchUserRestrictions: vi.fn(),
      addProtectedBranchUserRestrictions: vi.fn(),
      removeProtectedBranchUserRestrictions: vi.fn(),
      listCollaborators: vi.fn(),
      checkCollaborator: vi.fn(),
      addCollaborator: vi.fn(),
      removeCollaborator: vi.fn(),
      getCollaboratorPermissionLevel: vi.fn(),
      listCommitComments: vi.fn(),
      getCommitComment: vi.fn(),
      updateCommitComment: vi.fn(),
      deleteCommitComment: vi.fn(),
      listCommits: vi.fn(),
      listBranchesForHeadCommit: vi.fn(),
      listCommentsForCommit: vi.fn(),
      createCommitComment: vi.fn(),
      listPullRequestAssociatedWithCommit: vi.fn(),
      getCommit: vi.fn(),
      getCombinedStatusForRef: vi.fn(),
      listStatusesForRef: vi.fn(),
      retrieveCommunityProfileMetrics: vi.fn(),
      compareCommits: vi.fn(),
      getContents: vi.fn(),
      createOrUpdateFile: vi.fn(),
      createFile: vi.fn(),
      updateFile: vi.fn(),
      deleteFile: vi.fn(),
      listContributors: vi.fn(),
      listDeployments: vi.fn(),
      createDeployment: vi.fn(),
      getDeployment: vi.fn(),
      listDeploymentStatuses: vi.fn(),
      createDeploymentStatus: vi.fn(),
      getDeploymentStatus: vi.fn(),
      createDispatchEvent: vi.fn(),
      listDownloads: vi.fn(),
      getDownload: vi.fn(),
      deleteDownload: vi.fn(),
      listForks: vi.fn(),
      createFork: vi.fn(),
      listHooks: vi.fn(),
      createHook: vi.fn(),
      getHook: vi.fn(),
      updateHook: vi.fn(),
      deleteHook: vi.fn(),
      pingHook: vi.fn(),
      testPushHook: vi.fn(),
      listInvitations: vi.fn(),
      deleteInvitation: vi.fn(),
      updateInvitation: vi.fn(),
      listDeployKeys: vi.fn(),
      addDeployKey: vi.fn(),
      getDeployKey: vi.fn(),
      removeDeployKey: vi.fn(),
      listLanguages: vi.fn(),
      merge: vi.fn(),
      getPages: vi.fn(),
      enablePagesSite: vi.fn(),
      disablePagesSite: vi.fn(),
      updateInformationAboutPagesSite: vi.fn(),
      requestPageBuild: vi.fn(),
      listPagesBuilds: vi.fn(),
      getLatestPagesBuild: vi.fn(),
      getPagesBuild: vi.fn(),
      getReadme: vi.fn(),
      listReleases: vi.fn(),
      createRelease: vi.fn(),
      getReleaseAsset: vi.fn(),
      updateReleaseAsset: vi.fn(),
      deleteReleaseAsset: vi.fn(),
      getLatestRelease: vi.fn(),
      getReleaseByTag: vi.fn(),
      getRelease: vi.fn(),
      updateRelease: vi.fn(),
      deleteRelease: vi.fn(),
      listAssetsForRelease: vi.fn(),
      uploadReleaseAsset: vi.fn(),
      getCodeFrequencyStats: vi.fn(),
      getCommitActivityStats: vi.fn(),
      getContributorsStats: vi.fn(),
      getParticipationStats: vi.fn(),
      getPunchCardStats: vi.fn(),
      createStatus: vi.fn(),
      listTags: vi.fn(),
      listTeams: vi.fn(),
      listTopics: vi.fn(),
      replaceTopics: vi.fn(),
      getClones: vi.fn(),
      getTopPaths: vi.fn(),
      getTopReferrers: vi.fn(),
      getViews: vi.fn(),
      transfer: vi.fn(),
      checkVulnerabilityAlerts: vi.fn(),
      enableVulnerabilityAlerts: vi.fn(),
      disableVulnerabilityAlerts: vi.fn(),
      getArchiveLink: vi.fn(),
      createUsingTemplate: vi.fn(),
      listPublic: vi.fn(),
      list: vi.fn(),
      createForAuthenticatedUser: vi.fn(),
      listInvitationsForAuthenticatedUser: vi.fn(),
      acceptInvitation: vi.fn(),
      declineInvitation: vi.fn(),
      listForUser: vi.fn(),
      getCommitRefSha: vi.fn(),
      getCustomPropertiesValues: vi.fn(),
      renameBranch: vi.fn(),
    },
    issues: {
      list: vi.fn(),
      listForOrg: vi.fn(),
      listAssignees: vi.fn(),
      checkAssignee: vi.fn(),
      listForRepo: vi.fn(),
      create: vi.fn(),
      listCommentsForRepo: vi.fn(),
      getComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn(),
      listEventsForRepo: vi.fn(),
      getEvent: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      addAssignees: vi.fn(),
      removeAssignees: vi.fn(),
      listComments: vi.fn(),
      createComment: vi.fn(),
      listEvents: vi.fn(),
      listLabelsOnIssue: vi.fn(),
      addLabels: vi.fn(),
      replaceLabels: vi.fn(),
      removeLabels: vi.fn(),
      removeLabel: vi.fn(),
      lock: vi.fn(),
      unlock: vi.fn(),
      listEventsForTimeline: vi.fn(),
      listLabelsForRepo: vi.fn(),
      createLabel: vi.fn(),
      getLabel: vi.fn(),
      updateLabel: vi.fn(),
      deleteLabel: vi.fn(),
      listMilestonesForRepo: vi.fn(),
      createMilestone: vi.fn(),
      getMilestone: vi.fn(),
      updateMilestone: vi.fn(),
      deleteMilestone: vi.fn(),
      listLabelsForMilestone: vi.fn(),
      listForAuthenticatedUser: vi.fn(),
    },
    actions: {
      cancelWorkflowRun: vi.fn(),
      createOrUpdateSecretForRepo: vi.fn(),
      createRegistrationToken: vi.fn(),
      createRemoveToken: vi.fn(),
      deleteArtifact: vi.fn(),
      deleteSecretFromRepo: vi.fn(),
      downloadArtifact: vi.fn(),
      getArtifact: vi.fn(),
      getPublicKey: vi.fn(),
      getSecret: vi.fn(),
      getSelfHostedRunner: vi.fn(),
      getWorkflow: vi.fn(),
      getWorkflowJob: vi.fn(),
      getWorkflowRun: vi.fn(),
      listArtifactsForRepo: vi.fn(),
      listDownloadsForSelfHostedRunnerApplication: vi.fn(),
      listJobsForWorkflowRun: vi.fn(),
      listRepoWorkflowRuns: vi.fn(),
      listRepoWorkflows: vi.fn(),
      listSecretsForRepo: vi.fn(),
      listSelfHostedRunnersForRepo: vi.fn(),
      listWorkflowJobLogs: vi.fn(),
      listWorkflowRunArtifacts: vi.fn(),
      listWorkflowRunLogs: vi.fn(),
      listWorkflowRuns: vi.fn(),
      reRunWorkflow: vi.fn(),
      removeSelfHostedRunner: vi.fn(),
    },
    core: {
      exportVariable: vi.fn(),
      setSecret: vi.fn(),
      addPath: vi.fn(),
      getInput: vi.fn((value) => value),
      setOutput: vi.fn(),
      setFailed: vi.fn((message) => {
        console.log(`MOCK FAILED: ${message}`)
      }),
      debug: vi.fn((message) => {
        console.log(`MOCK DEBUG: ${message}`)
      }),
      error: vi.fn((message) => {
        console.log(`MOCK ERROR: ${message}`)
      }),
      warning: vi.fn((message) => {
        console.log(`MOCK WARNING: ${message}`)
      }),
      info: vi.fn((message) => {
        console.log(`MOCK INFO: ${message}`)
      }),
      startGroup: vi.fn(),
      endGroup: vi.fn(),
      group: vi.fn(),
      saveState: vi.fn(),
      getState: vi.fn(),
    },
    users: {
      getAuthenticated: vi.fn(),
    },
    git: {
      getRef: vi.fn(),
      createRef: vi.fn(),
      deleteRef: vi.fn(),
    },
  },
}

export class Octomock {
  mockFunctions: {
    rest: Record<string, Record<string, Mock>>
    config: Record<string, Mock>
  }
  defaultContext: { payload: { issue: { body: string; user: object } } }

  mockGitHubImplementation: {
    context: {
      [key: string]: any
    }
    getOctokit: () => Octomock
    GitHub: typeof Octomock
  }

  mockCoreImplementation: {
    exportVariable: any
    setSecret: any
    addPath: any
    getInput: any
    setOutput: any
    setFailed: any
    debug: any
    error: any
    warning: any
    info: any
    startGroup: any
    endGroup: any
    group: any
    saveState: any
    getState: any
  }

  constructor() {
    this.defaultContext = {
      payload: {
        issue: {
          body: '',
          user: {},
        },
      },
    }

    this.mockFunctions = mockFunctions

    this.mockGitHubImplementation = {
      context: {},
      getOctokit: () => {
        return new Octomock()
      },
      GitHub: Octomock,
    }

    this.mockCoreImplementation = {
      exportVariable: this.mockFunctions.rest.core.exportVariable,
      setSecret: this.mockFunctions.rest.core.setSecret,
      addPath: this.mockFunctions.rest.core.addPath,
      getInput: this.mockFunctions.rest.core.getInput,
      setOutput: this.mockFunctions.rest.core.setOutput,
      setFailed: this.mockFunctions.rest.core.setFailed,
      debug: this.mockFunctions.rest.core.debug,
      error: this.mockFunctions.rest.core.error,
      warning: this.mockFunctions.rest.core.warning,
      info: this.mockFunctions.rest.core.info,
      startGroup: this.mockFunctions.rest.core.startGroup,
      endGroup: this.mockFunctions.rest.core.endGroup,
      group: this.mockFunctions.rest.core.group,
      saveState: this.mockFunctions.rest.core.saveState,
      getState: this.mockFunctions.rest.core.getState,
    }
  }

  getOctokitImplementation() {
    return this.mockFunctions
  }

  updateGitHubImplementation(implementation: {
    context: { payload?: any }
    getOctokit: () => Octomock
    GitHub: typeof Octomock
  }) {
    this.mockGitHubImplementation = implementation
  }

  getGitHubImplementation() {
    return this.mockGitHubImplementation
  }

  getCoreImplementation() {
    return this.mockCoreImplementation
  }

  resetMocks() {
    vi.resetAllMocks()
  }

  updateContext(context: {
    [x: string]: any
    payload?: { issue: { body: string; user: object } }
  }) {
    for (const property in context) {
      this.mockGitHubImplementation.context[property] = context[property]
    }
  }

  getContext() {
    return this.mockGitHubImplementation.context
  }
}
