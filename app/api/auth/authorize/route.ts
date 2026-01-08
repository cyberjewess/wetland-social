import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/atproto/oauth'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'auth-api' })

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state') || ''

    logger.info({ state }, 'Generating authorization URL')

    const url = await getAuthUrl(state)

    return NextResponse.json({ url })
  } catch (err) {
    logger.error({ error: err }, 'Failed to generate authorization URL')
    return NextResponse.json(
      { error: 'Failed to start authentication' },
      { status: 500 }
    )
  }
}
