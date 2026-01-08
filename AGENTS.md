# Development Workflow with Claude Code

This document describes the collaborative workflow between human developers and Claude Code for building wetland-social.

---

## 1. Plan Loop

The planning phase ensures alignment before any code is written.

### 1a. Get Prompt from Developer
- Developer describes feature, bug fix, or task
- Claude asks clarifying questions if needed
- Establish clear success criteria

### 1b. Check Against Existing Todo List
- Review current todo list for related work
- Identify dependencies on other tasks
- Check if task is already in progress or completed
- Avoid duplicating existing work

### 1c. Flesh Out Plan
- Break down task into concrete steps
- Identify affected files and components
- Consider architecture implications (domain/infrastructure/application/presentation layers)
- Estimate scope (small/medium/large PR)
- Reference relevant ADRs and design decisions

### 1d. Confirm or Refine
- Present plan to developer for review
- Iterate based on feedback
- Adjust scope if needed (defer features, simplify approach)
- Get explicit approval before proceeding

### 1e. Update Todo List
- Add tasks to todo list with clear descriptions
- Mark current task as `in_progress`
- Set other new tasks as `pending`
- Ensure only ONE task is `in_progress` at a time

---

## 2. Development Loop

The implementation phase follows a disciplined, reviewable workflow.

### 2a. Make a Feature Branch
- Branch naming convention: `feat/phase-N-description` or `fix/description`
- Always branch from `main`
- Examples:
  - `feat/phase-1-setup`
  - `feat/phase-2-auth`
  - `fix/circle-validation-bug`

### 2b. Write Core Change
- Implement the feature/fix following the plan
- Follow layered architecture:
  - **Domain layer**: Pure business logic, no external dependencies
  - **Infrastructure layer**: AT Protocol integration, PDS communication
  - **Application layer**: Service orchestration
  - **Presentation layer**: React components, UI
- Use existing patterns and conventions
- Keep changes focused on the current task

### 2c. Commit When >3 Files Changed
- Commit after modifying ~3-4 files (or logical unit of work)
- **Commit message format**:
  - Maximum **200 characters**
  - Start with verb: "Add", "Update", "Fix", "Remove", "Refactor"
  - Be specific and descriptive
  - Examples:
    - `Add forest green theme to Tailwind CSS with light/dark mode support`
    - `Create layered architecture ADR documenting domain/infra split`
    - `Fix circle validation to enforce max 5 circles per user`
- Commit frequently to maintain reviewable history
- Each commit should represent a coherent change

### 2d. Update Documentation
- Update relevant documentation alongside code changes:
  - **README.md**: Setup instructions, usage examples
  - **docs/plans/mvp.md**: Update phase checklist progress
  - **docs/adrs/**: Create ADRs for significant architectural decisions
  - **Code comments**: Document complex logic (sparingly)
  - **JSDoc**: Document public APIs and complex functions
- Keep documentation in sync with implementation

### 2e. Write Tests
- Write tests alongside implementation:
  - **Phase 3+**: Unit tests for domain layer (pure business logic)
  - **Phase 8**: Integration tests for critical flows
  - Follow testing pyramid: unit tests > integration tests > e2e tests
- Test files: `*.test.ts` or `*.test.tsx`
- Run tests: `npm test` or `make test` (in Docker)
- Ensure all tests pass before pushing

### 2f. Push So Human Can Review
- Push feature branch to GitHub
- Create Pull Request with:
  - **Title**: Clear, concise description (e.g., `Phase 1: Project setup with Docker and layered architecture`)
  - **Description**:
    - Summary of changes
    - Link to relevant plan section
    - Testing instructions
    - Screenshots (if UI changes)
  - **Size**: Keep PRs reviewable (~200-500 lines)
- Mark todo task as `completed` after pushing
- Wait for human review before merging

### 2g. Ensure Human Readability
**PR Size Guidelines**:
- **Small PR**: ~200-300 lines (1-2 features, ideal)
- **Medium PR**: ~300-500 lines (3-5 related changes)
- **Large PR**: ~500+ lines (avoid if possible, split into multiple PRs)

**Strategies for Staying in the Loop**:
1. **Phase-based PRs**: Each implementation phase = one PR
2. **Frequent commits**: Commit every 3-4 files for granular history
3. **Clear commit messages**: ≤200 chars, descriptive, verb-first
4. **Descriptive PR titles**: Mirror phase names from plan
5. **Documentation updates**: Include in same PR as code changes
6. **Test coverage**: Demonstrate correctness, aid review
7. **Todo list tracking**: Visual progress indicator

**Review Workflow**:
1. Claude pushes PR
2. Human reviews on GitHub
3. Human approves, requests changes, or asks questions
4. If changes needed: Claude updates branch, pushes again
5. When approved: Human merges to `main`
6. Claude continues with next phase/task

---

## Commit Message Conventions

### Format
```
<verb> <concise description (≤200 chars)>
```

### Verbs
- **Add**: New feature, file, or capability
- **Update**: Modify existing feature or documentation
- **Fix**: Bug fix
- **Remove**: Delete code or files
- **Refactor**: Code restructuring without behavior change
- **Test**: Add or update tests
- **Docs**: Documentation-only changes
- **Chore**: Tooling, dependencies, configuration

### Examples
```
Add Next.js 15 with TypeScript, Tailwind, and App Router
Install atproto dependencies: api, oauth-client-node, lexicon, repo
Configure Jest for unit tests with jsdom environment
Create layered architecture ADR with domain/infra split
Add forest green Tailwind theme with light/dark mode
Fix circle member validation to allow up to 1000 DIDs
Update README with Docker setup instructions
Remove deprecated PDS mock configuration
Refactor post service to use domain layer validation
Test circle creation with max 5 circles constraint
```

---

## Testing Strategy

### Phase 3: Domain Layer Unit Tests
- Pure business logic testing (no mocks, no external dependencies)
- Test files alongside implementation:
  - `src/domain/post/post.test.ts`
  - `src/domain/circle/circle.test.ts`
  - `src/domain/shared/did.test.ts`
  - `src/domain/shared/grapheme.test.ts`
- 100% coverage for domain validation rules
- Fast execution (milliseconds)

### Phase 8: Integration Tests (Optional)
- Test infrastructure layer (PDS communication)
- Mock PDS responses or use test PDS instance
- Focus on critical flows:
  - OAuth authentication
  - Circle creation → post creation → feed display
  - Pagination logic

### Post-MVP: E2E Tests
- Critical user journeys end-to-end
- Tools: Playwright or Cypress
- Scenarios:
  - Sign in → create circle → create post → view in feed
  - Pagination through 50+ posts
  - Light/dark mode toggle

---

## Future Roadmap (Post-MVP)

Documented here for context, not part of MVP scope:

### Near-term Enhancements
- **Radius Level**: Geofence-based posting (location picker, once/day change)
- **Bioregion Level**: OneEarth bioregion integration (auto-detect, once/day change)
- **Profile Pages**: View other users' global posts and circle names

### Long-term Features
- **Reactions/Likes**: Simple engagement system
- **Rich Text**: Mentions, links, hashtags (AT Protocol facets)
- **Media Uploads**: Images, videos (blob storage)
- **Moderation Tools**: Block, mute, report
- **Push Notifications**: Web push for new circle posts
- **PWA**: Offline support, app-like experience

**Note**: No "Following Feed" - wetland-social is about stratified circles, not traditional social graphs.

---

## Key Principles

1. **Human in the Loop**: Every PR requires human review before merge
2. **Small, Focused PRs**: ~200-500 lines per PR for easy review
3. **Frequent Commits**: Commit every ~3-4 files with descriptive messages ≤200 chars
4. **Documentation Alongside Code**: Update docs in the same PR as implementation
5. **Test Alongside Implementation**: Write unit tests in same phase as domain logic
6. **Layered Architecture**: Maintain separation between domain/infrastructure/application/presentation
7. **Phase-based Workflow**: Complete one phase, get review, merge, move to next
8. **Todo List Tracking**: Keep todo list updated to show progress

---

## Quick Reference

### Commands
```bash
# Development
make dev              # Start dev environment (Docker)
npm run dev           # Start dev server (local)

# Testing
make test             # Run tests (Docker)
npm test              # Run tests (local)

# Docker
make build            # Build images
make prod             # Start production
make stop             # Stop containers
make logs             # View logs
make clean            # Remove containers and volumes

# Git
git checkout -b feat/phase-N-description    # Create feature branch
git add .                                    # Stage changes
git commit -m "Add feature description"     # Commit (≤200 chars)
git push origin feat/phase-N-description    # Push for review
```

### File Paths
- **Plans**: `docs/plans/mvp.md`
- **ADRs**: `docs/adrs/`
- **Domain**: `src/domain/`
- **Infrastructure**: `src/lib/atproto/`
- **Application**: `src/lib/services/`
- **Presentation**: `src/app/`, `src/components/`
- **Tests**: `*.test.ts`, `*.test.tsx`

### PR Template
```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2
- Change 3

## Related
- Closes #issue-number
- Part of Phase N (see docs/plans/mvp.md)

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Documentation updated

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

---

This workflow ensures collaborative, reviewable, and maintainable development while keeping the human developer in the loop at every major step.
