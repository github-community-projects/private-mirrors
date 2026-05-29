import app from 'bot'
import { createNodeMiddleware, createProbot, ProbotOctokit } from 'probot'
import { githubGraphQlEndpointPlugin } from 'bot/rest'
import { getGitHubApiUrl } from 'utils/github-urls'
import { logger } from 'utils/logger'

const baseUrl = getGitHubApiUrl()

// Configure Probot's Octokit with the GHE/GHES/github.com API base URL so
// every `context.octokit.*` call hits the correct host.
const GheProbotOctokit = ProbotOctokit.plugin(
  githubGraphQlEndpointPlugin,
).defaults({ baseUrl })

export const probot = createProbot({ defaults: { Octokit: GheProbotOctokit } })

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
