import { procedure, router } from '../../utils/trpc-server'
import { getConfigHandler } from './controller'
import { GetConfigSchema } from './schema'

const configRouter = router({
  getConfig: procedure
    .input(GetConfigSchema)
    .query(({ input }) => getConfigHandler({ input })),
})

export default configRouter
