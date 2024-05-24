import { procedure, router } from '../../utils/trpc-server'
import {
  createMirrorHandler,
  deleteMirrorHandler,
  editMirrorHandler,
  listMirrorsHandler,
} from './controller'
import {
  CreateMirrorSchema,
  DeleteMirrorSchema,
  EditMirrorSchema,
  ListMirrorsSchema,
} from './schema'

const reposRouter = router({
  createMirror: procedure
    .input(CreateMirrorSchema)
    .mutation(({ input }) => createMirrorHandler({ input })),
  listMirrors: procedure
    .input(ListMirrorsSchema)
    .query(({ input }) => listMirrorsHandler({ input })),
  editMirror: procedure
    .input(EditMirrorSchema)
    .mutation(({ input }) => editMirrorHandler({ input })),
  deleteMirror: procedure
    .input(DeleteMirrorSchema)
    .mutation(({ input }) => deleteMirrorHandler({ input })),
})

export default reposRouter
