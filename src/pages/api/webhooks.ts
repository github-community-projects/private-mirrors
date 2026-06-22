import app from 'bot'
import { createNodeMiddleware, createProbot } from 'probot'

export const probot = createProbot()

export const config = {
  api: {
    bodyParser: false,
  },
}

// Probot v14 requires a pino logger so custom logging has been removed
// In the future it is worth considering replacing tslog with pino entirely
export default await createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/webhooks',
})
