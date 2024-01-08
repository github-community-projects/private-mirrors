import app from 'bot'
import { createNodeMiddleware, createProbot, Logger } from 'probot'
import { logger } from 'utils/logger'

export const probot = createProbot()

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
