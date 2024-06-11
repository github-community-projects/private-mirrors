import app from 'bot'
import { createNodeMiddleware, createProbot } from 'probot'
import { logger } from 'utils/logger'

export const probot = createProbot()

const probotLogger = logger.child({ name: 'probot' })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default createNodeMiddleware(app, {
  probot: createProbot({
    defaults: {
      log: {
        child: () => probotLogger,
      } as any,
    },
  }),
  webhooksPath: '/api/webhooks',
})
