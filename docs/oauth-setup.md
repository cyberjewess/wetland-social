# OAuth Setup Guide

## Overview

Wetland Social uses AT Protocol OAuth for authentication with Bluesky. This provides secure, token-based authentication without requiring users to share their passwords.

## Local Development Limitations

**Important**: AT Protocol's OAuth implementation follows RFC 8252, which has strict requirements:

1. **Client ID must use HTTPS** (even with `allowHttp: true`)
2. **Redirect URIs must use 127.0.0.1 instead of localhost**
3. **Client ID hostname cannot be an IP address**

These requirements conflict, making local HTTP development impossible. You have three options:

### Option 1: Use ngrok (Recommended for Local Testing)

1. Install ngrok: `brew install ngrok` (or from https://ngrok.com)

2. Start your dev server:
   ```bash
   npm run dev
   ```

3. In another terminal, create an ngrok tunnel:
   ```bash
   ngrok http 3000
   ```

4. Update your `.env.local` with the ngrok URL:
   ```bash
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   OAUTH_CLIENT_ID=https://abc123.ngrok.io/client-metadata.json
   ```

5. Update `public/client-metadata.json` with the same ngrok URL

6. Access your app via the ngrok URL: `https://abc123.ngrok.io`

**Note**: The ngrok URL changes each time you restart (unless you have a paid account with custom domains).

### Option 2: Use Local HTTPS with mkcert

1. Install mkcert:
   ```bash
   brew install mkcert
   mkcert -install
   ```

2. Generate local SSL certificate:
   ```bash
   mkcert localhost 127.0.0.1 ::1
   ```

3. Configure Next.js to use HTTPS (requires custom server or using a proxy)

4. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_URL=https://localhost:3000
   OAUTH_CLIENT_ID=https://localhost:3000/client-metadata.json
   ```

### Option 3: Deploy to Production/Staging

OAuth will work out-of-the-box on any HTTPS-enabled hosting platform:
- Vercel
- Netlify
- AWS Amplify
- Cloudflare Pages
- Any server with HTTPS

Just ensure your `.env` variables use your production URL.

## OAuth Configuration Files

### Required Files

1. **Private Key** (PKCS#8 format): `keys/private-key-pkcs8.pem`
   - Never commit this to git
   - Generate with: `openssl ecparam -genkey -name prime256v1 | openssl pkcs8 -topk8 -nocrypt -out keys/private-key-pkcs8.pem`

2. **Public Key (JWK Set)**: `public/jwks.json`
   - Can be committed to git
   - Contains only the public key

3. **Client Metadata**: `public/client-metadata.json`
   - Can be committed to git
   - Update URLs for your environment

### Environment Variables

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# OAuth Configuration
OAUTH_CLIENT_ID=https://your-domain.com/client-metadata.json
OAUTH_PRIVATE_KEY_PATH=/path/to/keys/private-key-pkcs8.pem
SESSION_SECRET=<generate-with-openssl-rand-hex-32>

# AT Protocol PDS
NEXT_PUBLIC_PDS_URL=https://bsky.social
```

## Testing OAuth

Once you have HTTPS set up (via ngrok or production):

1. Navigate to `/auth/login`
2. Click "Sign in with Bluesky"
3. You'll be redirected to Bluesky's authorization page
4. Sign in with your Bluesky credentials
5. Authorize "Wetland Social"
6. You'll be redirected back to your app with an authenticated session

## Production Considerations

For production deployments:

1. **Use Redis/Database for Session Storage**
   - Current implementation uses in-memory storage (lost on restart)
   - See `src/lib/atproto/oauth.ts` for TODOs

2. **Implement Session Refresh**
   - OAuth tokens expire
   - Need middleware to refresh tokens automatically

3. **Add Logout Functionality**
   - Currently implemented at `/api/auth/logout`

4. **Secure Session Cookies**
   - Ensure cookies are `httpOnly`, `secure`, and `sameSite`
   - See `src/lib/atproto/session.ts`

## Troubleshooting

### Error: "URL must use the 'https://' protocol"
- You're trying to use HTTP URLs with OAuth
- Use ngrok or deploy to production with HTTPS

### Error: "ClientID hostname must not be an IP address"
- Your client_id is using an IP (like 127.0.0.1)
- Use a domain name (localhost, ngrok domain, or production domain)

### Error: '"pkcs8" must be PKCS#8 formatted string'
- Your private key is in EC format, not PKCS#8
- Convert with: `openssl pkcs8 -topk8 -nocrypt -in private-key.pem -out private-key-pkcs8.pem`

### Error: "Use of 'localhost' hostname is not allowed (RFC 8252)"
- Use 127.0.0.1 for redirect_uris
- But note: this conflicts with the "no IP address" requirement for client_id
- Solution: Use ngrok or production HTTPS

## References

- [AT Protocol OAuth Specification](https://atproto.com/specs/oauth)
- [RFC 8252 - OAuth 2.0 for Native Apps](https://datatracker.ietf.org/doc/html/rfc8252)
- [@atproto/oauth-client-node Documentation](https://www.npmjs.com/package/@atproto/oauth-client-node)
