# ADR 002: Observability & Logging Strategy

**Date**: 2026-01-08
**Status**: Accepted

## Context

Debugging issues in a distributed system (client, Next.js server, AT Protocol PDS) requires comprehensive logging. We need to trace user actions, API calls, errors, and performance issues across all layers of the application.

Without good logging:
- Debugging production issues is difficult
- User-reported bugs are hard to reproduce
- Performance bottlenecks are unclear
- PDS communication failures are opaque

## Decision

We will implement **structured logging** throughout all layers of the application with the following principles:

### 1. Logging Library

Use a structured logging library (e.g., `pino` or `winston`) instead of `console.log`:

```typescript
// ❌ BAD
console.log('User created circle:', circleId)

// ✅ GOOD
logger.info({ circleId, userId, memberCount }, 'Circle created successfully')
```

**Benefits**:
- Structured JSON output for log aggregation
- Log levels (debug, info, warn, error)
- Contextual metadata in every log
- Performance (fast serialization)

### 2. Log Levels

**Development**:
- `debug` - Detailed flow through the system (e.g., "Entering createCircle service")
- `info` - Significant user actions (e.g., "User signed in", "Circle created")
- `warn` - Recoverable issues (e.g., "Handle resolution slow", "Retrying PDS request")
- `error` - Failures requiring attention (e.g., "Failed to create circle", "PDS timeout")

**Production**:
- Set to `info` by default
- Enable `debug` via environment variable for troubleshooting

### 3. What to Log

#### Domain Layer
Log all validation failures with context:
```typescript
logger.warn(
  { text, length: graphemeCount, limit: 300 },
  'Post text exceeds grapheme limit'
)
```

#### Infrastructure Layer (PDS Communication)
Log every AT Protocol call with timing:
```typescript
logger.info(
  { did, collection: 'app.wland.circle', duration: endTime - startTime },
  'PDS listRecords completed'
)
```

Log PDS errors with full context:
```typescript
logger.error(
  { did, uri, error: err.message, stack: err.stack },
  'Failed to create circle record in PDS'
)
```

#### Application Layer (Services)
Log user actions and orchestration:
```typescript
logger.info(
  { userId, circleId, memberCount },
  'Circle creation flow started'
)
```

#### API Routes
Log all requests with correlation IDs:
```typescript
logger.info(
  { method, path, correlationId, userId },
  'API request received'
)
```

### 4. Correlation IDs

Every request gets a unique correlation ID that flows through all logs:

```typescript
// Middleware adds correlation ID to request
req.correlationId = generateId()

// All logs include it
logger.info({ correlationId: req.correlationId, ... }, 'Processing request')
```

This allows tracing a single user action through:
1. API route
2. Service layer
3. Domain validation
4. PDS communication
5. Response

### 5. Performance Metrics

Log slow operations:
```typescript
const start = Date.now()
const result = await pdsClient.listRecords(...)
const duration = Date.now() - start

if (duration > 1000) {
  logger.warn({ duration, did, collection }, 'Slow PDS query detected')
}
```

### 6. Error Context

Always include:
- Error message
- Stack trace
- User ID (if available)
- Request context
- State at time of error

```typescript
try {
  await createCircle(circle)
} catch (err) {
  logger.error({
    error: err.message,
    stack: err.stack,
    userId: session.did,
    circle: { name: circle.name, memberCount: circle.members.length },
    correlationId
  }, 'Circle creation failed')
  throw err
}
```

### 7. Sensitive Data

**Never log**:
- Session tokens
- Private keys
- Full DIDs in production (use first 10 chars: `did:plc:abcd...`)
- User passwords or secrets

**Redact sensitive fields**:
```typescript
logger.info({
  userId: did.substring(0, 15) + '...',
  sessionToken: '[REDACTED]'
}, 'User authenticated')
```

### 8. Log Output

**Development**:
- Pretty-printed to console for readability
- Color-coded by level
- Output to stdout

**Production**:
- JSON format for log aggregation (e.g., CloudWatch, Datadog)
- Output to stdout (captured by Docker)
- Ship to log aggregation service

### 9. Implementation Pattern

Create logger utility in `src/lib/logger.ts`:

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined
})

// Helper for creating child loggers with context
export const createLogger = (context: Record<string, any>) => {
  return logger.child(context)
}
```

Use in services:
```typescript
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'circle-service' })

export async function createCircle(circle: Circle) {
  const correlationId = generateId()
  logger.info({ correlationId, circleName: circle.name }, 'Creating circle')

  try {
    // ... implementation
    logger.info({ correlationId, circleId }, 'Circle created successfully')
  } catch (err) {
    logger.error({ correlationId, error: err.message }, 'Circle creation failed')
    throw err
  }
}
```

## Consequences

### Positive
- **Easy debugging**: Trace user actions through entire system
- **Performance insights**: Identify slow operations
- **Error diagnosis**: Full context for every failure
- **Production monitoring**: JSON logs ready for aggregation
- **Compliance**: Redaction of sensitive data

### Negative
- **Log volume**: Verbose logging increases storage costs
- **Performance overhead**: Logging adds slight latency (minimized with pino)
- **Maintenance**: Need to keep logs meaningful and up-to-date

### Mitigation
- Use log levels to control verbosity
- Rotate logs and set retention policies
- Monitor log volume and adjust as needed
- Use pino for fast serialization (minimal overhead)

## Alternatives Considered

### Alternative 1: console.log everywhere
- **Rejected**: Unstructured, no log levels, difficult to parse

### Alternative 2: Application Performance Monitoring (APM) only
- **Considered**: Tools like Sentry, New Relic
- **Decision**: Use logging PLUS APM for comprehensive observability
- APM for errors and performance
- Logs for detailed tracing and debugging

### Alternative 3: Minimal logging
- **Rejected**: Makes debugging production issues extremely difficult
- Cost of debugging outweighs cost of logging

## Implementation Phases

### Phase 1 (Current)
- Add pino dependency
- Create logger utility
- Document logging strategy

### Phase 2
- Add logging to OAuth flow
- Log PDS communication

### Phase 3
- Add logging to domain validation
- Log circle/post operations

### Phase 4+
- Add correlation IDs to all requests
- Performance metrics for slow operations
- Log aggregation setup (production)

## References

- [Pino - Fast Node.js Logger](https://github.com/pinojs/pino)
- [12-Factor App: Logs](https://12factor.net/logs)
- [Google Cloud Logging Best Practices](https://cloud.google.com/logging/docs/best-practices)
- [Structured Logging](https://www.honeycomb.io/blog/structured-logging-and-your-team)
