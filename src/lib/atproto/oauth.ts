import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState,
} from '@atproto/oauth-client-node'
import { JoseKey } from '@atproto/jwk-jose'
import type { SimpleStore } from '@atproto-labs/simple-store'
import fs from 'fs'
import { createLogger } from '../logger'
import { createRedisClient, createRedisStore } from './redis-store'

const logger = createLogger({ service: 'oauth' })

// In-memory fallback stores for environments without Redis
function createMemoryStore<
  T extends NonNullable<unknown> | null,
>(): SimpleStore<string, T> {
  const data = new Map<string, T>()
  return {
    get: async key => data.get(key),
    set: async (key, value) => {
      data.set(key, value)
    },
    del: async key => {
      data.delete(key)
    },
  }
}

// Initialize stores based on environment
let stateStore: SimpleStore<string, NodeSavedState>
let sessionStore: SimpleStore<string, NodeSavedSession>

const redisUrl = process.env.REDIS_URL
if (redisUrl) {
  logger.info(
    { redisUrl: redisUrl.replace(/:[^:]*@/, ':***@') },
    'Using Redis for OAuth storage'
  )
  const redis = createRedisClient(redisUrl)
  stateStore = createRedisStore<NodeSavedState>('state', redis, 600) // 10 min TTL
  sessionStore = createRedisStore<NodeSavedSession>('session', redis, 86400) // 24 hour TTL
} else {
  logger.warn(
    'No REDIS_URL configured - using in-memory storage (OAuth state will be lost on hot reload)'
  )
  stateStore = createMemoryStore<NodeSavedState>()
  sessionStore = createMemoryStore<NodeSavedSession>()
}

let oauthClient: NodeOAuthClient | null = null

export async function getOAuthClient(): Promise<NodeOAuthClient> {
  if (oauthClient) {
    logger.info('Reusing existing OAuth client')
    return oauthClient
  }

  try {
    const privateKeyPath = process.env.OAUTH_PRIVATE_KEY_PATH
    if (!privateKeyPath) {
      throw new Error('OAUTH_PRIVATE_KEY_PATH not configured')
    }

    // Resolve path relative to project root if not absolute
    const resolvedPath = privateKeyPath.startsWith('/')
      ? privateKeyPath
      : `${process.cwd()}/${privateKeyPath}`

    logger.info(
      { privateKeyPath: resolvedPath },
      'Creating new OAuth client - loading private key'
    )

    const privateKeyPem = fs.readFileSync(resolvedPath, 'utf8')
    const privateKey = await JoseKey.fromImportable(privateKeyPem, '1')

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`

    const clientMetadata = {
      client_id:
        process.env.OAUTH_CLIENT_ID ||
        'http://localhost:3000/client-metadata.json',
      client_name: 'Wetland Social',
      client_uri: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      redirect_uris: [redirectUri] as [string, ...string[]],
      grant_types: ['authorization_code', 'refresh_token'] as [
        'authorization_code',
        'refresh_token',
      ],
      response_types: ['code'] as ['code'],
      scope: 'atproto transition:generic',
      token_endpoint_auth_method: 'private_key_jwt' as const,
      token_endpoint_auth_signing_alg: 'ES256',
      jwks_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/jwks.json`,
      application_type: 'web' as const,
    }

    oauthClient = new NodeOAuthClient({
      clientMetadata,
      keyset: [privateKey],
      stateStore,
      sessionStore,
      requestLock: async (_key, fn) => {
        // Simple in-memory lock for development
        // TODO: Use Redis or database for production
        return fn()
      },
    })

    logger.info('OAuth client initialized successfully')
    return oauthClient
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined
    logger.error(
      { error: errorMessage, stack: errorStack },
      'Failed to initialize OAuth client'
    )
    throw err
  }
}

export async function getAuthUrl(): Promise<string> {
  const client = await getOAuthClient()
  // The OAuth library generates and manages state internally
  const url = await client.authorize('https://bsky.social', {
    scope: 'atproto transition:generic',
  })

  logger.info('Generated authorization URL')
  return url.toString()
}
