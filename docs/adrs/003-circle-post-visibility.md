# ADR 003: Circle Post Visibility Based on Current Membership

**Date**: 2026-01-09
**Status**: Accepted

## Context

Circle posts in Wetland Social reference a circle via `circleRef` (URI + CID). We need to decide when a user can see posts made to a circle:

**Option 1: Snapshot-based (visible only to members at time of posting)**
- Post references exact circle version via CID
- New members cannot see posts made before they joined
- More privacy-preserving, immutable access control

**Option 2: Current membership-based (visible to all current members)**
- Post references circle by URI
- Anyone currently in the circle sees all posts in that circle
- Simpler, more intuitive UX

## Decision

We will use **Option 2: Current membership-based visibility**.

Posts in a circle are visible to ALL current members of that circle, regardless of when the post was created or when the member joined.

### Authorization Query
```typescript
// User can see a circle post if:
// 1. They are currently a member of the referenced circle
function canViewCirclePost(userDid: string, post: Post): boolean {
  const circle = getCircle(post.circleRef.uri)
  return circle.members.includes(userDid)
}
```

### Feed Query
```typescript
// Circle feed shows:
// - Posts where user is currently in the circle
function getCircleFeed(userDid: string) {
  const userCircles = getCirclesWhereUserIsMember(userDid)
  return queryPosts({
    where: {
      level: 'circle',
      'circleRef.uri': { in: userCircles.map(c => c.uri) }
    }
  })
}
```

## Rationale

### Why Current Membership (Option 2)?

1. **Intuitive UX**
   - Matches user expectations: "I'm in this circle → I see posts in this circle"
   - Consistent with familiar group chat apps (Slack, Discord)
   - No confusion about "why can't I see old posts?"

2. **Simpler Implementation**
   - Authorization: single check "is user in circle?"
   - No need to track circle version history
   - Straightforward feed queries

3. **Circle Semantics**
   - Circles represent "trusted groups"
   - If you trust someone enough to add them, they should see the full context
   - Circle owner controls access by controlling membership

4. **Better Conversations**
   - New members get full context and history
   - Can participate meaningfully in ongoing discussions
   - Reduces fragmentation

5. **MVP Scope**
   - Focus on core experience first
   - Can add stricter options later if needed

### Why Not Snapshot-based (Option 1)?

- **Complexity**: Would require tracking circle versions and CID-based lookups
- **UX confusion**: Users expect group chats to work like Slack, not like encrypted messaging
- **Limited value for MVP**: Circle owner controls membership anyway
- **Can add later**: If demand exists, could add as optional "freeze membership at post time" feature

## Consequences

### Positive
- **Simple authorization**: Just check current membership
- **Intuitive for users**: Works like familiar group chats
- **Faster queries**: No CID version lookups needed
- **Better onboarding**: New members see history

### Negative
- **No retroactive revocation**: Removing someone doesn't hide old posts from them (already in their repo)
- **Trust required**: Must trust circle owner won't add random people
- **Less privacy**: Can't guarantee posts are only seen by "original members"

### Mitigations
- **Circle owner responsibility**: Document that adding members grants access to full history
- **AT Protocol limitation**: Once synced to user's PDS, can't revoke (fundamental to atproto)
- **Future enhancement**: Could add "locked circles" that freeze membership at post time

## Role of CID

Even though we use URI for authorization, we still store the CID for:

1. **Integrity verification**: Detect if circle record was corrupted
2. **Content addressing**: Standard AT Protocol pattern
3. **Future features**: Enable "freeze at post time" option later
4. **Audit trail**: Can prove what circle looked like when post was created

The CID is stored but not used for authorization in MVP.

## Implementation Notes

### Phase 4 (Infrastructure Layer)
```typescript
// Repository: query posts by circle URI
async function getPostsForCircle(circleUri: string): Promise<Post[]> {
  return queryRecords({
    collection: 'app.wland.post',
    where: { 'circleRef.uri': circleUri }
  })
}
```

### Phase 5 (Application Layer)
```typescript
// Service: authorize access
async function getCircleFeedForUser(userDid: string): Promise<FeedPost[]> {
  // 1. Get all circles where user is a member
  const circles = await circleRepository.getCirclesWithMember(userDid)

  // 2. Get all posts in those circles
  const posts = await postRepository.getPostsInCircles(
    circles.map(c => c.uri)
  )

  return posts
}
```

## Alternatives Considered

### Alternative 1: Hybrid Approach
Allow post creator to choose "freeze members" vs "current members" per post.

**Rejected**: Too complex for MVP, adds UI friction, most users won't understand the difference.

### Alternative 2: Time-based access
Members see posts from time they joined onward.

**Rejected**: More complex than snapshot-based, confusing UX ("why can I see this post but not that one?").

### Alternative 3: Full privacy mode
Use encryption, only members at time of post can decrypt.

**Rejected**: Outside AT Protocol's design, would require custom encryption layer, massive complexity increase.

## References

- AT Protocol content addressing: https://atproto.com/specs/repository
- Discord's channel history model (similar to our approach)
- Signal's member join model (opposite approach - can't see history)

## Future Considerations

Post-MVP, could add:
- **Circle privacy levels**: "Open" (current approach) vs "Frozen" (snapshot-based)
- **Member join notifications**: "Alice joined and can now see history"
- **Circle archiving**: Make circle read-only, freeze membership
- **Temporal access**: Automatic expiry for sensitive circles
