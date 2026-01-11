import { AtpAgent } from '@atproto/api'
import { createLogger } from '../logger'

const logger = createLogger({ service: 'atproto-client' })

const PDS_URL = process.env.NEXT_PUBLIC_PDS_URL || 'https://bsky.social'

/**
 * Create an AT Protocol agent for making API requests
 */
export function createAgent(): AtpAgent {
  return new AtpAgent({ service: PDS_URL })
}

/**
 * Get profile information for a DID or handle
 * This is a public endpoint that doesn't require authentication
 */
export async function getProfile(actor: string) {
  try {
    const agent = createAgent()
    const response = await agent.app.bsky.actor.getProfile({ actor })
    return response.data
  } catch (err) {
    logger.error({ error: err, actor }, 'Failed to get profile')
    throw err
  }
}

/**
 * Create an authenticated AT Protocol agent from a session
 *
 * Note: For OAuth-based authentication, we use the OAuth client's session
 * which manages tokens internally. This function retrieves the OAuth session
 * and creates an agent that uses the OAuth session's authenticated fetch handler.
 */
export async function createAuthenticatedAgent(session: {
  did: string
  handle: string
  accessJwt: string
  refreshJwt: string
}): Promise<AtpAgent> {
  // Import OAuth client here to avoid circular dependencies
  const { getOAuthClient } = await import('./oauth')
  const oauthClient = await getOAuthClient()

  try {
    // Try to get the OAuth session for this DID
    const oauthSession = await oauthClient.restore(session.did)

    if (oauthSession) {
      // Create an agent that uses the OAuth session's authenticated fetch
      // Wrap the OAuth fetchHandler to match the standard fetch signature
      const wrappedFetch = async (
        input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url
        return oauthSession.fetchHandler(url, init)
      }

      const agent = new AtpAgent({
        service: PDS_URL,
        fetch: wrappedFetch,
      })
      return agent
    }
  } catch (err) {
    logger.error(
      { error: err, did: session.did },
      'Failed to restore OAuth session'
    )
  }

  // Fallback: create unauthenticated agent (will fail for authenticated operations)
  logger.warn(
    { did: session.did },
    'No OAuth session found, creating unauthenticated agent'
  )
  throw new Error('No valid OAuth session found')
}
