/**
 * Helpers for resolving GitHub host/API/OAuth URLs.
 *
 * All values fall back to github.com defaults so existing deployments are
 * unaffected. Configure each custom URL explicitly for GHE/GHES deployments.
 *
 * Note: these helpers may be imported from client bundles, so they may only
 * read `NEXT_PUBLIC_*` environment variables. Non-public variables are read
 * only via the dedicated server helpers below.
 */

const DEFAULT_SERVER_URL = 'https://github.com'
const DEFAULT_API_URL = 'https://api.github.com'
const DEFAULT_GRAPHQL_URL = 'https://api.github.com/graphql'
const DEFAULT_EMAIL_DOMAIN = 'users.noreply.github.com'
export const isGithubDotComHost = (host: string) =>
  host === 'github.com' || host === 'www.github.com'

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const safeUrl = (value: string | undefined | null): URL | null => {
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Returns the base GitHub web URL (e.g. `https://github.com`).
 * Safe to call from both server and client code.
 */
export const getGitHubServerUrl = (): string => {
  const value =
    process.env.NEXT_PUBLIC_GITHUB_SERVER_URL ?? process.env.GITHUB_SERVER_URL
  return stripTrailingSlash(
    value && value.length > 0 ? value : DEFAULT_SERVER_URL,
  )
}

/**
 * Returns the base GitHub REST API URL (e.g. `https://api.github.com`).
 * Safe to call from both server and client code.
 */
export const getGitHubApiUrl = (): string => {
  const explicit =
    process.env.NEXT_PUBLIC_GITHUB_API_URL ?? process.env.GITHUB_API_URL
  return stripTrailingSlash(
    explicit && explicit.length > 0 ? explicit : DEFAULT_API_URL,
  )
}

/**
 * Returns the GraphQL endpoint URL (e.g. `https://api.github.com/graphql`).
 * Safe to call from both server and client code.
 */
export const getGitHubGraphQlUrl = (): string => {
  const explicit =
    process.env.NEXT_PUBLIC_GITHUB_GRAPHQL_URL ?? process.env.GITHUB_GRAPHQL_URL
  return stripTrailingSlash(
    explicit && explicit.length > 0 ? explicit : DEFAULT_GRAPHQL_URL,
  )
}

/**
 * Returns the hostname portion of the GitHub server URL (e.g. `github.com`).
 * Used to build authenticated git URLs.
 */
export const getGitHubServerHost = (): string => {
  return safeUrl(getGitHubServerUrl())?.host ?? 'github.com'
}

/**
 * Returns the scheme portion of the GitHub server URL (e.g. `https:`).
 * Used to build authenticated git URLs.
 */
export const getGitHubServerProtocol = (): string => {
  return safeUrl(getGitHubServerUrl())?.protocol ?? 'https:'
}

/**
 * Returns the OAuth authorize URL.
 */
export const getOAuthAuthorizationUrl = (): string =>
  `${getGitHubServerUrl()}/login/oauth/authorize`

/**
 * Returns the OAuth access token URL.
 */
export const getOAuthAccessTokenUrl = (): string =>
  `${getGitHubServerUrl()}/login/oauth/access_token`

/**
 * Returns the OAuth issuer URL.
 */
export const getOAuthIssuer = (): string =>
  `${getGitHubServerUrl()}/login/oauth`

/**
 * Returns the committer email domain used for sync commits.
 *
 * Defaults to `users.noreply.github.com` to keep github.com behavior identical.
 * For GHE/GHES, configure `GITHUB_USER_EMAIL_DOMAIN` explicitly (the exact
 * domain depends on the instance/tenant configuration and cannot be safely
 * derived). Server-only.
 */
export const getCommitterEmailDomain = (): string => {
  const value = process.env.GITHUB_USER_EMAIL_DOMAIN
  return value && value.length > 0 ? value : DEFAULT_EMAIL_DOMAIN
}
