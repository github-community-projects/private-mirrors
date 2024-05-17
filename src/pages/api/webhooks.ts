import app from 'bot'
import { createNodeMiddleware, createProbot } from 'probot'

export const probot = createProbot()

export const config = {
  api: {
    bodyParser: false,
  },
}

export default createNodeMiddleware(app, {
  probot: createProbot({}),
  webhooksPath: '/api/webhooks',
})
