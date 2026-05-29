import { config } from '@probot/octokit-plugin-config'
import { Octokit as Core } from 'octokit'
import { getGitHubApiUrl, getGitHubGraphQlUrl } from '../utils/github-urls'

type GraphQlConfigurableOctokit = {
  graphql: {
    defaults: (options: {
      url: string
    }) => GraphQlConfigurableOctokit['graphql']
  }
}

export const githubGraphQlEndpointPlugin = (octokit: unknown) => {
  const graphQlCapableOctokit = octokit as GraphQlConfigurableOctokit
  graphQlCapableOctokit.graphql = graphQlCapableOctokit.graphql.defaults({
    url: getGitHubGraphQlUrl(),
  })
  return {}
}

export const Octokit = Core.plugin(
  config,
  githubGraphQlEndpointPlugin,
).defaults({
  userAgent: `octokit-rest.js/repo-sync-bot`,
  baseUrl: getGitHubApiUrl(),
})

export type Octokit = InstanceType<typeof Octokit>
