import { config } from '@probot/octokit-plugin-config'
import { Octokit as Core } from 'octokit'

export const Octokit = Core.plugin(config).defaults({
  userAgent: `octokit-rest.js/repo-sync-bot`,
})

export type Octokit = InstanceType<typeof Octokit>
