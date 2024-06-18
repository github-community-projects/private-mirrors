import { TRPCError } from '@trpc/server'
import { getConfig } from '../../bot/config'
import { logger } from '../../utils/logger'
import { GetConfigSchema } from './schema'

const configApiLogger = logger.getSubLogger({ name: 'org-api' })

// Get the config values for the given org
export const getConfigHandler = async ({
  input,
}: {
  input: GetConfigSchema
}) => {
  try {
    configApiLogger.info('Fetching config', { ...input })

    const config = await getConfig(input.orgId)

    configApiLogger.debug('Fetched config', config)

    return config
  } catch (error) {
    configApiLogger.error('Error fetching config', { error })

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: (error as Error).message,
    })
  }
}
