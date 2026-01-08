# ADR 001: Layered Architecture for Testability

**Date**: 2026-01-08
**Status**: Accepted

## Context

Wetland-social is built on AT Protocol, which requires integration with external PDS (Personal Data Server) instances for storing and retrieving user data. We need an architecture that:

1. Maximizes testability of business logic without requiring PDS integration
2. Separates concerns between domain rules, application orchestration, and infrastructure
3. Allows for easy unit testing of core validation and business rules
4. Makes it possible to swap PDS implementations or mock them during testing

## Decision

We will implement a **layered architecture** with four distinct layers:

### 1. Domain Layer (`src/domain/`)
- **Purpose**: Pure business logic, completely atproto-agnostic
- **Contains**: Entities, validation rules, business constraints
- **Dependencies**: None (pure TypeScript, no external libraries)
- **Testing**: Unit tests with 100% coverage, no mocks needed

**Examples**:
- Post validation (300 grapheme limit)
- Circle rules (max 5 per user, member limits)
- DID format validation
- Posting level constraints

### 2. Infrastructure Layer (`src/lib/atproto/`)
- **Purpose**: AT Protocol implementation details
- **Contains**: PDS communication, record serialization, OAuth handling
- **Dependencies**: `@atproto/*` packages
- **Testing**: Integration tests (optional, can use mock or real PDS)

**Examples**:
- Repository classes for CRUD operations on PDS
- OAuth client configuration
- Session management
- Record creation with TIDs

### 3. Application Layer (`src/lib/services/`)
- **Purpose**: Orchestration between domain and infrastructure
- **Contains**: Service classes that coordinate multiple operations
- **Dependencies**: Domain layer + Infrastructure layer
- **Testing**: Integration tests focusing on workflows

**Examples**:
- Post creation service (validates via domain, creates via repository)
- Circle management service (enforces max 5 rule, calls repository)
- Feed aggregation service

### 4. Presentation Layer (`src/app/`, `src/components/`)
- **Purpose**: UI components and Next.js routes
- **Contains**: React components, hooks, API routes
- **Dependencies**: Application layer via React Query hooks
- **Testing**: E2E tests for critical flows (post-MVP)

## Consequences

### Positive
- **High testability**: Domain logic can be unit tested without any external dependencies
- **Clear separation of concerns**: Each layer has a single responsibility
- **Flexibility**: Can swap PDS implementations or add alternative infrastructure
- **Maintainability**: Changes to business rules don't affect infrastructure code
- **Fast test suite**: Unit tests run instantly without network calls

### Negative
- **More boilerplate**: Need to create interfaces and multiple layers for features
- **Learning curve**: Team needs to understand layer boundaries
- **Indirection**: More files to navigate when tracing feature implementation

### Mitigation
- Write unit tests alongside domain implementation to demonstrate value
- Document layer responsibilities clearly in README
- Use consistent patterns across features to reduce cognitive load

## Example Flow

**Creating a Circle Post**:

1. **Presentation**: User submits form with text + circle selection
2. **Application**: `PostService.createPost()` called
3. **Domain**: `Post.validate()` checks grapheme count, level constraints
4. **Domain**: Verifies circle reference is valid
5. **Infrastructure**: `PostRepository.createPost()` writes to PDS
6. **Presentation**: UI updates with new post in feed

## Alternatives Considered

### Alternative 1: Single-layer with PDS everywhere
- **Rejected**: Makes unit testing very difficult, requires PDS mocks for all tests

### Alternative 2: Two-layer (Domain + Infrastructure combined)
- **Rejected**: Business logic gets tangled with PDS-specific code, harder to test

### Alternative 3: Hexagonal Architecture (Ports & Adapters)
- **Considered**: More formal but similar to our approach
- **Decision**: Our layered approach is simpler and sufficient for MVP scope

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design Layered Architecture](https://domainlanguage.com/ddd/)
- [Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
