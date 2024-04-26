import { procedure, router } from '../../utils/trpc-server'
import { createMirrorHandler, syncReposHandler } from './controller'
import { CreateMirrorSchema, SyncReposSchema } from './schema'

const gitRouter = router({
  syncRepos: procedure
    .input(SyncReposSchema)
    .mutation(({ input }) => syncReposHandler({ input })),
  createMirror: procedure
    .input(CreateMirrorSchema)
    .mutation(({ input }) => createMirrorHandler({ input })),
})

export default gitRouter
