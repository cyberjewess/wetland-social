import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/atproto/oauth'
import { setSession } from '@/lib/atproto/session'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'auth-callback' })

export async function POST(request: NextRequest) {
  try {
    const { code, state, iss } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      )
    }

    logger.info(
      { code: code.substring(0, 20), state, iss },
      'Processing OAuth callback'
    )

    const client = await getOAuthClient()

    // Build callback parameters with all query params from OAuth redirect
    const params = new URLSearchParams()
    params.set('code', code)
    if (state) {
      params.set('state', state)
    }
    if (iss) {
      params.set('iss', iss)
    }

    logger.info({ paramsString: params.toString() }, 'Calling OAuth callback')

    const result = await client.callback(params)

    const { session } = result
    const did = session.did

    // Fetch user profile to get handle using the authenticated session
    // The OAuth session includes fetch() method that automatically adds auth headers
    const profileResponse = await session.fetchHandler(
      `https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=${did}`,
      { method: 'GET' }
    )
    const profileData = await profileResponse.json()
    const handle = profileData.handle

    // Note: OAuth client manages tokens internally
    // We store the DID and handle for session management
    // The actual API calls will use the OAuth client's authenticated agent
    await setSession({
      did,
      handle,
      accessJwt: did, // Placeholder - OAuth client handles actual tokens
      refreshJwt: '', // OAuth client handles refresh
    })

    logger.info({ did, handle }, 'User authenticated successfully')

    return NextResponse.json({ success: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined
    logger.error(
      { error: errorMessage, stack: errorStack },
      'OAuth callback failed'
    )
    return NextResponse.json(
      { error: 'Authentication failed', details: errorMessage },
      { status: 500 }
    )
  }
}
