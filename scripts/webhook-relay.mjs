import { sign } from '@octokit/webhooks-methods'
import WebhookRelay from 'github-app-webhook-relay-polling'
import crypto from 'node:crypto'
import { App, Octokit } from 'octokit'

import './proxy.mjs'

if (!process.env.PUBLIC_ORG) {
  console.error(
    'Missing PUBLIC_ORG environment variable. This is required for the webhook relay to work locally.',
  )
  process.exit(1)
}

const url = `${process.env.NEXTAUTH_URL}/api/webhooks`

const deriveApiUrl = (serverUrl) => {
  try {
    const u = new URL(serverUrl)
    const host = u.host.toLowerCase()
    if (host === 'github.com' || host === 'www.github.com') {
      return 'https://api.github.com'
    }
    if (host === 'ghe.com' || host.endsWith('.ghe.com')) {
      return `${u.protocol}//api.${host}`
    }
    return `${u.protocol}//${u.host}/api/v3`
  } catch {
    return 'https://api.github.com'
  }
}

const apiBaseUrl =
  process.env.GITHUB_API_URL ??
  process.env.NEXT_PUBLIC_GITHUB_API_URL ??
  deriveApiUrl(
    process.env.GITHUB_SERVER_URL ??
      process.env.NEXT_PUBLIC_GITHUB_SERVER_URL ??
      'https://github.com',
  )

if (apiBaseUrl !== 'https://api.github.com') {
  console.warn(
    `[webhook-relay] Using API base URL: ${apiBaseUrl}. The polling webhook relay relies on the GitHub App hook deliveries endpoint and may not work against all GHE deployments.`,
  )
}

const RelayOctokit = Octokit.defaults({ baseUrl: apiBaseUrl })

const privateKey =
  process.env.PRIVATE_KEY &&
  !process.env.PRIVATE_KEY.includes('-----BEGIN RSA PRIVATE KEY-----')
    ? // Support optional base64 decoding of the private key to prevent issues with complicated environment variable passing scenarios
      Buffer.from(process.env.PRIVATE_KEY, 'base64').toString('utf8')
    : // Handle a bug with multiline envs in docker - See https://github.com/moby/moby/issues/46773
      (process.env.PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '')

const privateKeyPkcs8 = crypto.createPrivateKey(privateKey).export({
  type: 'pkcs8',
  format: 'pem',
})

const setupForwarder = (organizationOwner) => {
  const app = new App({
    appId: process.env.APP_ID,
    privateKey: privateKeyPkcs8,
    webhooks: {
      // value does not matter, but has to be set.
      secret: 'secret',
    },
    Octokit: RelayOctokit,
  })

  const relay = new WebhookRelay({
    owner: organizationOwner,
    events: ['*'],
    app,
  })

  relay.on('start', () => {
    console.log('Webhook forwarder ready')
    console.log(`Using '${organizationOwner}' as the organization`)
  })

  relay.on('webhook', async (event) => {
    console.log(
      `[${organizationOwner}] Forwarding received webhook: ${event.name}`,
    )

    const parsedEvent = JSON.stringify(event.payload)

    const eventNameWithAction = event.payload.action
      ? `${event.name}.${event.payload.action}`
      : event.name

    console.log(
      `[${organizationOwner}] Forwarding ${eventNameWithAction} event to ${url} ... `,
    )

    const headers = {}

    headers['x-hub-signature-256'] = await sign(
      process.env.WEBHOOK_SECRET,
      parsedEvent,
    )
    headers['x-github-event'] = eventNameWithAction
    headers['x-github-delivery'] = event.id
    headers['content-type'] = 'application/json'

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: parsedEvent,
    })

    console.log(
      `[${organizationOwner}] ${eventNameWithAction} event response status= ${response.status}`,
    )
  })

  relay.on('error', (error) => {
    console.log(`[${organizationOwner}] error: ${error}`)
  })

  relay.start()
}

setupForwarder(process.env.PUBLIC_ORG)

if (
  process.env.PRIVATE_ORG &&
  process.env.PUBLIC_ORG !== process.env.PRIVATE_ORG
) {
  console.log('Setting up private organization webhook relay')
  setupForwarder(process.env.PRIVATE_ORG)
}
