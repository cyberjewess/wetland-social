import type { SimpleStore } from '@atproto-labs/simple-store'
import Redis from 'ioredis'
import { createLogger } from '../logger'

const logger = createLogger({ service: 'redis-store' })

/**
 * Redis-based store for OAuth state and sessions
 * Persists data across server restarts and Next.js hot reloads
 *
 * Production-ready implementation with:
 * - Connection pooling
 * - Error handling
 * - Automatic reconnection
 * - TTL for automatic cleanup
 */
export function createRedisStore<T extends NonNullable<unknown> | null>(
  storeName: string,
  redis: Redis,
  ttlSeconds: number = 3600 // 1 hour default TTL
): SimpleStore<string, T> {
  const keyPrefix = `oauth:${storeName}:`

  return {
    get: async (key: string) => {
      try {
        const fullKey = `${keyPrefix}${key}`
        const data = await redis.get(fullKey)

        if (!data) {
          logger.debug({ key, storeName }, 'Key not found in Redis')
          return undefined
        }

        const parsed = JSON.parse(data) as T
        logger.debug({ key, storeName }, 'Retrieved from Redis')
        return parsed
      } catch (err) {
        logger.error({ error: err, key, storeName }, 'Failed to get from Redis')
        throw err
      }
    },

    set: async (key: string, value: T) => {
      try {
        const fullKey = `${keyPrefix}${key}`
        const serialized = JSON.stringify(value)

        // Set with TTL for automatic cleanup
        await redis.setex(fullKey, ttlSeconds, serialized)

        logger.debug({ key, storeName, ttl: ttlSeconds }, 'Saved to Redis')
      } catch (err) {
        logger.error({ error: err, key, storeName }, 'Failed to set in Redis')
        throw err
      }
    },

    del: async (key: string) => {
      try {
        const fullKey = `${keyPrefix}${key}`
        await redis.del(fullKey)

        logger.debug({ key, storeName }, 'Deleted from Redis')
      } catch (err) {
        logger.error(
          { error: err, key, storeName },
          'Failed to delete from Redis'
        )
        throw err
      }
    },
  }
}

/**
 * Create a Redis client instance
 * Handles connection errors gracefully
 */
export function createRedisClient(url: string): Redis {
  const redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    reconnectOnError(err) {
      const targetError = 'READONLY'
      if (err.message.includes(targetError)) {
        // Reconnect on READONLY errors
        return true
      }
      return false
    },
  })

  redis.on('connect', () => {
    logger.info('Connected to Redis')
  })

  redis.on('error', err => {
    logger.error({ error: err }, 'Redis connection error')
  })

  redis.on('ready', () => {
    logger.info('Redis client ready')
  })

  redis.on('reconnecting', () => {
    logger.warn('Reconnecting to Redis...')
  })

  return redis
}
