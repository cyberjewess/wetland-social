# Wetland Social

A stratified social media app built on AT Protocol where posts have different visibility levels: Circle, Radius, Bioregion, and Global.

## Overview

Wetland Social reimagines social media through stratified visibility layers. Instead of a single public/private binary, posts exist at different scales of community.

**MVP Features**:
- OAuth authentication with Bluesky accounts
- Two posting levels: **Circle** (trusted groups) and **Global** (public)
- Two distinct feeds demonstrating stratification
- Text-only posts (max 300 graphemes)
- Create up to 5 circles, bootstrap members from Bluesky social graph
- Forest green theme with light/dark mode

**Future**: Radius (geofence) and Bioregion (ecosystem) levels.

## Quick Start

### With Docker (Recommended)

Docker Compose runs Next.js + Redis for OAuth state persistence.

```bash
# Start development environment (Next.js + Redis)
make dev

# Start only Redis (for local npm run dev)
make redis

# Run tests
make test

# View logs
make logs

# Stop containers
make stop
```

### Without Docker

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   OAUTH_CLIENT_ID=http://localhost:3000/client-metadata.json
   OAUTH_PRIVATE_KEY_PATH=keys/private-key-pkcs8.pem
   SESSION_SECRET=your-random-secret-key-here
   NEXT_PUBLIC_PDS_URL=https://bsky.social

   # Redis (optional - leave empty to use in-memory storage)
   # Docker Compose: redis://redis:6379
   # Local Redis: redis://localhost:6379
   REDIS_URL=
   ```

3. Generate OAuth keys (for Phase 2):
   ```bash
   # Generate ES256 key pair
   openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem
   openssl ec -in private-key.pem -pubout -out public-key.pem
   ```

## Project Structure

```
wetland-social/
├── src/
│   ├── domain/                 # Pure business logic (unit testable)
│   ├── lib/
│   │   ├── atproto/           # AT Protocol infrastructure
│   │   │   └── repositories/  # PDS communication
│   │   ├── services/          # Application orchestration
│   │   └── hooks/             # React Query hooks
│   ├── components/            # React components
│   └── types/                 # TypeScript types
├── app/                       # Next.js App Router
│   ├── api/                   # API routes
│   └── (auth)/                # Authentication pages
├── docs/
│   ├── plans/                 # Implementation plans
│   └── adrs/                  # Architecture Decision Records
├── lexicons/                  # Custom AT Protocol lexicons
├── public/                    # Static assets
└── docker-compose.yml         # Docker configuration
```

## Architecture

Wetland Social uses a **layered architecture** for testability:

1. **Domain Layer** (`src/domain/`) - ✅ Pure business logic, no external dependencies
   - Post & Circle entities with validation
   - 90 unit tests, 100% coverage of business rules
   - DID validation, grapheme counting
2. **Infrastructure Layer** (`src/lib/atproto/`) - AT Protocol integration
3. **Application Layer** (`src/lib/services/`) - Service orchestration
4. **Presentation Layer** (`app/`, `src/components/`) - UI components

See [ADR 001](docs/adrs/001-layered-architecture.md) for details.

## Development Workflow

See [AGENTS.md](AGENTS.md) for the complete development workflow.

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feat/description
   ```

2. Make changes and commit frequently (~3-4 files):
   ```bash
   git add .
   git commit -m "Add feature description"
   ```

3. Push and create PR for review:
   ```bash
   git push origin feat/description
   ```

### Docker Commands

```bash
make dev      # Start development environment (Next.js + Redis)
make redis    # Start only Redis (for local npm run dev)
make build    # Build Docker images
make prod     # Start production environment
make stop     # Stop all containers
make logs     # View container logs
make test     # Run unit tests in Docker
make clean    # Remove containers and volumes
make help     # Show all commands
```

**Note**: Docker Compose provides Redis for OAuth state persistence, eliminating hot reload issues during development.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**Testing Strategy**:
- **Unit tests** for domain layer (pure logic, no mocks)
- **Integration tests** for infrastructure (Phase 8)
- **E2E tests** for critical flows (post-MVP)

## Custom Lexicons

Wetland Social extends AT Protocol with custom lexicons under `app.wland.*`:

- **`app.wland.post`** - Posts with level metadata (global, circle)
- **`app.wland.circle`** - Trusted groups of users
- **`app.wland.defs`** - Shared type definitions

See [docs/plans/mvp.md](docs/plans/mvp.md) for lexicon specifications.

## API Endpoints

- `GET /api/health` - Health check with Redis connectivity status
- `POST /api/auth/[...atproto]` - OAuth authentication (Phase 2)

## Observability & Logging

Wetland Social implements comprehensive logging for debugging and tracing:

- **Structured logs** with consistent format across all layers
- **Request tracing** with correlation IDs
- **Error context** includes stack traces and relevant state
- **Performance metrics** for slow operations
- **User action logs** for debugging user-reported issues

All logs are output to stdout in development and can be viewed with `make logs`.

## Deployment

### Production with Docker

1. Create `.env.production` with production values
2. Deploy:
   ```bash
   make prod
   ```

3. Check health:
   ```bash
   curl http://localhost:3000/api/health
   ```

See [docs/plans/mvp.md](docs/plans/mvp.md#docker-configuration) for production setup details.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling with forest green theme
- **AT Protocol** - Decentralized social protocol
- **React Query** - Server state management
- **Zod** - Schema validation
- **Jest** - Unit testing
- **Docker + Redis** - Containerization and OAuth state persistence

## Contributing

1. Check [docs/plans/mvp.md](docs/plans/mvp.md) for current phase
2. Follow workflow in [AGENTS.md](AGENTS.md)
3. Keep PRs small (~200-500 lines)
4. Write tests alongside domain logic
5. Update documentation with code changes

## License

MIT

## Links

- **Domain**: [wland.app](https://wland.app)
- **GitHub**: [github.com/cyberjewess/wetland-social](https://github.com/cyberjewess/wetland-social)
- **AT Protocol**: [atproto.com](https://atproto.com)
- **Bluesky**: [bsky.app](https://bsky.app)
