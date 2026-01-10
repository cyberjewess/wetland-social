# Wetland-Social MVP Implementation Plan

## Implementation Progress

### Phase Checklist

- [x] **Phase 1**: Project Setup, Dependencies, & Docker (COMPLETED)
  - [x] Initialize Next.js 15 with TypeScript and App Router
  - [x] Install dependencies (atproto, React Query, Zod, Jest)
  - [x] Configure project (Tailwind forest green theme, Jest, Prettier)
  - [x] Create docs/ folder and ADR for layered architecture
  - [x] Copy plan to docs/plans/mvp.md
  - [x] Create Docker setup (Dockerfile, docker-compose, Makefile)
  - [x] Create health check endpoint at /api/health
  - [x] Create folder structure (domain/, lib/atproto/repositories/, lib/services/)
  - [x] Update README with setup instructions
  - [x] Organize OAuth keys in keys/ directory
  - [x] Push Phase 1 to GitHub and create PR for review

- [x] **Phase 2**: OAuth Authentication with Bluesky (IN PROGRESS)
  - [x] Generate JWKS and client metadata
  - [x] Create OAuth client configuration
  - [x] Create session management utilities
  - [x] Build login page with "Sign in with Bluesky"
  - [x] Build OAuth callback handler
  - [x] Create API routes (authorize, callback, logout, me)
  - [x] Build useAuth hook for auth state
  - [ ] Test OAuth flow end-to-end
  - [ ] Push Phase 2 to GitHub and create PR for review
- [ ] **Phase 3**: Domain Layer & Lexicons
- [ ] **Phase 4**: Circle Management (Infrastructure + UI)
- [ ] **Phase 5**: Post Creation (Infrastructure + UI)
- [ ] **Phase 6**: Feed Display (Circle + Global, Paginated)
- [ ] **Phase 7**: UI Polish, Theming (Forest Green + Light/Dark Mode)
- [ ] **Phase 8**: Integration Testing & Documentation Finalization

---

## Project Overview

**Wetland-social** is a stratified social media app built on AT Protocol (atproto) where every post is published at a specific visibility level. This plan covers the MVP implementation.

### MVP Scope

- **Posting Levels**: Circle only for MVP (Radius and Bioregion deferred)
- **Posts**: Text-only, no media
- **Auth**: AT Protocol PDS (Bluesky-style OAuth) - users sign in with existing Bluesky identities
- **Feeds**: Two feeds to demonstrate stratification:
  - **Circle Feed**: Custom `app.wland.post` records - your circle posts + posts from circles you're in
  - **Global Feed**: Native Bluesky timeline - standard `app.bsky.feed.post` from your following list
- **Features**: Create circle posts, manage circles (up to 5), view circle and Bluesky feeds
- **No**: Likes, follows, reactions in MVP

### Core Concept: Bluesky + Stratified Layers

**Wetland is Bluesky + additional stratified posting**:
1. **Global = Native Bluesky** (use existing `app.bsky.feed.post`, no custom lexicon needed)
2. **Circle** (MVP) - Custom `app.wland.post` for trusted group posts (up to 5 circles, modifiable anytime)
3. **Radius** (Future) - Custom `app.wland.post` with geofence metadata (modifiable once/day)
4. **Bioregion** (Future) - Custom `app.wland.post` with bioregion metadata (modifiable once/day)

This approach:
- Maintains full Bluesky compatibility (global posts are native Bluesky posts)
- Adds stratified layers on top via custom lexicons
- Users can post to both Bluesky (global) and Wetland circles seamlessly

---

## Tech Stack

### Core Framework
- **Next.js 15** with App Router (TypeScript)
- **React 19** for UI components
- **TailwindCSS** for styling

### AT Protocol Integration
- `@atproto/api` - Core AT Protocol client SDK
- `@atproto/oauth-client-node` - OAuth authentication for Next.js server-side
- `@atproto/lexicon` - Working with custom lexicons
- `@atproto/repo` - Repository record management

### Supporting Libraries
- `zod` - Schema validation for forms and AT Protocol records
- `date-fns` - Timestamp handling
- `@tanstack/react-query` - Server state management for posts/feeds

### Development Tools
- `@atproto/dev-env` - Local PDS testing environment (optional for MVP)
- `prettier` - Code formatting
- `eslint` - Linting with Next.js config

---

## Custom Lexicon Design

We need **two** custom lexicons under the NSID namespace `app.wland.*` (using your domain wland.app):

### 1. Post Lexicon: `app.wland.post`

**Purpose**: Circle-level posts (NOT global - global uses native `app.bsky.feed.post`)

**Record Structure**:
```typescript
{
  text: string;              // Max 300 graphemes
  circleRef: string;         // AT-URI to circle (required)
  createdAt: string;         // ISO datetime
  langs?: string[];          // Optional language codes
  facets?: Facet[];          // Rich text (mentions, links) - future
}
```

**Key Properties**:
- Uses TID (Timestamp Identifier) as record key
- Stored in user's repository at: `at://did:plc:{userDid}/app.wland.post/{tid}`
- Each post record is **owned by the user who created it** (stored in their DID's repo)
- **Always** references a circle (no "level" field - level is implicit by lexicon type)
- For global posts, users create native `app.bsky.feed.post` records instead

### 2. Circle Lexicon: `app.wland.circle`

**Purpose**: Define trusted groups of users

**Record Structure**:
```typescript
{
  name: string;              // Max 50 graphemes
  description?: string;      // Max 200 graphemes (optional)
  members: string[];         // Array of DIDs (max 1000)
  createdAt: string;         // ISO datetime
  updatedAt: string;         // ISO datetime
}
```

**Constraints**:
- Maximum 5 circles per user (enforced in application logic)
- Members identified by DID (e.g., `did:plc:abcd1234...`)
- Stored in user's repository at: `at://did:plc:{userDid}/app.wland.circle/{tid}`
- Each circle record is **owned by the user who created it** (stored in their DID's repo)
- **Important**: Circles are app-layer visibility hints, NOT enforced access control boundaries

### 3. Definitions Lexicon: `app.wland.defs`

**Purpose**: Reusable type definitions

**Exports**:
- `circleRef` - Reference to circle records (AT-URI + CID)

**Note**: No `postVisibility` enum needed since posting level is determined by lexicon type:
- `app.bsky.feed.post` = Global (Bluesky native)
- `app.wland.post` = Circle (Wetland custom)

---

## Architecture: Layered Design for Testability

To maximize testability and separation of concerns, we'll use a **layered architecture**:

1. **Domain Layer** (`src/domain/`) - Pure business logic, atproto-agnostic
   - Post validation, circle rules, level constraints
   - No external dependencies, easily unit testable

2. **Infrastructure Layer** (`src/lib/atproto/`) - AT Protocol implementation
   - PDS communication, record serialization
   - Implements domain interfaces

3. **Application Layer** (`src/lib/services/`) - Orchestration
   - Coordinates domain + infrastructure
   - Transaction boundaries

4. **Presentation Layer** (`src/app/`, `src/components/`) - UI
   - React components, hooks
   - Integration tests only

**Testing Strategy**:
- **Unit tests** for domain layer (no mocks, pure logic)
- **Integration tests** for infrastructure layer (optional, use real or mock PDS)
- **E2E tests** for critical user flows (post-MVP)

This allows us to write unit tests alongside each phase's domain logic.

See [ADR 001](../adrs/001-layered-architecture.md) for detailed rationale.

---

## Project File Structure

```
wetland-social/
├── docs/                                # Documentation
│   ├── plans/
│   │   └── mvp.md                       # This plan
│   └── adrs/                            # Architecture Decision Records
│       └── 001-layered-architecture.md
│
├── src/
│   ├── domain/                          # Business logic (unit testable)
│   │   ├── post/
│   │   │   ├── post.ts                  # Post entity & validation
│   │   │   ├── post.test.ts             # Unit tests
│   │   │   └── postLevel.ts             # Level types & rules
│   │   ├── circle/
│   │   │   ├── circle.ts                # Circle entity & validation
│   │   │   ├── circle.test.ts           # Unit tests
│   │   │   └── circleRules.ts           # Max 5 rule, member validation
│   │   └── shared/
│   │       ├── did.ts                   # DID validation
│   │       └── grapheme.ts              # Grapheme counting
│   │
│   ├── lib/
│   │   ├── atproto/                     # Infrastructure layer
│   │   │   ├── client.ts                # AtpAgent initialization
│   │   │   ├── oauth.ts                 # OAuth config
│   │   │   ├── session.ts               # Session management
│   │   │   └── repositories/            # PDS repositories
│   │   │       ├── postRepository.ts    # Post CRUD via PDS
│   │   │       └── circleRepository.ts  # Circle CRUD via PDS
│   │   ├── services/                    # Application layer
│   │   │   ├── postService.ts           # Post orchestration
│   │   │   └── circleService.ts         # Circle orchestration
│   │   ├── hooks/                       # React Query hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── usePosts.ts
│   │   │   └── useCircles.ts
│   │   └── utils/
│   │       └── formatting.ts            # Date/text helpers
│   │
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with providers
│   │   ├── page.tsx                      # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx           # "Sign in with Bluesky"
│   │   │   └── callback/page.tsx        # OAuth callback handler
│   │   ├── (app)/
│   │   │   ├── layout.tsx               # Authenticated layout
│   │   │   ├── feed/
│   │   │   │   ├── layout.tsx           # Feed tabs layout
│   │   │   │   ├── circle/page.tsx      # Circle feed
│   │   │   │   └── global/page.tsx      # Global feed
│   │   │   ├── compose/page.tsx         # Create new post
│   │   │   └── circles/
│   │   │       ├── page.tsx             # List circles (max 5)
│   │   │       └── new/page.tsx         # Create ONE circle at a time
│   │   └── api/
│   │       ├── auth/[...atproto]/route.ts  # OAuth routes
│   │       └── health/route.ts          # Health check endpoint
│   │
│   ├── components/
│   │   ├── ui/                          # Base UI components (forest green theme)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── select.tsx
│   │   ├── post/
│   │   │   ├── PostCard.tsx             # Display single post
│   │   │   ├── PostComposer.tsx         # Create post form
│   │   │   ├── LevelSelector.tsx        # Global/Circle selector
│   │   │   └── PostList.tsx             # Post feed (50 posts/page)
│   │   ├── circle/
│   │   │   ├── CircleCard.tsx           # Display circle
│   │   │   ├── CircleForm.tsx           # Create ONE circle
│   │   │   └── MemberSelector.tsx       # Bootstrap from Bluesky graph
│   │   └── theme/
│   │       └── ThemeToggle.tsx          # Light/dark mode toggle
│   │
│   └── types/
│       ├── atproto.ts                   # AT Protocol types
│       └── wetland.ts                   # App-specific types
│
├── lexicons/                            # Lexicon schemas (source of truth)
│   └── app/wland/
│       ├── post.json
│       ├── circle.json
│       └── defs.json
│
├── public/
│   ├── jwks.json                        # OAuth public key (generated)
│   └── client-metadata.json             # OAuth metadata
│
├── .env.local                           # Environment config (local dev)
├── .env.example                         # Template for environment variables
├── Dockerfile                           # Multi-stage Docker build
├── .dockerignore                        # Docker ignore patterns
├── docker-compose.yml                   # Local development
├── docker-compose.prod.yml              # Production deployment
├── Makefile                             # Simplified Docker commands
├── README.md                            # User-facing documentation
├── AGENTS.md                            # Development workflow
├── jest.config.js                       # Jest configuration for unit tests
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Implementation Phases

Following the workflow in [AGENTS.md](AGENTS.md), we'll execute these phases sequentially. **Each phase will:**
1. Create a feature branch from `main`
2. Implement the phase (with unit tests for domain logic)
3. Push to GitHub
4. Create a PR for human review
5. Merge to `main` after approval

This keeps PRs small and reviewable (~200-400 lines each).

### Phase 1: Project Setup, Dependencies, & Docker
**Branch**: `feat/phase-1-setup`
**Estimated files**: ~15
**PR Size**: Small (~250 lines)

#### Tasks

1. **Initialize Next.js 15**
   - Create Next.js 15 app with TypeScript and App Router
   - Install dependencies: `@atproto/api`, `@atproto/oauth-client-node`, `@tanstack/react-query`, `zod`, `date-fns`
   - Install dev dependencies: `jest`, `@testing-library/react`, `@testing-library/jest-dom`

2. **Configure Project**
   - `next.config.js` - Base Next.js config
   - `tailwind.config.ts` - Forest green color scheme, light/dark mode support
   - `tsconfig.json` - Path aliases (`@/`)
   - `jest.config.js` - Unit test configuration
   - ESLint and Prettier configs

3. **Docker Setup**
   - `Dockerfile` with multi-stage build (deps → builder → runner)
   - `.dockerignore` file
   - `docker-compose.yml` for local dev (hot reload)
   - `docker-compose.prod.yml` for production
   - **Makefile** with commands:
     ```makefile
     dev: docker-compose up
     build: docker-compose build
     prod: docker-compose -f docker-compose.prod.yml up -d
     stop: docker-compose down
     logs: docker-compose logs -f
     test: docker-compose run app npm test
     ```

4. **Documentation**
   - Create `docs/` folder
   - Copy this plan to `docs/plans/mvp.md`
   - Create `docs/adrs/001-layered-architecture.md` (ADR for domain/infrastructure split)
   - Update README with setup instructions

5. **Environment & Health Check**
   - `.env.example` template
   - Create `/api/health` endpoint (returns `{ status: "ok" }`)

6. **Folder Structure**
   - Create empty directories: `src/domain/`, `src/lib/atproto/repositories/`, `src/lib/services/`

**Deliverables**:
- Working Next.js app that runs in Docker
- `make dev` starts development environment
- Health check responds at `localhost:3000/api/health`
- Documented in README

**PR Title**: `Phase 1: Project setup with Docker and layered architecture`

---

### Phase 2: OAuth Authentication with Bluesky
**Branch**: `feat/phase-2-auth`
**Estimated files**: ~10
**PR Size**: Medium (~350 lines)

**Goal**: Users can sign in with their existing Bluesky accounts

#### Tasks

1. **Generate OAuth Keys**
   - Generate ES256 key pair for client authentication
   - Store private key securely (environment variable)
   - Export public key to `/public/jwks.json`

2. **OAuth Configuration** - [src/lib/atproto/oauth.ts](src/lib/atproto/oauth.ts)
   - Initialize `NodeOAuthClient` from `@atproto/oauth-client-node`
   - Configure callback URL: `http://localhost:3000/callback`
   - Set up client metadata for Bluesky PDS

3. **Client Metadata** - `/public/client-metadata.json`
   ```json
   {
     "client_id": "http://localhost:3000/client-metadata.json",
     "client_name": "Wetland Social",
     "redirect_uris": ["http://localhost:3000/callback"],
     "grant_types": ["authorization_code", "refresh_token"],
     "response_types": ["code"],
     "token_endpoint_auth_method": "private_key_jwt",
     "jwks_uri": "http://localhost:3000/jwks.json"
   }
   ```

4. **Session Management** - [src/lib/atproto/session.ts](src/lib/atproto/session.ts)
   - Store session tokens in HTTP-only cookies
   - Implement `getSession()`, `setSession()`, `clearSession()`
   - Add token refresh logic

5. **Login Page** - [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx)
   - "Sign in with Bluesky" button
   - Redirect to OAuth authorization URL
   - Handle loading states

6. **OAuth Callback** - [src/app/(auth)/callback/page.tsx](src/app/(auth)/callback/page.tsx)
   - Handle OAuth callback with authorization code
   - Exchange code for access token
   - Store session and redirect to `/feed`
   - Error handling for failed auth

7. **API Routes** - [src/app/api/auth/[...atproto]/route.ts](src/app/api/auth/[...atproto]/route.ts)
   - OAuth endpoints handler
   - Session validation middleware

8. **Auth Hook** - [src/lib/hooks/useAuth.ts](src/lib/hooks/useAuth.ts)
   - Expose auth state to components
   - `user`, `isAuthenticated`, `isLoading`, `signOut()`

**Deliverables**:
- Users can click "Sign in with Bluesky" and complete OAuth flow
- Session persists across page refreshes
- Sign out clears session

**PR Title**: `Phase 2: OAuth authentication with Bluesky PDS`

---

### Phase 1.5: Docker Compose + Redis for OAuth State
**Branch**: `feat/phase-1.5-docker-redis`
**Estimated files**: ~8
**PR Size**: Medium (~300 lines)

**Goal**: Add Docker Compose orchestration with Redis for persistent OAuth state storage

**Why This Phase**: Phase 2 uses in-memory stores which lose OAuth state on Next.js hot reloads. Redis provides persistent storage that survives module reloads and is production-ready.

#### Tasks

1. **Docker Compose Configuration** - `docker-compose.yml`
   ```yaml
   version: '3.8'
   services:
     web:
       build: .
       ports:
         - "3000:3000"
       environment:
         - REDIS_URL=redis://redis:6379
       volumes:
         - .:/app
         - /app/node_modules
       depends_on:
         - redis
       command: npm run dev

     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
       volumes:
         - redis_data:/data

   volumes:
     redis_data:
   ```

2. **Redis Store Implementation** - [src/lib/atproto/redis-store.ts](src/lib/atproto/redis-store.ts)
   - Install `ioredis` package
   - Implement `SimpleStore<string, T>` interface using Redis
   - Handle serialization/deserialization for OAuth state/session
   - Add connection pooling and error handling

3. **Update OAuth Configuration** - [src/lib/atproto/oauth.ts](src/lib/atproto/oauth.ts)
   - Replace `createMemoryStore()` with Redis store when `REDIS_URL` is set
   - Keep in-memory fallback for environments without Redis
   - Update comments to reflect Redis as production solution

4. **Makefile Updates**
   ```makefile
   dev:
   	docker-compose up

   dev-redis:
   	docker-compose up redis

   test:
   	docker-compose run web npm test
   ```

5. **Environment Configuration**
   - Add `REDIS_URL` to `.env.example`
   - Update `.env.local` to include `REDIS_URL=redis://localhost:6379`
   - Document Redis connection string format

6. **Health Check Enhancement** - [app/api/health/route.ts](app/api/health/route.ts)
   - Add Redis connectivity check
   - Return `{ status: "ok", redis: "connected" }` or error

7. **Documentation Updates**
   - Update [docs/local-development.md](docs/local-development.md) with Docker Compose instructions
   - Document how to run with and without Docker
   - Add Redis troubleshooting section
   - Update README with `make dev` as primary dev command

8. **.dockerignore** - Add patterns to speed up builds
   ```
   node_modules
   .next
   .git
   *.md
   ```

**Deliverables**:
- `docker-compose up` starts Next.js + Redis
- OAuth state persists across hot reloads
- Health check reports Redis status
- Documented fallback to in-memory store without Redis

**Testing**:
1. Start with `docker-compose up`
2. Verify Redis connection in health check
3. Complete OAuth flow
4. Trigger hot reload (edit a file)
5. OAuth callback should still work (state persisted in Redis)
6. Stop and restart containers - OAuth sessions should persist

**PR Title**: `Phase 1.5: Add Docker Compose with Redis for OAuth persistence`

---

### Phase 3: Domain Layer & Lexicons
**Branch**: `feat/phase-3-domain`
**Estimated files**: ~12
**PR Size**: Medium (~300 lines + tests)

**Goal**: Define domain entities, business rules, and lexicon schemas

#### Tasks

1. **Domain: Circle** - [src/domain/circle/](src/domain/circle/)
   - `circle.ts` - Circle entity with validation
   - `circleRules.ts` - Max 5 circles rule, member limit (1000)
   - `circle.test.ts` - Unit tests for circle validation

2. **Domain: Post** - [src/domain/post/](src/domain/post/)
   - `post.ts` - Post entity with validation
   - `postLevel.ts` - PostLevel type (`"global" | "circle"`)
   - `post.test.ts` - Unit tests for post validation (300 grapheme limit)

3. **Domain: Shared** - [src/domain/shared/](src/domain/shared/)
   - `did.ts` - DID validation (format: `did:plc:xxx`)
   - `did.test.ts` - Unit tests
   - `grapheme.ts` - Grapheme counting utility
   - `grapheme.test.ts` - Unit tests

4. **Lexicon JSON Files** - `/lexicons/app/wland/`
   - `post.json` - Full lexicon spec for `app.wland.post`
   - `circle.json` - Full lexicon spec for `app.wland.circle`
   - `defs.json` - Shared type definitions

5. **TypeScript Types** - [src/types/wetland.ts](src/types/wetland.ts)
   - Mirror lexicon types
   - Export PostLevel, WetlandPost, Circle interfaces

**Deliverables**:
- Domain layer with NO atproto dependencies
- 100% unit test coverage for business rules
- All tests pass: `make test`

**PR Title**: `Phase 3: Domain entities, business rules, and lexicons`

---

### Phase 4: Circle Management (Infrastructure + UI)
**Branch**: `feat/phase-4-circles`
**Estimated files**: ~15
**PR Size**: Large (~450 lines)

**Goal**: Users can create up to 5 circles (one at a time) and manage members bootstrapped from Bluesky

#### Tasks

1. **Infrastructure: Circle Repository** - [src/lib/atproto/repositories/circleRepository.ts](src/lib/atproto/repositories/circleRepository.ts)
   - `listCircles(did: string)` - Query `app.wland.circle` records
   - `getCircle(uri: string)` - Fetch single circle
   - `createCircle(circle: Circle)` - Create record with TID
   - `updateCircle(uri: string, circle: Circle)` - Update record
   - `deleteCircle(uri: string)` - Delete record

2. **Infrastructure: Social Graph & Identity** - [src/lib/atproto/repositories/graphRepository.ts](src/lib/atproto/repositories/graphRepository.ts)
   - `getFollowing(did: string)` - Fetch user's Bluesky following list
   - Returns array of `{ did: string, handle: string, displayName?: string, avatar?: string }`
   - `resolveHandle(handle: string)` - Resolve handle → DID via `com.atproto.identity.resolveHandle`
   - Used for manual member entry and handle display

3. **Application: Circle Service** - [src/lib/services/circleService.ts](src/lib/services/circleService.ts)
   - Orchestrates domain validation + repository calls
   - `createCircle()` - Validates max 5 rule, then calls repo
   - `updateCircle()` - Validates, then updates
   - `deleteCircle()` - Calls repo

4. **React Query Hooks** - [src/lib/hooks/useCircles.ts](src/lib/hooks/useCircles.ts)
   - `useCircles()` - Fetch user's circles
   - `useCreateCircle()` - Mutation for creating ONE circle
   - `useUpdateCircle()` - Mutation for updating
   - `useDeleteCircle()` - Mutation for deleting

5. **UI: Circles List** - [src/app/(app)/circles/page.tsx](src/app/(app)/circles/page.tsx)
   - Display all circles (0-5)
   - Show member count
   - "+ Create Circle" button (disabled if 5 exist)
   - Edit/delete actions per circle

6. **UI: Create Circle** - [src/app/(app)/circles/new/page.tsx](src/app/(app)/circles/new/page.tsx)
   - Form: name, optional description
   - Member selector (bootstrapped from Bluesky following)
   - Validates: user has < 5 circles before submit
   - Submit → redirect to circles list

7. **Component: CircleForm** - [src/components/circle/CircleForm.tsx](src/components/circle/CircleForm.tsx)
   - Name input (max 50 graphemes)
   - Description textarea (max 200 graphemes)
   - Member selector component
   - Submit/cancel buttons

8. **Component: MemberSelector** - [src/components/circle/MemberSelector.tsx](src/components/circle/MemberSelector.tsx)
   - **Bootstrap from Bluesky**: Load following list on mount (shows handles)
   - Search/filter following list by handle
   - Select members (checkboxes) - displays handles
   - Manual entry: type handle (e.g., `@user.bsky.social`), resolve to DID
   - Display selected members as handles with avatars
   - Store DIDs internally, show handles to user

**Deliverables**:
- Users can create ONE circle at a time (max 5 total)
- Member selector bootstrapped from Bluesky social graph
- Edit/delete existing circles
- All domain validation enforced

**PR Title**: `Phase 4: Circle management with Bluesky social graph bootstrap`

**Known Issues**:
- OAuth token authentication not working - `InvalidToken` errors on API calls
- OAuth session restored from Redis but tokens appear expired/invalid
- Member selector and circle creation fail due to auth issues
- **See Phase 4.5 for fix**

---

### Phase 4.5: Fix OAuth Authentication for API Calls
**Branch**: `feat/phase-4.5-oauth-fix`
**Estimated files**: ~5
**PR Size**: Small (~150 lines)

**Goal**: Fix OAuth token authentication so circle creation and member selection work

**Problem**:
Currently, the OAuth client manages tokens internally and stores sessions in Redis. When we try to restore the OAuth session and use its `fetchHandler` for authenticated API calls, we get `InvalidToken` errors. The tokens stored in the OAuth session appear to be expired or invalid.

**Root Cause**:
- OAuth session is successfully restored from Redis
- But calling `oauthSession.fetchHandler()` directly doesn't trigger token refresh
- The wrapped fetch in `AtpAgent` might not be compatible with OAuth session's authentication flow

**Potential Solutions**:

1. **Use OAuth client's agent directly** (if it exposes one)
   - Check if `@atproto/oauth-client-node` provides a direct agent
   - Avoid wrapping fetchHandler

2. **Implement proper token refresh flow**
   - Hook into OAuth session's token refresh mechanism
   - Ensure tokens are refreshed before making API calls

3. **Alternative: Store actual JWT tokens**
   - Extract access/refresh tokens from OAuth result
   - Store them in session cookie
   - Use traditional `agent.resumeSession()` approach
   - May lose OAuth's automatic token management benefits

#### Tasks

1. **Investigate OAuth client API**
   - Read `@atproto/oauth-client-node` docs for proper agent usage
   - Check if OAuth session exposes a ready-to-use agent
   - Test token refresh behavior

2. **Fix createAuthenticatedAgent** - [src/lib/atproto/client.ts](src/lib/atproto/client.ts)
   - Implement correct approach based on investigation
   - Ensure token refresh happens automatically
   - Add better error logging for debugging

3. **Update session storage if needed** - [app/api/auth/callback/route.ts](app/api/auth/callback/route.ts)
   - If going with JWT approach, extract and store real tokens
   - Document trade-offs in comments

4. **Test authenticated operations**
   - Circle creation
   - Member selector (following list fetch)
   - Circle listing

**Deliverables**:
- OAuth authentication works for all API calls
- Circle creation succeeds
- Member selector loads following list from Bluesky
- No `InvalidToken` errors

**PR Title**: `Phase 4.5: Fix OAuth authentication for authenticated API calls`

---

### Phase 5: Post Creation (Infrastructure + UI)
**Branch**: `feat/phase-5-posts`
**Estimated files**: ~10
**PR Size**: Medium (~400 lines)

**Goal**: Users can create text posts at Global or Circle level

#### Tasks

1. **Infrastructure: Post Repository** - [src/lib/atproto/repositories/postRepository.ts](src/lib/atproto/repositories/postRepository.ts)
   - `createPost(post: Post)` - Create `app.wland.post` record with TID
   - Returns AT-URI of created post

2. **Application: Post Service** - [src/lib/services/postService.ts](src/lib/services/postService.ts)
   - Orchestrates domain validation + repository
   - `createPost()` - Validates via domain layer, creates via repo
   - Verifies circle exists if level="circle"

3. **React Query Hooks** - [src/lib/hooks/usePosts.ts](src/lib/hooks/usePosts.ts)
   - `useCreatePost()` - Mutation for creating posts
   - Invalidates feed queries on success

4. **UI: Compose Page** - [src/app/(app)/compose/page.tsx](src/app/(app)/compose/page.tsx)
   - Full-page composition UI
   - Success → redirect to appropriate feed (Circle or Global)

5. **Component: PostComposer** - [src/components/post/PostComposer.tsx](src/components/post/PostComposer.tsx)
   - Multi-line text area
   - Real-time grapheme counter (300 max)
   - Level selector integration
   - Submit button (disabled if invalid)
   - Loading/error states

6. **Component: LevelSelector** - [src/components/post/LevelSelector.tsx](src/components/post/LevelSelector.tsx)
   - Radio buttons: "Global" or "Circle"
   - If "Circle": dropdown to select which circle
   - Fetches user's circles via `useCircles()`
   - Shows circle names

**Deliverables**:
- Users can create text posts (max 300 graphemes)
- Choose Global or Circle level
- Circle posts require circle selection
- Validation errors display inline

**PR Title**: `Phase 5: Post creation with level selection`

---

### Phase 6: Feed Display (Circle + Global, Paginated)
**Branch**: `feat/phase-6-feeds`
**Estimated files**: ~12
**PR Size**: Large (~500 lines)

**Goal**: Two paginated feeds (50 posts per page) - Circle and Global

#### Tasks

1. **Infrastructure: Post Repository** - [src/lib/atproto/repositories/postRepository.ts](src/lib/atproto/repositories/postRepository.ts) (extend)
   - `listPosts(did: string, limit: number, cursor?: string)` - Paginated query
   - `getCircleFeedPosts(circleUris: string[], limit: number, cursor?: string)` - Posts from specified circles
   - Returns posts + pagination cursor

2. **Application: Feed Service** - [src/lib/services/feedService.ts](src/lib/services/feedService.ts)
   - `getCircleFeed(userDid: string, page: number)` - Aggregates posts from user's circles + circles they're in
   - `getGlobalFeed(page: number)` - Fetches global posts (50 per page)
   - Resolves circle names for display

3. **React Query Hooks** - [src/lib/hooks/usePosts.ts](src/lib/hooks/usePosts.ts) (extend)
   - `useCircleFeed(page: number)` - Query for circle feed with pagination
   - `useGlobalFeed(page: number)` - Query for global feed with pagination
   - Cache pages separately

4. **UI: Feed Layout** - [src/app/(app)/feed/layout.tsx](src/app/(app)/feed/layout.tsx)
   - Tab navigation: "Circle" | "Global"
   - Active tab styling
   - Shared layout wrapper

5. **UI: Circle Feed** - [src/app/(app)/feed/circle/page.tsx](src/app/(app)/feed/circle/page.tsx)
   - Fetch paginated circle feed
   - PostList component
   - Pagination controls (prev/next, 50 per page)
   - Empty state with explanation

6. **UI: Global Feed** - [src/app/(app)/feed/global/page.tsx](src/app/(app)/feed/global/page.tsx)
   - Fetch paginated global feed
   - PostList component
   - Pagination controls
   - Empty state

7. **Component: PostList** - [src/components/post/PostList.tsx](src/components/post/PostList.tsx)
   - Renders array of PostCard components
   - Loading skeleton (50 placeholders)
   - Pagination UI: "Previous | Page X | Next"
   - No infinite scroll, explicit pagination

8. **Component: PostCard** - [src/components/post/PostCard.tsx](src/components/post/PostCard.tsx)
   - Display post text (with line breaks)
   - Author info: handle and DID
   - Level badge: "Global" or circle name
   - Relative timestamp ("2h ago")
   - Forest green accent for Circle posts

**Deliverables**:
- Circle feed shows posts from user's circles + circles they're in
- Global feed shows all global posts
- Pagination: 50 posts per page, explicit controls
- Empty states for both feeds

**PR Title**: `Phase 6: Circle and Global feeds with pagination (50/page)`

---

### Phase 7: UI Polish, Theming (Forest Green + Light/Dark Mode)
**Branch**: `feat/phase-7-ui-polish`
**Estimated files**: ~18
**PR Size**: Large (~450 lines)

**Goal**: Professional, accessible UI with forest green theme and light/dark mode

#### Tasks

1. **Theme Configuration** - `tailwind.config.ts`
   - Define forest green color palette:
     ```ts
     colors: {
       forest: {
         50: '#f0f9f4',   // lightest
         100: '#d9f2e3',
         200: '#b3e5c7',
         300: '#85d5a5',
         400: '#52b878',  // primary
         500: '#2d8b57',  // darker
         600: '#1e6b44',
         700: '#165233',
         800: '#0f3a23',
         900: '#082514',  // darkest
       }
     }
     ```
   - Configure dark mode: `class` strategy
   - Set forest green as primary accent

2. **Light/Dark Mode** - [src/components/theme/ThemeToggle.tsx](src/components/theme/ThemeToggle.tsx)
   - Toggle component in nav bar
   - Uses `next-themes` package
   - Persists preference in localStorage
   - Moon/sun icon

3. **Base UI Components** - [src/components/ui/](src/components/ui/)
   - `Button.tsx` - Variants: primary (forest green), secondary, ghost
   - `Input.tsx` - With error states, forest green focus ring
   - `Card.tsx` - Subtle shadow, dark mode support
   - `Select.tsx` - Dropdown with forest green accent
   - `Badge.tsx` - For post level indicators
   - All components support light/dark mode

4. **Layout & Navigation** - [src/app/(app)/layout.tsx](src/app/(app)/layout.tsx)
   - Responsive nav bar (forest green accent)
   - Logo, nav links, theme toggle, sign out
   - Mobile hamburger menu
   - Active route highlighting
   - Sticky positioning

5. **Loading States**
   - Skeleton screens for feeds (50 placeholders)
   - Spinner component (forest green)
   - Button loading states
   - Optimistic UI updates

6. **Error Handling**
   - Toast notification system (success, error, info)
   - Form validation feedback (inline errors)
   - Network error boundary
   - Graceful degradation messages

7. **Accessibility**
   - Keyboard navigation (tab order, focus visible)
   - ARIA labels for all interactive elements
   - Focus trap in modals
   - Semantic HTML throughout
   - Color contrast compliance (WCAG AA)

8. **Mobile Responsiveness**
   - Touch-friendly tap targets (min 44x44px)
   - Responsive typography scale
   - Mobile-optimized forms (larger inputs)
   - Collapsible nav on small screens
   - Test on iOS/Android viewports

9. **Empty States & Illustrations**
   - Friendly empty state messages
   - Suggest next actions
   - Consistent tone

**Deliverables**:
- Forest green theme across all components
- Light/dark mode toggle in nav
- Fully accessible (keyboard nav, ARIA, contrast)
- Mobile-responsive (320px-4k)
- Professional, polished UI

**PR Title**: `Phase 7: UI polish with forest green theme and light/dark mode`

---

### Phase 8: Integration Testing & Documentation Finalization
**Branch**: `feat/phase-8-integration-docs`
**Estimated files**: ~8
**PR Size**: Medium (~300 lines)

**Goal**: End-to-end testing, documentation, and deployment readiness

**Note**: Unit tests were written in Phase 3 (domain layer) alongside implementation. This phase focuses on integration testing and docs.

#### Tasks

1. **Integration Tests** (Optional but Recommended)
   - Test OAuth flow end-to-end
   - Test circle creation → post creation → feed display flow
   - Test pagination
   - Mock PDS responses or use test PDS instance

2. **Manual Testing Checklist** - Create `docs/testing/manual-checklist.md`
   - [ ] Sign in with Bluesky account
   - [ ] Create 5 circles (verify 6th fails)
   - [ ] Bootstrap members from Bluesky following
   - [ ] Create Global post
   - [ ] Create Circle post (verify circle requirement)
   - [ ] View Circle feed (verify posts appear)
   - [ ] View Global feed
   - [ ] Test pagination (prev/next buttons)
   - [ ] Toggle light/dark mode
   - [ ] Edit circle members
   - [ ] Delete circle
   - [ ] Sign out and sign back in (session persistence)
   - [ ] Test on mobile device (iOS/Android)

3. **Edge Cases Testing** - Document in `docs/testing/edge-cases.md`
   - Invalid DIDs in circle members
   - Creating circle post without selecting circle
   - Network errors during post creation
   - OAuth callback failures
   - Expired session handling
   - Deleted circle referenced in post
   - Empty feeds

4. **README.md Updates**
   - Complete "Getting Started" section
   - Docker setup (`make dev`, `make prod`)
   - Environment variables guide
   - OAuth key generation instructions
   - Development workflow
   - Deployment guide (Docker Compose)
   - Screenshots of UI

5. **AGENTS.md Updates**
   - Document phase-based PR workflow
   - Add commit message conventions
   - Testing strategy (unit tests per phase)
   - Future roadmap (Radius, Bioregion)

6. **Deployment Guide** - Create `docs/deployment.md`
   - Production environment setup
   - Domain configuration (wland.app)
   - OAuth client metadata for production
   - Docker Compose production deployment
   - Health check monitoring

7. **ADR Updates** - `docs/adrs/`
   - 002-circles-as-appview.md - Document that circles are NOT access control
   - 003-pagination-strategy.md - Why 50 posts, no infinite scroll

**Deliverables**:
- Comprehensive manual testing checklist
- Updated README with full setup guide
- Deployment documentation
- ADRs for key decisions
- Production-ready configuration

**PR Title**: `Phase 8: Integration testing and documentation finalization`

---

## Docker Configuration

### Dockerfile Structure

Multi-stage build for optimal image size:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose

**Local Development** (`docker-compose.yml`):
```yaml
version: '3.8'
services:
  wetland-social:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev
```

**Production** (`docker-compose.prod.yml`):
```yaml
version: '3.8'
services:
  wetland-social:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Makefile (Simplified Commands)

**File**: `Makefile`

```makefile
.PHONY: dev build prod stop logs test clean

dev:
	docker-compose up

build:
	docker-compose build

prod:
	docker-compose -f docker-compose.prod.yml up -d

stop:
	docker-compose down

logs:
	docker-compose logs -f

test:
	docker-compose run app npm test

clean:
	docker-compose down -v
	rm -rf node_modules .next

help:
	@echo "Available commands:"
	@echo "  make dev    - Start development environment"
	@echo "  make build  - Build Docker images"
	@echo "  make prod   - Start production environment"
	@echo "  make stop   - Stop all containers"
	@echo "  make logs   - View container logs"
	@echo "  make test   - Run unit tests"
	@echo "  make clean  - Remove containers and volumes"
```

**Usage**:
```bash
make dev    # Start development
make test   # Run tests
make prod   # Deploy production
```

---

## Environment Variables

Create `.env.local` for local development and `.env.production` for production with:

```env
# App URL (change to https://wland.app for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth Configuration
OAUTH_CLIENT_ID=http://localhost:3000/client-metadata.json  # https://wland.app/client-metadata.json for prod
OAUTH_PRIVATE_KEY_PATH=/path/to/private-key.pem
SESSION_SECRET=your-random-secret-key-here  # Generate strong secret for production

# AT Protocol PDS
NEXT_PUBLIC_PDS_URL=https://bsky.social

# Optional: Local PDS for development
# DEV_PDS_URL=http://localhost:2583
```

Create `.env.example` as a template (without secrets):
```env
NEXT_PUBLIC_APP_URL=
OAUTH_CLIENT_ID=
OAUTH_PRIVATE_KEY_PATH=
SESSION_SECRET=
NEXT_PUBLIC_PDS_URL=https://bsky.social
```

---

## Critical Files for Review

These 5 files are the most important to get right:

1. [src/lib/atproto/oauth.ts](src/lib/atproto/oauth.ts) - OAuth setup determines if auth works at all
2. [lexicons/social/wetland/post.json](lexicons/social/wetland/post.json) - Post schema must be valid for PDS
3. [src/lib/atproto/lexicons/post.ts](src/lib/atproto/lexicons/post.ts) - Core post operations
4. [src/lib/atproto/lexicons/circle.ts](src/lib/atproto/lexicons/circle.ts) - Circle management logic
5. [src/components/post/PostComposer.tsx](src/components/post/PostComposer.tsx) - Primary user interaction

---

## Known Challenges & Mitigations

### 1. Custom Lexicon Support
**Challenge**: Not all PDS instances support custom lexicons out-of-the-box.

**Mitigation**:
- MVP uses Bluesky's PDS which allows custom record types
- Document requirements in README
- Future: self-host PDS for full control

### 2. Circle Privacy Enforcement
**Challenge**: AT Protocol is designed for public data; circle-level posts are visibility hints, not access control.

**Mitigation**:
- MVP treats levels as metadata for organizing content
- Document that this is not end-to-end encryption
- Future: PDS-level access control or client-side filtering

### 3. Member Discovery
**Challenge**: Users don't know their DIDs - they know their handles.

**Mitigation**:
- Users add members by **Bluesky handle** (e.g., `@user.bsky.social`)
- App resolves handle → DID via `com.atproto.identity.resolveHandle` API
- Store DIDs in circle records (backend), display handles in UI
- Bootstrap member selector from user's Bluesky following list (shows handles)

### 4. OAuth Key Management
**Challenge**: ES256 private keys must be stored securely.

**Mitigation**:
- Use environment variables
- Document key generation process
- Add key rotation strategy for production

### 5. Local PDS for Development
**Challenge**: Setting up a local PDS is complex and may not be necessary for MVP.

**Decision**:
- **For MVP**: Use Bluesky's production PDS (`bsky.social`)
  - Simpler setup, faster development
  - Real data, real OAuth
  - Custom lexicons supported
- **Post-MVP**: Consider self-hosting PDS for:
  - Full control over data
  - Custom PDS features
  - Testing without internet
- Document PDS setup in `docs/dev-pds-setup.md` for future reference

---

## Verification Steps

After implementation, verify the MVP works end-to-end:

### 1. Authentication Flow
```bash
# Start dev server
npm run dev

# Open http://localhost:3000
# Click "Sign in with Bluesky"
# Complete OAuth flow
# Verify redirect to /feed
# Check session persists on refresh
```

### 2. Circle Management
- Create 5 circles with different names
- Add test DIDs to circles (use friend's Bluesky DIDs)
- Verify 6th circle creation fails
- Edit circle members
- Delete a circle

### 3. Post Creation & Feeds
- Create Global post → appears in Global feed
- Create Circle post (select circle) → appears in Circle feed
- Have a friend add you to their circle, post there, verify it appears in your Circle feed
- Verify Global feed shows all global posts
- Check posts sorted by time (newest first)
- Check level indicators display correctly on both feeds

### 4. Edge Cases
- Try creating circle post without selecting circle → should error
- Add invalid DID to circle → should error
- Sign out and back in → session should restore
- Check mobile responsiveness on phone

### 5. PDS Verification
```bash
# Optional: Verify records exist in PDS
# Use @atproto/api to query:
# - com.atproto.repo.listRecords (collection: app.wland.post)
# - com.atproto.repo.listRecords (collection: app.wland.circle)
```

---

## Post-MVP: Future Enhancements

### Near-term (Next Phase)
- **Radius Level**: Geofence-based posting with location picker
  - One location change per day
  - Configurable radius size
  - Posts visible within geofence
- **Bioregion Level**: Integrate OneEarth bioregion data
  - Auto-detect bioregion from location
  - One bioregion change per day
  - Posts visible within bioregion boundaries
- **Profile Pages**: View other users' public (Global) posts
  - Show user's global post history
  - Display user's circles (names only, not members)

### Long-term
- **Reactions/Likes**: Add engagement to posts
  - Simple like/reaction system
  - View who reacted
- **Rich Text**: Mentions, links, hashtags (using facets)
  - @mentions for users
  - Clickable links
  - Hashtag support
- **Media Uploads**: Images, videos
  - Upload to blob storage
  - Image previews in feed
- **Moderation Tools**: Block, mute, report
  - Block users from your circles
  - Mute posts/users
  - Report inappropriate content
- **Push Notifications**: New posts in your circles
  - Web push notifications
  - Email digests
- **PWA**: Install as mobile app
  - Offline support
  - App-like experience

**Note**: No "Following Feed" - wland.app is about stratified circles, not traditional social graphs.

---

## Summary

This MVP will deliver a working stratified social media app (**wland.app**) where users can:
- Sign in with their existing Bluesky accounts (OAuth)
- Create text posts (max 300 graphemes) at Global or Circle levels
- Create up to 5 circles, ONE at a time, bootstrapped from Bluesky social graph
- View **two distinct feeds** demonstrating stratification:
  - **Circle Feed**: Your circle posts + posts from circles you're a member of
  - **Global Feed**: All global posts (public visibility)
- Paginated feeds: 50 posts per page (no infinite scroll)

**Technical Highlights**:
- **Layered Architecture**: Domain (pure business logic) → Application → Infrastructure → Presentation
- **Testability**: Unit tests for domain layer (atproto-agnostic), written alongside implementation
- **AT Protocol**: Custom lexicons (`app.wland.*`) for posts and circles
- **Next.js 15**: App Router, TypeScript, React 19
- **Theme**: Forest green color scheme with light/dark mode support
- **Fully Dockerized**: Multi-stage builds, docker-compose, Makefile for simple commands
- **Production-Ready**: Health checks, proper environment configs, deployment docs

**Key Design Decisions**:
1. **Circles are app-layer visibility hints**, NOT enforced access control boundaries
2. **One circle at a time** creation UX (max 5 total per user)
3. **Member discovery** bootstrapped from Bluesky following list (MVP feature)
4. **Pagination** instead of infinite scroll (50 posts/page for better UX)
5. **Unit tests alongside** domain implementation, not at the end
6. **Phase-based PRs** (~200-500 lines each) for human review in the loop
7. **Use Bluesky's PDS** for MVP (no local PDS complexity)

The implementation uses custom AT Protocol lexicons to extend the base post type with level metadata, while maintaining a clean layered architecture. The dual-feed approach showcases the core stratification concept - different visibility levels create different content experiences.

**Future**: Once validated, add Radius and Bioregion levels. No traditional "following feed" - wland.app is about stratified circles, not social graphs.
