import { NodeOAuthClient } from '@atproto/oauth-client-node'
import { JoseKey } from '@atproto/jwk-jose'
import fs from 'fs'
import { createLogger } from '../logger'

const logger = createLogger({ service: 'oauth' })

let oauthClient: NodeOAuthClient | null = null

export async function getOAuthClient(): Promise<NodeOAuthClient> {
  if (oauthClient) {
    return oauthClient
  }

  try {
    const privateKeyPath = process.env.OAUTH_PRIVATE_KEY_PATH
    if (!privateKeyPath) {
      throw new Error('OAUTH_PRIVATE_KEY_PATH not configured')
    }

    logger.info({ privateKeyPath }, 'Loading OAuth private key')

    const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8')
    const privateKey = await JoseKey.fromImportable(privateKeyPem, '1')

    const clientMetadata = {
      client_id: process.env.OAUTH_CLIENT_ID || 'http://localhost:3000/client-metadata.json',
      client_name: 'Wetland Social',
      client_uri: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      redirect_uris: [
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'atproto transition:generic',
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'ES256',
      jwks_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/jwks.json`,
      application_type: 'web',
    }

    oauthClient = new NodeOAuthClient({
      clientMetadata,
      keyset: [privateKey],
      runtimeImplementation: {
        requestLock: async (key, fn) => {
          // Simple in-memory lock for development
          // TODO: Use Redis or database for production
          return fn()
        },
      },
    })

    logger.info('OAuth client initialized successfully')
    return oauthClient
  } catch (err) {
    logger.error({ error: err }, 'Failed to initialize OAuth client')
    throw err
  }
}

export async function getAuthUrl(state: string): Promise<string> {
  const client = await getOAuthClient()
  const url = await client.authorize('https://bsky.social', {
    state,
    scope: 'atproto transition:generic',
  })

  logger.info({ state }, 'Generated authorization URL')
  return url.toString()
}
