import app from 'bot'
import { createNodeMiddleware, createProbot } from 'probot'
import { logger } from 'utils/logger'

export const probot = createProbot()

const probotLogger = logger.getSubLogger({ name: 'probot' })

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  }),
  webhooksPath: '/api/webhooks',
})
