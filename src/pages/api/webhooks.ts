import app from 'bot'
import { githubGraphQlEndpointPlugin } from 'bot/rest'
import { createNodeMiddleware, createProbot, ProbotOctokit } from 'probot'
import { env } from '../../../env.mjs'

const CustomProbotOctokit = ProbotOctokit.plugin(
  githubGraphQlEndpointPlugin,
).defaults({
  baseUrl: env.GITHUB_API_URL,
  githubGraphQlUrl: env.GITHUB_GRAPHQL_URL,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

// Probot v14 requires a pino logger so custom logging has been removed
// In the future it is worth considering replacing tslog with pino entirely
export default await createNodeMiddleware(app, {
  probot: createProbot({
    defaults: {
      Octokit: CustomProbotOctokit,
    },
  }),
  webhooksPath: '/api/webhooks',
})
