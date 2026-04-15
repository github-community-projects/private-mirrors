import nock from 'nock'

// Requiring our app implementation
import { Probot, ProbotOctokit } from 'probot'
import app from '../src/bot'

// Requiring our fixtures
import fs from 'fs'
import path from 'path'
import payload from './fixtures/installation.created.json'
const issueCreatedBody = { body: 'Thanks for opening this issue!' }
import { type InstallationCreatedEvent } from '@octokit/webhooks-types'

const privateKey = fs.readFileSync(
  path.join(__dirname, 'fixtures/mock-cert.pem'),
  'utf-8',
)

describe('Webhooks events', () => {
  let probot: Probot

  beforeEach(() => {
    nock.disableNetConnect()
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    })
    // Load our app into probot
    probot.load(app)
  })

  test('creates a comment when an issue is opened', () => {
    let commentBody: Record<string, string> | null = null

    const mock = nock('https://api.github.com')
      // Test that we correctly return a test token
      .post('/app/installations/2/access_tokens')
      .reply(200, {
        token: 'test',
        permissions: {
          issues: 'write',
        },
      })

      // Test that a comment is posted
      .post('/repos/hiimbex/testing-things/issues/1/comments', (body) => {
        commentBody = body
        return body
      })
      .reply(200)

    // Receive a webhook event
    return probot
      .receive({
        id: payload.action,
        name: 'installation',
        payload: payload as unknown as InstallationCreatedEvent,
      })
      .then(() => {
        expect(commentBody).toMatchObject(issueCreatedBody)
        expect(mock.pendingMocks()).toStrictEqual([])
      })
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
