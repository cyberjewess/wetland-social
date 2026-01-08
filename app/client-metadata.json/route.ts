import { NextResponse } from 'next/server'

/**
 * OAuth 2.0 Client Metadata endpoint
 * Dynamically generates client metadata based on environment
 * This allows the same build to work in dev (ngrok) and prod (wland.app)
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const metadata = {
    client_id: `${baseUrl}/client-metadata.json`,
    client_name: 'Wetland Social',
    client_uri: baseUrl,
    logo_uri: `${baseUrl}/logo.png`,
    redirect_uris: [`${baseUrl}/auth/callback`],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    scope: 'atproto transition:generic',
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: 'ES256',
    jwks_uri: `${baseUrl}/jwks.json`,
    application_type: 'web',
    dpop_bound_access_tokens: true,
  }

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      // Cache for 1 hour in production, no cache in development
      'Cache-Control':
        process.env.NODE_ENV === 'production'
          ? 'public, max-age=3600'
          : 'no-cache',
    },
  })
}
