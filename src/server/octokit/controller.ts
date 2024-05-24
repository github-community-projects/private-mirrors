import { appOctokit } from '../../bot/octokit'
import { logger } from '../../utils/logger'
import { CheckInstallationSchema } from './schema'

const octokitApiLogger = logger.getSubLogger({ name: 'octokit-api' })

// Checks if the app is installed in the org
export const checkInstallationHandler = async ({
  input,
}: {
  input: CheckInstallationSchema
}) => {
  try {
    octokitApiLogger.info('Checking installation', { input })

    const installationId = await appOctokit().rest.apps.getOrgInstallation({
      org: input.orgId,
    })

    if (installationId.data.id) {
      return { installed: true }
    }

    return { installed: false }
  } catch (error) {
    octokitApiLogger.info('Failed to check installation', { input, error })

    return { installed: false }
  }
}
