import app from 'bot'
import { githubGraphQlEndpointPlugin } from 'bot/rest'
import { createNodeMiddleware, createProbot, ProbotOctokit } from 'probot'
import { getGitHubApiUrl } from 'utils/github-urls'
import { logger } from 'utils/logger'

const GheProbotOctokit = ProbotOctokit.plugin(
  githubGraphQlEndpointPlugin,
).defaults({
  baseUrl: getGitHubApiUrl(),
})

const probotLogger = logger.getSubLogger({ name: 'probot' })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default createNodeMiddleware(app, {
  probot: createProbot({
    defaults: {
      Octokit: GheProbotOctokit,
      log: {
        child: () => probotLogger,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  }),
  webhooksPath: '/api/webhooks',
})
