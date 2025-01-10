import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { APIGatewayEvent, Context } from 'aws-lambda';
import lowercaseKeys from 'lowercase-keys';
import { Probot } from 'probot';
import app from '../app';

const secretsManager = new SecretsManager();
const credentialsValue = await secretsManager.getSecretValue({ SecretId: process.env.CREDENTIALS_ARN });
if (!credentialsValue.SecretString) throw new Error('No SecretString returned for credentials');
const credentials = JSON.parse(credentialsValue.SecretString) as Record<string, string>;

export async function handler(event: APIGatewayEvent, context: Context) {
  console.log({ event, context });

  const probot = new Probot({
    appId: credentials.appId,
    privateKey: credentials.privateKey,
    secret: credentials.webhookSecret
  });

  await probot.load(app, { context });

  // lowercase all headers to respect headers insensitivity (RFC 7230 $3.2 'Header Fields', see issue #62)
  const headersLowerCase = lowercaseKeys(event.headers);

  // this will be simpler once we ship `verifyAndParse()`
  // see https://github.com/octokit/webhooks.js/issues/379
  await probot.webhooks.verifyAndReceive({
    id: headersLowerCase['x-github-delivery'],
    name: headersLowerCase['x-github-event'],
    signature: headersLowerCase['x-hub-signature-256'] ?? headersLowerCase['x-hub-signature'],
    payload: event.body
  } as Parameters<Probot['webhooks']['verifyAndReceive']>[0]);

  // In case we are being called synchronously
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
}
