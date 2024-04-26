import { procedure, router } from '../../utils/trpc-server'
import { deleteMirrorHandler, listMirrorsHandler } from './controller'
import { DeleteMirrorSchema, ListMirrorsSchema } from './schema'

const reposRouter = router({
  listMirrors: procedure
    .input(ListMirrorsSchema)
    .query(({ input }) => listMirrorsHandler({ input })),
  deleteMirror: procedure
    .input(DeleteMirrorSchema)
    .mutation(({ input }) => deleteMirrorHandler({ input })),
})

export default reposRouter
