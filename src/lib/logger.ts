import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
})

/**
 * Create a child logger with additional context
 *
 * @example
 * const serviceLogger = createLogger({ service: 'circle-service' })
 * serviceLogger.info({ circleId }, 'Circle created')
 */
export const createLogger = (context: Record<string, string>) => {
  // Note from dev: changed context from Record<string, any> to Record<string, string>
  // to fix lint errors. Will need to use specific type in future
  return logger.child(context)
}

/**
 * Redact sensitive data from logs
 */
export const redactSensitive = (data: Record<string, string>) => {
  // Note from dev: changed data from Record<string, any> to Record<string, string>
  // to fix lint errors. Will need to use specific type in future
  const redacted = { ...data }

  // Redact tokens
  if (redacted.accessToken) redacted.accessToken = '[REDACTED]'
  if (redacted.refreshToken) redacted.refreshToken = '[REDACTED]'
  if (redacted.sessionToken) redacted.sessionToken = '[REDACTED]'

  // Redact private keys
  if (redacted.privateKey) redacted.privateKey = '[REDACTED]'

  // Shorten DIDs in production
  if (!isDevelopment && redacted.did && typeof redacted.did === 'string') {
    redacted.did = redacted.did.substring(0, 15) + '...'
  }

  return redacted
}
