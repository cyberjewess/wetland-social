import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/atproto/oauth'
import { setSession } from '@/lib/atproto/session'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'auth-callback' })

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      )
    }

    logger.info('Processing OAuth callback')

    const client = await getOAuthClient()

    // Build callback URL with code
    const url = new URL(request.url)
    const params = new URLSearchParams()
    params.set('code', code)
    params.set('state', request.nextUrl.searchParams.get('state') || '')

    const result = await client.callback(params)

    const { session } = result

    await setSession({
      did: session.did,
      handle: session.handle || '',
      accessJwt: session.accessJwt,
      refreshJwt: session.refreshJwt || '',
    })

    logger.info(
      { did: session.did, handle: session.handle },
      'User authenticated successfully'
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({ error: err }, 'OAuth callback failed')
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
