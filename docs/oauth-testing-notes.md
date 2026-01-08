# OAuth Testing Notes

## Current Status: Ready to Test

The OAuth flow has been updated to use **file-based persistent storage** for development, which survives Next.js hot reloads.

## What Changed

### Before (Broken)
- Used in-memory `Map` objects for OAuth state and session storage
- Next.js hot reload caused module recreation, losing all stored state
- Result: "Unknown authorization session" error because the state saved during authorize was lost by the time callback was called

### After (Fixed)
- Uses file-based storage: `createFileStore()` from `src/lib/atproto/file-store.ts`
- State persists to: `.next/cache/oauth-store/oauth-state.json`
- Sessions persist to: `.next/cache/oauth-store/oauth-session.json`
- Next.js hot reloads no longer lose OAuth data

## How to Test

### Prerequisites
1. ngrok running: `ngrok http 3000`
2. `.env.local` configured with your ngrok URL
3. `public/client-metadata.json` configured with your ngrok URL
4. PKCS#8 private key at the path specified in `.env.local`

### Test Steps

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open your ngrok HTTPS URL in a browser (e.g., `https://kristy-nondisparate-davis.ngrok-free.dev`)

3. Navigate to `/auth/login`

4. Click "Sign in with Bluesky"

5. Authorize with your Bluesky credentials

6. **Expected Result**: Redirect to `/feed/global` (will 404 for now, but that's okay - auth succeeded!)

7. **If successful**, check the logs for:
   - "Generated authorization URL"
   - "Processing OAuth callback" with code, state, iss
   - "User authenticated successfully" with did and handle

8. **To verify state persistence**, check:
   ```bash
   cat .next/cache/oauth-store/oauth-state.json
   cat .next/cache/oauth-store/oauth-session.json
   ```
   These files should contain the OAuth state and session data.

## Troubleshooting

### If you still get "Unknown authorization session"
1. Delete the store files to start fresh:
   ```bash
   rm -rf .next/cache/oauth-store/
   ```

2. Restart the dev server

3. Try the OAuth flow again

### If you get "Invalid state parameter"
- This means the state validation is failing
- Check that both authorize and callback are using the same file store
- Check that the files in `.next/cache/oauth-store/` are being written and read correctly

## Production Considerations

**DO NOT use file-based storage in production!**

For production, replace `createFileStore()` with a proper persistent store:

### Option 1: Redis (Recommended)
```typescript
import { RedisStore } from '@atproto-labs/simple-store-redis'
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)
const stateStore = new RedisStore(redis, 'oauth-state')
const sessionStore = new RedisStore(redis, 'oauth-session')
```

### Option 2: Database (PostgreSQL/MySQL)
```typescript
// Custom implementation using your database
const stateStore = createDatabaseStore<NodeSavedState>('oauth_states')
const sessionStore = createDatabaseStore<NodeSavedSession>('oauth_sessions')
```

### Option 3: DynamoDB (Serverless)
```typescript
import { DynamoDBStore } from '@atproto-labs/simple-store-dynamodb'

const stateStore = new DynamoDBStore(dynamoClient, 'oauth-states')
const sessionStore = new DynamoDBStore(dynamoClient, 'oauth-sessions')
```

## Files Modified

- `src/lib/atproto/oauth.ts` - Replaced in-memory stores with file-based stores
- `src/lib/atproto/file-store.ts` - New file implementing persistent storage
- `app/api/auth/callback/route.ts` - Added `iss` parameter handling
- `app/auth/callback/page.tsx` - Added `iss` parameter extraction
- Various other OAuth-related files (see git diff for full list)

## Next Steps After Successful Auth

Once OAuth works:
1. Create a temporary landing page at `/feed/global` (or redirect elsewhere)
2. Test session persistence across page refreshes
3. Implement sign out functionality
4. Move on to Phase 3: Domain Layer & Lexicons
