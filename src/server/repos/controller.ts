/* eslint-disable @typescript-eslint/no-explicit-any */

import simpleGit, { SimpleGitOptions } from 'simple-git'
import { generateAuthUrl } from 'utils/auth'
import { temporaryDirectory } from 'tempy'
import { getConfig } from '../../bot/config'
import {
  appOctokit,
  getAuthenticatedOctokit,
  installationOctokit,
} from '../../bot/octokit'
import { Octokit } from '../../bot/rest'
import { logger } from '../../utils/logger'
import {
  CreateMirrorSchema,
  DeleteMirrorSchema,
  EditMirrorSchema,
  ListMirrorsSchema,
} from './schema'
import { TRPCError } from '@trpc/server'

const reposApiLogger = logger.getSubLogger({ name: 'repos-api' })

type MirrorRepo = Awaited<ReturnType<Octokit['rest']['repos']['createInOrg']>>
type RepoRef = { owner: string; name: string }
type SyncBranchRef = { owner: string; repo: string; branch: string }

// Reads the `fork` custom property set at mirror-creation time and parses it
// into { owner, name }. Returns undefined if the property is missing or
// malformed
const getForkRepoFromMirror = async (
  octokit: Octokit,
  mirrorOwner: string,
  mirrorName: string,
): Promise<RepoRef | undefined> => {
  try {
    // @ts-expect-error getCustomPropertiesValues exists in the API but is not yet in octokit 5 type definitions
    const props = await octokit.rest.repos.getCustomPropertiesValues({
      owner: mirrorOwner,
      repo: mirrorName,
    })
    const forkProp = props.data.find((p: { property_name: string }) => p.property_name === 'fork')
    if (!forkProp || typeof forkProp.value !== 'string') return undefined
    const [owner, name] = forkProp.value.split('/')
    if (!owner || !name) return undefined
    return { owner, name }
  } catch (error) {
    reposApiLogger.error('Failed to read fork custom property', { error })
    return undefined
  }
}

// Deletes a private mirror repo and, when provided, the sync-destination
// branch on the public fork.
const deleteMirrorAndSyncBranch = async ({
  privateOctokit,
  mirrorRepoRef,
  publicOctokit,
  syncBranchRef,
}: {
  privateOctokit: Octokit | undefined
  mirrorRepoRef: RepoRef | undefined
  publicOctokit: Octokit | undefined
  syncBranchRef: SyncBranchRef | undefined
}) => {
  if (privateOctokit && mirrorRepoRef) {
    try {
      await privateOctokit.rest.repos.delete({
        owner: mirrorRepoRef.owner,
        repo: mirrorRepoRef.name,
      })
    } catch (deleteError) {
      reposApiLogger.error('Failed to delete mirror', { deleteError })
    }
  }

  if (publicOctokit && syncBranchRef) {
    try {
      await publicOctokit.rest.git.deleteRef({
        owner: syncBranchRef.owner,
        repo: syncBranchRef.repo,
        ref: `heads/${syncBranchRef.branch}`,
      })
    } catch (deleteError) {
      reposApiLogger.error('Failed to delete sync branch ref', { deleteError })
    }
  }
}

// Creates a mirror of a forked repo
export const createMirrorHandler = async ({
  input,
}: {
  input: CreateMirrorSchema
}) => {
  // Use to track mirror creation for cleanup in case of errors
  let privateOctokit: Octokit | undefined
  let publicOctokit: Octokit | undefined
  let mirrorRepo: MirrorRepo | undefined
  let syncBranchRef: SyncBranchRef | undefined

  try {
    reposApiLogger.info('createMirror', { input: input })

    const config = await getConfig(input.orgId)

    reposApiLogger.debug('Fetched config', { config })

    const { publicOrg, privateOrg } = config

    const octokitData = await getAuthenticatedOctokit(publicOrg, privateOrg)
    publicOctokit = octokitData.contribution.octokit
    const publicAccessToken = octokitData.contribution.accessToken

    privateOctokit = octokitData.private.octokit
    const privateInstallationId = octokitData.private.installationId
    const privateAccessToken = octokitData.private.accessToken

    // Check if the desired repo name already exists in the private org before forking
    const response = await privateOctokit.rest.repos
      .get({
        owner: privateOrg,
        repo: input.newRepoName,
      })
      .catch((error) => {
        // If there is an error other than "Not Found", log and throw it
        if (!(error as Error).message.includes('Not Found')) {
          reposApiLogger.error(
            `Searching for existing mirror named ${input.newRepoName} in ${privateOrg} failed with: `,
            { error },
          )
          throw error
        }
      })

    // If we get a response, the repo already exists so we should throw an error
    if (response && response.status === 200) {
      reposApiLogger.info(
        `a mirror named ${input.newRepoName} already exists in ${privateOrg}`,
      )

      throw new Error(
        `a mirror named ${input.newRepoName} already exists in ${privateOrg}`,
      )
    }

    // TODO: replace this call with a passed in branch name as part of https://github.com/github-community-projects/private-mirrors/issues/448
    const forkRepo = await publicOctokit.rest.repos.get({
      owner: input.forkRepoOwner,
      repo: input.forkRepoName,
    })
    const branch = forkRepo.data.default_branch

    // Create a sync destination branch on the public fork with the same name as the mirror
    const sourceBranchRef = await publicOctokit.rest.git.getRef({
      owner: input.forkRepoOwner,
      repo: input.forkRepoName,
      ref: `heads/${branch}`,
    })
    const sourceBranchSha = sourceBranchRef.data.object.sha
    await publicOctokit.rest.git.createRef({
      owner: input.forkRepoOwner,
      repo: input.forkRepoName,
      ref: `refs/heads/${input.newRepoName}`,
      sha: sourceBranchSha,
    })
    syncBranchRef = {
      owner: input.forkRepoOwner,
      repo: input.forkRepoName,
      branch: input.newRepoName,
    }

    // Get the organization custom properties
    const orgCustomProps =
      // @ts-expect-error getAllCustomProperties exists in the API but is not yet in octokit 5 type definitions
      await privateOctokit.rest.orgs.getAllCustomProperties({
        org: privateOrg,
      })

    // Creates custom property fork in the org if it doesn't exist
    if (
      !orgCustomProps.data.some(
        (prop: { property_name: string }) => prop.property_name === 'fork',
      )
    ) {
      // @ts-expect-error createOrUpdateCustomProperty exists in the API but is not yet in octokit 5 type definitions
      await privateOctokit.rest.orgs.createOrUpdateCustomProperty({
        org: privateOrg,
        custom_property_name: 'fork',
        value_type: 'string',
      })
    }

    // Create the mirror repo in the private org
    mirrorRepo = await privateOctokit.rest.repos.createInOrg({
      name: input.newRepoName,
      org: privateOrg,
      // @ts-expect-error 'internal' visibility is valid but not in octokit 5 type definitions
      visibility: process.env.CREATE_MIRRORS_WITH_INTERNAL_VISIBILITY
        ? 'internal'
        : 'private',
      description: `Mirror of ${input.forkRepoOwner}/${input.forkRepoName}`,
      custom_properties: {
        fork: `${input.forkRepoOwner}/${input.forkRepoName}`,
      },
    })

    const forkRemote = generateAuthUrl(
      publicAccessToken,
      input.forkRepoOwner,
      input.forkRepoName,
    )

    const mirrorRemote = generateAuthUrl(
      privateAccessToken,
      mirrorRepo.data.owner.login,
      mirrorRepo.data.name,
    )

    // Create a temporary directory to clone the repo into
    const tempDir = temporaryDirectory()

    const options: Partial<SimpleGitOptions> = {
      config: [
        `user.name=pma[bot]`,
        // We want to use the private installation ID as the email so that we can push to the private repo
        `user.email=${privateInstallationId}+pma[bot]@users.noreply.github.com`,
      ],
    }
    const git = simpleGit(tempDir, options)

    // Run the slow git work (clone + push) with a timeout. If execution exceeds
    // MIRROR_SYNC_TIMEOUT_MS we return a pending response and let the work
    // continue in the background.
    const gitWork = (async () => {
      // Create a clone of the fork that contains only what is necessary to push to the mirror
      const cloneConfig = ['--single-branch', '--branch', branch, '--no-tags']
      await git.clone(forkRemote, tempDir, cloneConfig)

      await git.addRemote('mirror', mirrorRemote)

      // Push commits in chunks so that large pushes don't encounter timeout issues
      const chunkSize = Number(process.env.MIRROR_PUSH_CHUNK_SIZE ?? 1000)
      const commitCount = Number(
        (
          await git.raw(['rev-list', '--first-parent', '--count', branch])
        ).trim(),
      )

      for (let chunk = 1; chunk * chunkSize < commitCount; chunk++) {
        // Get the sha for the end of the next chunk of commits to push by skipping the recent commits
        const sha = (
          await git.raw([
            'rev-list',
            '--first-parent',
            `--skip=${commitCount - chunk * chunkSize}`,
            '--max-count=1',
            branch,
          ])
        ).trim()

        await git.push(['--no-verify', 'mirror', `${sha}:refs/heads/${branch}`])
      }

      // Push up the branch tip and any remaining commits
      await git.push(['--no-verify', 'mirror', branch])
    })()

    const MIRROR_SYNC_TIMEOUT_MS = Number(
      process.env.MIRROR_SYNC_TIMEOUT_MS ?? 30_000,
    )

    // Sentinel returned by the timeout branch of Promise.race so the pending path
    // is distinguishable from a resolved git promise without throw/catch.
    const PENDING_SENTINEL: unique symbol = Symbol('pending')

    let timer: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<typeof PENDING_SENTINEL>((resolve) => {
      timer = setTimeout(
        () => resolve(PENDING_SENTINEL),
        MIRROR_SYNC_TIMEOUT_MS,
      )
    })

    const raceResult = await Promise.race([gitWork, timeoutPromise])

    if (raceResult === PENDING_SENTINEL) {
      reposApiLogger.info(
        'Mirror creation exceeded sync window; continuing in background',
        {
          repo: mirrorRepo?.data.name,
          timeoutMs: MIRROR_SYNC_TIMEOUT_MS,
        },
      )

      // Attaching handlers here is required — without them a later rejection
      // would surface as an unhandled promise rejection.
      gitWork
        .then(() =>
          reposApiLogger.info('Background mirror creation completed', {
            repo: mirrorRepo?.data.name,
          }),
        )
        .catch(async (err) => {
          reposApiLogger.error('Background mirror creation failed', {
            error: err,
            repo: mirrorRepo?.data.name,
          })
          await deleteMirrorAndSyncBranch({
            privateOctokit,
            mirrorRepoRef: mirrorRepo && {
              owner: mirrorRepo.data.owner.login,
              name: input.newRepoName,
            },
            publicOctokit,
            syncBranchRef,
          })
        })

      return {
        success: true,
        pending: true,
        data: mirrorRepo.data,
      }
    }

    clearTimeout(timer)

    reposApiLogger.info('Mirror created', {
      org: mirrorRepo.data.owner.login,
      name: mirrorRepo.data.name,
    })

    return {
      success: true,
      pending: false,
      data: mirrorRepo.data,
    }
  } catch (error) {
    reposApiLogger.error('Error creating mirror', { error })

    const message =
      (error as any)?.response?.data?.errors?.[0]?.message ??
      (error as any)?.response?.data?.message ??
      (error as Error)?.message ??
      'An error occurred'

    await deleteMirrorAndSyncBranch({
      privateOctokit,
      mirrorRepoRef: mirrorRepo && {
        owner: mirrorRepo.data.owner.login,
        name: input.newRepoName,
      },
      publicOctokit,
      syncBranchRef,
    })

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    })
  }
}

// Lists all the mirrors of a forked repo
export const listMirrorsHandler = async ({
  input,
}: {
  input: ListMirrorsSchema
}) => {
  try {
    reposApiLogger.info('Fetching mirrors', { input })

    const config = await getConfig(input.orgId)

    const installationId = await appOctokit().rest.apps.getOrgInstallation({
      org: config.privateOrg,
    })

    const octokit = installationOctokit(String(installationId.data.id))

    const privateOrgData = await octokit.rest.orgs.get({
      org: config.privateOrg,
    })
    const publicOrgData = await octokit.rest.orgs.get({ org: input.orgId })

    const repos = await octokit.paginate(
      octokit.rest.search.repos,
      {
        q: `org:"${privateOrgData.data.login}"+props.fork:"${publicOrgData.data.login}/${input.forkName}" org:"${privateOrgData.data.login}"&mirror:"${publicOrgData.data.login}/${input.forkName}"+in:description`,
        order: 'desc',
        sort: 'updated',
      },
      (response: { data: unknown[] }) => response.data,
    )

    return repos
  } catch (error) {
    reposApiLogger.info('Failed to fetch mirrors', { input, error })

    const message =
      (error as any)?.response?.data?.errors?.[0]?.message ??
      (error as any)?.response?.data?.message ??
      (error as Error)?.message ??
      'An error occurred'

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    })
  }
}

// Edits the name of a mirror and renames the sync destination branch on
// the public fork (which shares the mirror's name) so that the two
// stay aligned.
export const editMirrorHandler = async ({
  input,
}: {
  input: EditMirrorSchema
}) => {
  try {
    reposApiLogger.info('Editing mirror', { input })

    const config = await getConfig(input.orgId)

    const octokitData = await getAuthenticatedOctokit(
      config.publicOrg,
      config.privateOrg,
    )
    const publicOctokit = octokitData.contribution.octokit
    const privateOctokit = octokitData.private.octokit

    // Lookup the mirror's associated fork to rename the sync branch later
    const forkRepoRef = await getForkRepoFromMirror(
      privateOctokit,
      config.privateOrg,
      input.mirrorName,
    )

    const repo = await privateOctokit.rest.repos.update({
      owner: config.privateOrg,
      repo: input.mirrorName,
      name: input.newMirrorName,
    })

    if (forkRepoRef) {
      try {
        await publicOctokit.rest.repos.renameBranch({
          owner: forkRepoRef.owner,
          repo: forkRepoRef.name,
          branch: input.mirrorName,
          new_name: input.newMirrorName,
        })
      } catch (error) {
        reposApiLogger.error('Failed to rename sync branch on fork', {
          error,
          forkRepoRef,
          oldBranch: input.mirrorName,
          newBranch: input.newMirrorName,
        })
      }
    }

    return {
      success: true,
      data: repo.data,
    }
  } catch (error) {
    reposApiLogger.error('Failed to edit mirror', { input, error })

    const message =
      (error as any)?.response?.data?.errors?.[0]?.message ??
      (error as any)?.response?.data?.message ??
      (error as Error)?.message ??
      'An error occurred'

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    })
  }
}

// Deletes a mirror and its sync-destination branch on the public fork.
export const deleteMirrorHandler = async ({
  input,
}: {
  input: DeleteMirrorSchema
}) => {
  try {
    reposApiLogger.info('Deleting mirror', { input })

    const config = await getConfig(input.orgId)

    const octokitData = await getAuthenticatedOctokit(
      config.publicOrg,
      config.privateOrg,
    )
    const publicOctokit = octokitData.contribution.octokit
    const privateOctokit = octokitData.private.octokit

    const forkRepoRef = await getForkRepoFromMirror(
      privateOctokit,
      config.privateOrg,
      input.mirrorName,
    )

    await deleteMirrorAndSyncBranch({
      privateOctokit,
      mirrorRepoRef: { owner: config.privateOrg, name: input.mirrorName },
      publicOctokit,
      syncBranchRef: forkRepoRef && {
        owner: forkRepoRef.owner,
        repo: forkRepoRef.name,
        branch: input.mirrorName,
      },
    })

    return {
      success: true,
    }
  } catch (error) {
    reposApiLogger.error('Failed to delete mirror', { input, error })

    const message =
      (error as any)?.response?.data?.errors?.[0]?.message ??
      (error as any)?.response?.data?.message ??
      (error as Error)?.message ??
      'An error occurred'

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    })
  }
}
