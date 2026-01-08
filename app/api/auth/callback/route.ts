import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/atproto/oauth'
import { setSession } from '@/lib/atproto/session'
import { getProfile } from '@/lib/atproto/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'auth-callback' })

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      )
    }

    logger.info('Processing OAuth callback')

    const client = await getOAuthClient()

    // Build callback URL with code and state
    const params = new URLSearchParams()
    params.set('code', code)
    if (state) {
      params.set('state', state)
    }

    const result = await client.callback(params)

    const { session } = result
    const did = session.did

    // Fetch user profile to get handle using the authenticated session
    const tokenInfo = await session.getTokenInfo()
    const profile = await getProfile(did)
    const handle = profile.handle

    await setSession({
      did,
      handle,
      accessJwt: tokenInfo.sub, // Store the DID as access identifier
      refreshJwt: '', // OAuth client handles refresh automatically
    })

    logger.info({ did, handle }, 'User authenticated successfully')

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({ error: err }, 'OAuth callback failed')
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
