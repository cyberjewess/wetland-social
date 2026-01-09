import { NextResponse } from 'next/server'
import { createRedisClient } from '@/lib/atproto/redis-store'

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
      health.redis = 'disconnected'
      health.status = 'degraded'
    }
  } else {
    health.redis = 'not_configured'
  }

  const statusCode = health.status === 'ok' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
