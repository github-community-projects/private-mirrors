import { vi, describe, beforeEach, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// load private key before importing the code that uses it

process.env.PRIVATE_KEY = fs.readFileSync(
  path.join(__dirname, '../fixtures/mock-cert.pem'),
  'utf-8',
)

import * as config from '../../src/bot/config'
import configRouter from '../../src/server/config/router'
import { Octomock } from '../octomock'
import { createTestContext } from '../utils/auth'

const om = new Octomock()

vi.mock('../../src/bot/config')

vi.mock('../../src/utils/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/auth')>()
  return {
    ...actual,
    checkGitHubAuth: vi.fn().mockResolvedValue(undefined),
  }
})

describe('Config router', () => {
  beforeEach(() => {
    om.resetMocks()
    vi.resetAllMocks()
  })

  it('should fetch the values from the config', async () => {
    const caller = configRouter.createCaller(createTestContext())

    const configSpy = vi.spyOn(config, 'getConfig').mockResolvedValue({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })

    const res = await caller.getConfig({
      orgId: 'github',
    })

    expect(res).toEqual({
      publicOrg: 'github',
      privateOrg: 'github-test',
    })
    expect(configSpy).toHaveBeenCalledTimes(1)
  })
})
