import { readFileSync } from 'node:fs'
import { beforeEach } from 'vitest'

const requiredEnvironment = {
  APP_ID: '12345',
  GITHUB_CLIENT_ID: 'test-client-id',
  GITHUB_CLIENT_SECRET: 'test-client-secret',
  NEXTAUTH_SECRET: 'test-nextauth-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  WEBHOOK_SECRET: 'test-webhook-secret',
  PRIVATE_KEY: readFileSync(
    new URL('./fixtures/mock-cert.pem', import.meta.url),
    'utf8',
  ),
}

const applyRequiredEnvironment = () => {
  for (const [key, value] of Object.entries(requiredEnvironment)) {
    process.env[key] ??= value
  }
}

applyRequiredEnvironment()
beforeEach(applyRequiredEnvironment)
