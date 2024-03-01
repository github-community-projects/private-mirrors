// Simple health check endpoint
import { procedure, router } from '../trpc'

export const healthRouter = router({
  // Queries
  ping: procedure.query(async () => {
    return 'pong'
  }),
})
