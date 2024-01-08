import nock from 'nock'

// Requiring our app implementation
import { Probot, ProbotOctokit } from 'probot'
import * as app from '../src/bot'

// Requiring our fixtures
import fs from 'fs'
import path from 'path'
import { branchProtectionGQL } from '../src/bot/graphql'
import repoCreatedPayload from './fixtures/repository.created.json'
const issueCreatedBody = { body: 'Thanks for opening this issue!' }

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
    probot.load(app.default)
  })

  test('creates branch protections for a fork', async () => {
    const mock = nock('https://api.github.com')
      // Test that we can hit the app endpoints
      .get('/app')
      .reply(200, {
        // Return data about the app
        data: {
          id: 123,
          node_id: 'fake-node-id',
        },
      })

      // Test that we correctly return a test token
      .post('/app/installations/12345/access_tokens')
      .reply(200, {
        token: 'test-token',
        permissions: {
          issues: 'write',
        },
      })

      // Test we hit the correct endpoint for creating branch protections with gql
      .post('/graphql', (body) => {
        expect(body).toMatchObject({
          query: branchProtectionGQL,
          variables: {
            pattern: '*',
            repositoryId: repoCreatedPayload.repository.node_id,
          },
        })
        return body
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({
      id: repoCreatedPayload.action,
      name: 'repository',
      payload: repoCreatedPayload as any,
    })

    expect(mock.pendingMocks()).toStrictEqual([])
  })

  test('creates branch protections for a fork', async () => {
    const mock = nock('https://api.github.com')
      // Test that we can hit the app endpoints
      .get('/app')
      .reply(200, {
        // Return data about the app
        data: {
          id: 123,
          node_id: 'fake-node-id',
        },
      })

      // Test that we correctly return a test token
      .post('/app/installations/12345/access_tokens')
      .reply(200, {
        token: 'test-token',
        permissions: {
          issues: 'write',
        },
      })

      // Test we hit the correct endpoint for creating branch protections with gql
      .post('/graphql', (body) => {
        expect(body).toMatchObject({
          query: branchProtectionGQL,
          variables: {
            pattern: '*',
            repositoryId: repoCreatedPayload.repository.node_id,
          },
        })
        return body
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({
      id: repoCreatedPayload.action,
      name: 'repository',
      payload: repoCreatedPayload as any,
    })

    expect(mock.pendingMocks()).toStrictEqual([])
  })

  test('gets metadata correctly', () => {
    const nonJson = 'This is a normal json string'
    const mirrorString =
      '{"mirror":"github-ospo-test/test","branch":"test-mirror"}'
    let noDescription: any

    expect(app.getMetadata(nonJson)).toEqual({})
    expect(app.getMetadata(mirrorString)).toEqual({
      mirror: 'github-ospo-test/test',
      branch: 'test-mirror',
    })
    expect(app.getMetadata(noDescription)).toEqual({})
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
