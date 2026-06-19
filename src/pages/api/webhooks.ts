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

export default await createNodeMiddleware(app, {
  probot: createProbot({
    defaults: {
      log: {
        child: () => probotLogger,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  }),
  webhooksPath: '/api/webhooks',
// Probot v14 requires a pino logger so custom logging has been removed
// In the future it is worth considering replacing tslog with pino entirely
export default await createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/webhooks',
})
