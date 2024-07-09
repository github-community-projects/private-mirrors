import nock from 'nock'

// Requiring our app implementation
import { Probot, ProbotOctokit } from 'probot'
import * as app from '../src/bot'
import { Octomock } from './octomock'

// Requiring our fixtures
import fs from 'fs'
import path from 'path'
import {
  forkBranchProtectionRulesetGQL,
  getBranchProtectionRulesetGQL,
  mirrorBranchProtectionRulesetGQL,
} from '../src/bot/graphql'
import forkCreatedPayload from './fixtures/fork.created.json'
import mirrorCreatedPayload from './fixtures/mirror.created.json'

const om = new Octomock()

const privateKey = fs.readFileSync(
  path.join(__dirname, 'fixtures/mock-cert.pem'),
  'utf-8',
)

describe('Webhooks events', () => {
  let probot: Probot

  beforeEach(() => {
    nock.disableNetConnect()
    om.resetMocks()
    probot = new Probot({
      appId: 12345,
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
          id: 12345,
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

      // Test to see that we check for the branch protection ruleset with gql
      .post('/graphql', (body) => {
        expect(body).toMatchObject({
          query: getBranchProtectionRulesetGQL,
          variables: {
            owner: forkCreatedPayload.repository.owner.login,
            name: forkCreatedPayload.repository.name,
          },
        })
        return body
      })
      .reply(200, {
        data: {
          repository: {
            rulesets: {
              nodes: [],
            },
          },
        },
      })

      // Test to see that we create the branch protection ruleset with gql
      .post('/graphql', (body) => {
        expect(body).toMatchObject({
          query: forkBranchProtectionRulesetGQL,
          variables: {
            repositoryId: forkCreatedPayload.repository.node_id,
            ruleName: 'all-branch-protections-pma',
          },
        })
        return body
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({
      id: forkCreatedPayload.action,
      name: 'repository',
      payload: forkCreatedPayload as any,
    })

    expect(mock.pendingMocks()).toStrictEqual([])
  })

  test('creates branch protections for a mirror', async () => {
    const mock = nock('https://api.github.com')
      // Test that we can hit the app endpoints
      .get('/app')
      .reply(200, {
        // Return data about the app
        data: {
          id: 12345,
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

      // Test to see that we check for the branch protection ruleset with gql
      .post('/graphql', (body) => {
        expect(body).toMatchObject({
          query: getBranchProtectionRulesetGQL,
          variables: {
            owner: mirrorCreatedPayload.repository.owner.login,
            name: mirrorCreatedPayload.repository.name,
          },
        })
        return body
      })
      .reply(200, {
        data: {
          repository: {
            rulesets: {
              nodes: [],
            },
          },
        },
      })

      // Test to see that we create the branch protection ruleset with gql
      .post('/graphql', (body) => {
        expect(body).toMatchObject({
          query: mirrorBranchProtectionRulesetGQL,
          variables: {
            repositoryId: mirrorCreatedPayload.repository.node_id,
            ruleName: 'default-branch-protection-pma',
          },
        })
        return body
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({
      id: mirrorCreatedPayload.action,
      name: 'repository',
      payload: mirrorCreatedPayload as any,
    })

    expect(mock.pendingMocks()).toStrictEqual([])
  })
})
