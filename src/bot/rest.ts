// This is directly copied from https://github.com/octokit/rest.js/blob/main/src/index.ts
// The only change is that we get rid of request logging since we cannot format it
// See https://github.com/octokit/rest.js/issues/393 for more details

import { Octokit as Core } from '@octokit/core'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { legacyRestEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
export type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'

export const Octokit = Core.plugin(
  legacyRestEndpointMethods,
  paginateRest,
).defaults({
  userAgent: `octokit-rest.js/repo-sync-bot`,
})

export type Octokit = InstanceType<typeof Octokit>
