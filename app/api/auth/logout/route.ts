import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/atproto/session'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'auth-logout' })

export async function POST() {
  try {
    logger.info('User logging out')
    await clearSession()
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({ error: err }, 'Logout failed')
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
