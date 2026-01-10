import { NextRequest, NextResponse } from 'next/server'
import { AtpAgent } from '@atproto/api'
import { getSession } from '@/lib/atproto/session'
import { createCircleService } from '@/lib/services/circleService'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'circles-api' })

/**
 * GET /api/circles/[uri]
 * Get a single circle by URI
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uri: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uri } = await params
    const decodedUri = decodeURIComponent(uri)

    const agent = new AtpAgent({ service: process.env.NEXT_PUBLIC_PDS_URL || 'https://bsky.social' })
    agent.session = session

    const circleService = createCircleService(agent)
    const circle = await circleService.getCircle(decodedUri)

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
    }

    return NextResponse.json(circle)
  } catch (err) {
    logger.error({ error: err }, 'Failed to get circle')
    return NextResponse.json(
      { error: 'Failed to get circle' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/circles/[uri]
 * Update an existing circle
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uri: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uri } = await params
    const decodedUri = decodeURIComponent(uri)
    const body = await request.json()

    const agent = new AtpAgent({ service: process.env.NEXT_PUBLIC_PDS_URL || 'https://bsky.social' })
    agent.session = session

    const circleService = createCircleService(agent)
    const circle = await circleService.updateCircle(decodedUri, body)

    return NextResponse.json(circle)
  } catch (err) {
    logger.error({ error: err }, 'Failed to update circle')

    const message = err instanceof Error ? err.message : 'Failed to update circle'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

/**
 * DELETE /api/circles/[uri]
 * Delete a circle
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uri: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uri } = await params
    const decodedUri = decodeURIComponent(uri)

    const agent = new AtpAgent({ service: process.env.NEXT_PUBLIC_PDS_URL || 'https://bsky.social' })
    agent.session = session

    const circleService = createCircleService(agent)
    await circleService.deleteCircle(decodedUri)

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({ error: err }, 'Failed to delete circle')

    const message = err instanceof Error ? err.message : 'Failed to delete circle'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
