import { config } from '@probot/octokit-plugin-config'
import { Octokit as Core } from 'octokit'
import { getGitHubApiUrl } from '../utils/github-urls'

export const Octokit = Core.plugin(config).defaults({
  userAgent: `octokit-rest.js/repo-sync-bot`,
  baseUrl: getGitHubApiUrl(),
})

export type Octokit = InstanceType<typeof Octokit>
