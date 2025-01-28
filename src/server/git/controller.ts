/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */

import simpleGit, { SimpleGitOptions } from 'simple-git'
import { getConfig } from '../../bot/config'
import { generateAuthUrl } from '../../utils/auth'
import { temporaryDirectory } from '../../utils/dir'
import { logger } from '../../utils/logger'
import { SyncReposSchema } from './schema'
import fs from 'fs'
import path from 'path'

const gitApiLogger = logger.getSubLogger({ name: 'git-api' })

export const fetchExclusionConfig = async (
  repoPath: string,
): Promise<string[]> => {
  const configPath = path.join(repoPath, '.syncignore')
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8')
    return content.split('\n').filter((line) => line.trim() !== '')
  }
  return []
}

// Syncs the fork and mirror repos
export const syncReposHandler = async ({
  input,
}: {
  input: SyncReposSchema
}) => {
  try {
    gitApiLogger.info('Syncing repos', { ...input, accessToken: 'none' })

    const config = await getConfig(input.orgId)
    gitApiLogger.debug('Fetched config', config)

    const { publicOrg, privateOrg } = config

    const gitOptions: Partial<SimpleGitOptions> = {
      baseDir: temporaryDirectory(),
      binary: 'git',
      maxConcurrentProcesses: 6,
    }
    const git = simpleGit(gitOptions)

    const forkRepoPath = path.join(temporaryDirectory(), input.forkName)
    const mirrorRepoPath = path.join(temporaryDirectory(), input.mirrorName)

    // Clone the fork and mirror repositories
    await git.clone(
      `https://github.com/${input.forkOwner}/${input.forkName}.git`,
      forkRepoPath,
    )
    await git.clone(
      `https://github.com/${input.mirrorOwner}/${input.mirrorName}.git`,
      mirrorRepoPath,
    )

    // Fetch exclusion configuration
    const exclusionPaths = await fetchExclusionConfig(mirrorRepoPath)

    // Checkout the mirror branch
    await git
      .cwd(mirrorRepoPath)
      .checkoutBranch(
        input.mirrorBranchName,
        `origin/${input.mirrorBranchName}`,
      )
    gitApiLogger.debug('Checked out branch', input.mirrorBranchName)

    // Apply exclusion paths logic
    for (const exclusionPath of exclusionPaths) {
      try {
        await git.cwd(mirrorRepoPath).rm(exclusionPath)
      } catch (error) {
        gitApiLogger.warn(`Path not found: ${exclusionPath}`, { error })
      }
    }

    // Merge fork branch into mirror branch
    await git
      .cwd(mirrorRepoPath)
      .mergeFromTo(`origin/${input.forkBranchName}`, input.mirrorBranchName)
    gitApiLogger.debug('Merged branches')
    gitApiLogger.debug('git status', await git.cwd(mirrorRepoPath).status())

    // Push changes to the mirror repository
    await git.cwd(mirrorRepoPath).push('origin', input.mirrorBranchName)

    return {
      success: true,
    }
  } catch (error) {
    gitApiLogger.error('Error syncing repos', { error })
    return {
      success: false,
    }
  }
}
