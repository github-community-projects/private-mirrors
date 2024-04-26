import app from '../../../../bot'
import { createNodeMiddleware, createProbot, Logger } from 'probot'
import { logger } from '../../../../utils/logger'

export const probot = createProbot()

// Disable the bodyParser to allow the raw body to be read
// https://github.com/github-community-projects/internal-contribution-forks/issues/88
export const config = {
  api: {
    bodyParser: false,
  },
}

export default createNodeMiddleware(app, {
  probot: createProbot({
    defaults: {
      log: {
        child: () => logger.getSubLogger({ name: 'probot' }),
      } as any as Logger,
    },
  }),
  webhooksPath: '/api/webhooks',
})
