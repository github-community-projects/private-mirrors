import type { SimpleGitOptions } from 'simple-git'
import { env } from '../../env.mjs'

export const getBotGitOptions = (
  installationId: string,
): Partial<SimpleGitOptions> => ({
  config: [
    'user.name=pma[bot]',
    // Use the private installation ID so pushes are attributed to the app.
    `user.email=${installationId}+pma[bot]@${env.GITHUB_USER_EMAIL_DOMAIN}`,
  ],
})
