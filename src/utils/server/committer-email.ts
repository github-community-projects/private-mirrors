import { getCommitterEmailDomain, getGitHubServerUrl } from '../github-urls'
import { logger } from '../logger'

const githubUrlsLogger = logger.getSubLogger({ name: 'github-urls' })

let hasWarnedAboutDefaultCommitterEmailDomain = false

const isGithubDotComServer = (serverUrl: string) => {
  try {
    const host = new URL(serverUrl).host.toLowerCase()
    return host === 'github.com' || host === 'www.github.com'
  } catch {
    return true
  }
}

export const getCommitterEmailDomainWithWarning = () => {
  if (
    !hasWarnedAboutDefaultCommitterEmailDomain &&
    !process.env.GITHUB_USER_EMAIL_DOMAIN &&
    !isGithubDotComServer(getGitHubServerUrl())
  ) {
    hasWarnedAboutDefaultCommitterEmailDomain = true
    githubUrlsLogger.warn(
      'GITHUB_USER_EMAIL_DOMAIN is not set for a non-github.com GitHub server; defaulting to users.noreply.github.com.',
      { serverUrl: getGitHubServerUrl() },
    )
  }

  return getCommitterEmailDomain()
}
