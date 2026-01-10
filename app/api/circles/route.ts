import { NextRequest, NextResponse } from 'next/server'
import { AtpAgent } from '@atproto/api'
import { getSession } from '@/lib/atproto/session'
import { createCircleService } from '@/lib/services/circleService'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'circles-api' })

/**
 * GET /api/circles
 * List all circles for the authenticated user
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agent = new AtpAgent({ service: process.env.NEXT_PUBLIC_PDS_URL || 'https://bsky.social' })
    agent.session = session

    const circleService = createCircleService(agent)
    const circles = await circleService.getCircles(session.did)

    return NextResponse.json(circles)
  } catch (err) {
    logger.error({ error: err }, 'Failed to list circles')
    return NextResponse.json(
      { error: 'Failed to list circles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/circles
 * Create a new circle
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const agent = new AtpAgent({ service: process.env.NEXT_PUBLIC_PDS_URL || 'https://bsky.social' })
    agent.session = session

    const circleService = createCircleService(agent)
    const circle = await circleService.createCircle(session.did, {
      name: body.name,
      description: body.description,
      members: body.members || [],
    })

    return NextResponse.json(circle, { status: 201 })
  } catch (err) {
    logger.error({ error: err }, 'Failed to create circle')

    // Check if it's a validation error
    const message = err instanceof Error ? err.message : 'Failed to create circle'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
