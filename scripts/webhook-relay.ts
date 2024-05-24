import { sign } from '@octokit/webhooks-methods'
import WebhookRelay from 'github-app-webhook-relay-polling'
import crypto from 'node:crypto'
import { App } from 'octokit'

import 'utils/proxy'

if (!process.env.PUBLIC_ORG) {
  console.error(
    'Missing PUBLIC_ORG environment variable. This is required for the webhook relay to work locally.',
  )
  process.exit(1)
}

const url = `${process.env.NEXTAUTH_URL}/api/webhooks`

const privateKeyPkcs8 = crypto
  .createPrivateKey(process.env.PRIVATE_KEY.replace(/\\n/g, '\n'))
  .export({
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
