import { NextResponse } from 'next/server'
import { createRedisClient } from '@/lib/atproto/redis-store'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'health' })

export async function GET() {
  const health: {
    status: 'ok' | 'degraded'
    redis?: 'connected' | 'disconnected' | 'not_configured'
    timestamp: string
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }

  // Check Redis connection if configured
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    try {
      const redis = createRedisClient(redisUrl)
      await redis.ping()
      health.redis = 'connected'
      redis.disconnect()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logger.error({ error: errorMessage, redisUrl: redisUrl.replace(/:[^:]*@/, ':***@') }, 'Redis health check failed')
      health.redis = 'disconnected'
      health.status = 'degraded'
    }
  } else {
    health.redis = 'not_configured'
  }

  const statusCode = health.status === 'ok' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
