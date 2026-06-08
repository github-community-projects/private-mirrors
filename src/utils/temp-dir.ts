import { rm } from 'node:fs/promises'
import type { Logger } from 'tslog'

// Removes a temp directory created by tempy. Logs (but does not throw on)
// cleanup failures so callers can use this from finally blocks safely.
export const cleanupTempDir = async (
  tempDir: string | undefined,
  log: Logger<unknown>,
) => {
  if (!tempDir) return
  try {
    await rm(tempDir, { recursive: true, force: true })
  } catch (cleanupError) {
    log.warn('Failed to clean up temp directory', {
      tempDir,
      error: cleanupError,
    })
  }
}
