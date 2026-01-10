import { NextResponse } from 'next/server'
import { AtpAgent } from '@atproto/api'
import { getSession } from '@/lib/atproto/session'
import { createGraphRepository } from '@/lib/atproto/repositories/graphRepository'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'following-api' })

/**
 * GET /api/following
 * Get the user's Bluesky following list
 * Used to bootstrap circle members from existing social graph
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agent = new AtpAgent({ service: process.env.NEXT_PUBLIC_PDS_URL || 'https://bsky.social' })
    agent.session = session

    const graphRepository = createGraphRepository(agent)
    const profiles = await graphRepository.getAllFollowing(session.did)

    return NextResponse.json(profiles)
  } catch (err) {
    logger.error({ error: err }, 'Failed to get following list')
    return NextResponse.json(
      { error: 'Failed to get following list' },
      { status: 500 }
    )
  }
}
