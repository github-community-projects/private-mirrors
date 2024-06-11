import { gitProcedure, router } from '../../utils/trpc-server'
import { syncReposHandler } from './controller'
import { SyncReposSchema } from './schema'

const gitRouter = router({
  syncRepos: gitProcedure
    .input(SyncReposSchema)
    .mutation(({ input }) => syncReposHandler({ input })),
})

export default gitRouter
