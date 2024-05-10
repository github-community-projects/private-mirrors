import { procedure, router } from '../../utils/trpc-server'
import {
  createMirrorHandler,
  deleteMirrorHandler,
  listMirrorsHandler,
} from './controller'
import {
  CreateMirrorSchema,
  DeleteMirrorSchema,
  ListMirrorsSchema,
} from './schema'

const reposRouter = router({
  createMirror: procedure
    .input(CreateMirrorSchema)
    .mutation(({ input }) => createMirrorHandler({ input })),
  listMirrors: procedure
    .input(ListMirrorsSchema)
    .query(({ input }) => listMirrorsHandler({ input })),
  deleteMirror: procedure
    .input(DeleteMirrorSchema)
    .mutation(({ input }) => deleteMirrorHandler({ input })),
})

export default reposRouter
