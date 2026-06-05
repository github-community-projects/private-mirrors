import { vi, describe, beforeEach, it, expect } from 'vitest'
import { rm } from 'node:fs/promises'
import { cleanupTempDir } from '../src/utils/temp-dir'
import type { Logger } from 'tslog'

vi.mock('node:fs/promises', () => ({
  rm: vi.fn(),
}))

const fakeLogger = {
  warn: vi.fn(),
} as unknown as Logger<unknown>

describe('cleanupTempDir', () => {
  beforeEach(() => {
    vi.mocked(rm).mockReset()
    vi.mocked(fakeLogger.warn).mockReset()
  })

  it('removes the directory recursively and forcefully', async () => {
    vi.mocked(rm).mockResolvedValue(undefined)

    await cleanupTempDir('temp-dir', fakeLogger)

    expect(rm).toHaveBeenCalledTimes(1)
    expect(rm).toHaveBeenCalledWith('temp-dir', {
      recursive: true,
      force: true,
    })
    expect(fakeLogger.warn).not.toHaveBeenCalled()
  })

  it('is a no-op when tempDir is undefined', async () => {
    await cleanupTempDir(undefined, fakeLogger)

    expect(rm).not.toHaveBeenCalled()
    expect(fakeLogger.warn).not.toHaveBeenCalled()
  })

  it('swallows and logs rm errors instead of throwing', async () => {
    const rmError = new Error('permission denied')
    vi.mocked(rm).mockRejectedValue(rmError)

    await expect(
      cleanupTempDir('temp-dir', fakeLogger),
    ).resolves.toBeUndefined()

    expect(fakeLogger.warn).toHaveBeenCalledTimes(1)
    expect(fakeLogger.warn).toHaveBeenCalledWith(
      'Failed to clean up temp directory',
      { tempDir: 'temp-dir', error: rmError },
    )
  })
})
