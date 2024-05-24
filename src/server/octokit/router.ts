import { procedure, router } from '../../utils/trpc-server'
import { checkInstallationHandler } from './controller'
import { CheckInstallationSchema } from './schema'

const octokitRouter = router({
  checkInstallation: procedure
    .input(CheckInstallationSchema)
    .query(({ input }) => checkInstallationHandler({ input })),
})

export default octokitRouter
