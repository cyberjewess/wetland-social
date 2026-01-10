import { NextRequest, NextResponse } from 'next/server'
import { AtpAgent } from '@atproto/api'
import { getSession } from '@/lib/atproto/session'
import { createGraphRepository } from '@/lib/atproto/repositories/graphRepository'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'profiles-search-api' })

/**
 * GET /api/profiles/search?q=query
 * Search for profiles by handle or DID
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const agent = new AtpAgent({ service: process.env.NEXT_PUBLIC_PDS_URL || 'https://bsky.social' })
    agent.session = session

    const graphRepository = createGraphRepository(agent)
    const profiles = await graphRepository.searchProfiles(query)

    return NextResponse.json(profiles)
  } catch (err) {
    logger.error({ error: err }, 'Failed to search profiles')
    return NextResponse.json(
      { error: 'Failed to search profiles' },
      { status: 500 }
    )
  }
}
