import { config } from '@probot/octokit-plugin-config'
import { Octokit as Core } from 'octokit'
import { logger } from '../utils/logger'

type GraphQlPaginate = InstanceType<typeof Core>['graphql']['paginate']

type GraphQlConfigurableOctokit = {
  graphql: {
    defaults: (options: {
      url: string
    }) => GraphQlConfigurableOctokit['graphql']
    // might be undefined
    paginate?: GraphQlPaginate
  }
}

type GitHubGraphQlEndpointOptions = {
  [key: string]: unknown
  githubGraphQlUrl?: string
}

//Copy pagination to custom GraphQL function, and get it back onto Octokit
export const githubGraphQlEndpointPlugin = (
  octokit: GraphQlConfigurableOctokit,
  options: GitHubGraphQlEndpointOptions,
) => {
  if (!options.githubGraphQlUrl) return {}

  const graphQlCapableOctokit = octokit satisfies GraphQlConfigurableOctokit
  // defaults() returns a new function without plugin-added properties
  const configuredGraphQl = graphQlCapableOctokit.graphql.defaults({
    url: options.githubGraphQlUrl,
  })
  // this preserves GraphQL pagination (iterator included) by adding it back
  configuredGraphQl.paginate = graphQlCapableOctokit.graphql.paginate
  graphQlCapableOctokit.graphql = configuredGraphQl
  return {}
}

export const Octokit = Core.plugin(
  config,
  githubGraphQlEndpointPlugin,
).defaults({
  userAgent: `octokit-rest.js/repo-sync-bot`,
})

export type Octokit = InstanceType<typeof Octokit>

export type GitHubEndpointConfig = {
  apiUrl: string
  graphQlUrl: string
}

const personalOctokitLogger = logger.getSubLogger({ name: 'personal-octokit' })

export const personalOctokit = (
  token: string,
  endpointConfig: GitHubEndpointConfig,
) => {
  return new Octokit({
    auth: token,
    log: personalOctokitLogger,
    baseUrl: endpointConfig.apiUrl,
    githubGraphQlUrl: endpointConfig.graphQlUrl,
  })
}
