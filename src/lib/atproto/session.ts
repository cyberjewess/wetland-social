import { cookies } from 'next/headers'
import { createLogger, redactSensitive } from '../logger'

const logger = createLogger({ service: 'session' })

const SESSION_COOKIE_NAME = 'wetland_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface Session {
  did: string
  handle: string
  accessJwt: string
  refreshJwt: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session
    logger.debug(redactSensitive({ did: session.did, handle: session.handle }), 'Session retrieved')
    return session
  } catch (err) {
    logger.error({ error: err }, 'Failed to parse session cookie')
    return null
  }
}

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies()

  logger.info(
    redactSensitive({ did: session.did, handle: session.handle }),
    'Setting session cookie'
  )

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  logger.info('Clearing session cookie')
  cookieStore.delete(SESSION_COOKIE_NAME)
}
