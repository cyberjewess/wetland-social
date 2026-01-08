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
