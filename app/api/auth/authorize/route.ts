import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/atproto/oauth'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'auth-api' })

export async function GET() {
  try {
    logger.info('Generating authorization URL')

    const url = await getAuthUrl()

    return NextResponse.json({ url })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined
    logger.error(
      { error: errorMessage, stack: errorStack },
      'Failed to generate authorization URL'
    )
    return NextResponse.json(
      { error: 'Failed to start authentication', details: errorMessage },
      { status: 500 }
    )
  }
}
