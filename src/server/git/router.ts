import { procedure, router } from '../../utils/trpc-server'
import { syncReposHandler } from './controller'
import { SyncReposSchema } from './schema'

const gitRouter = router({
  syncRepos: procedure
    .input(SyncReposSchema)
    .mutation(({ input }) => syncReposHandler({ input })),
})

export default gitRouter
