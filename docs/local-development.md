# Local Development Setup

## Prerequisites

- Node.js 18+ and npm
- ngrok (for OAuth testing with HTTPS)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate OAuth Keys

Generate an ES256 private key in PKCS#8 format:

```bash
mkdir -p keys
openssl ecparam -genkey -name prime256v1 | openssl pkcs8 -topk8 -nocrypt -out keys/private-key-pkcs8.pem
```

Extract the public key:

```bash
openssl ec -in keys/private-key-pkcs8.pem -pubout -out keys/public-key.pem
```

### 3. Generate JWKS

Run the JWKS generation script (this should be created):

```bash
node scripts/generate-jwks.js
```

This will create `public/jwks.json` from your public key.

### 4. Set Up ngrok for HTTPS

OAuth with AT Protocol requires HTTPS, even for local development. We use ngrok to create an HTTPS tunnel.

#### Install ngrok:

```bash
brew install ngrok
# or download from https://ngrok.com
```

#### Start ngrok tunnel:

In a **separate terminal window**, run:

```bash
ngrok http 3000
```

You'll see output like:

```
Forwarding  https://kristy-nondisparate-davis.ngrok-free.dev -> http://localhost:3000
```

**Important:** Keep this terminal running. Your ngrok URL will change each time you restart ngrok (unless you have a paid account).

### 5. Configure Environment Variables

Create `.env.local` with your ngrok URL:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.dev

# OAuth Configuration
OAUTH_CLIENT_ID=https://your-ngrok-url.ngrok-free.dev/client-metadata.json
OAUTH_PRIVATE_KEY_PATH=/absolute/path/to/wetland-social/keys/private-key-pkcs8.pem
SESSION_SECRET=$(openssl rand -hex 32)

# AT Protocol PDS
NEXT_PUBLIC_PDS_URL=https://bsky.social
```

**Replace `your-ngrok-url.ngrok-free.dev` with your actual ngrok URL!**

### 6. Update Client Metadata

Edit `public/client-metadata.json` and replace all URLs with your ngrok URL:

```json
{
  "client_id": "https://your-ngrok-url.ngrok-free.dev/client-metadata.json",
  "client_name": "Wetland Social",
  "client_uri": "https://your-ngrok-url.ngrok-free.dev",
  "logo_uri": "https://your-ngrok-url.ngrok-free.dev/logo.png",
  "redirect_uris": ["https://your-ngrok-url.ngrok-free.dev/auth/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "atproto transition:generic",
  "token_endpoint_auth_method": "private_key_jwt",
  "token_endpoint_auth_signing_alg": "ES256",
  "jwks_uri": "https://your-ngrok-url.ngrok-free.dev/jwks.json",
  "application_type": "web",
  "dpop_bound_access_tokens": true
}
```

## Running the Development Server

### Terminal 1: ngrok

```bash
ngrok http 3000
```

Keep this running and note your HTTPS URL.

### Terminal 2: Next.js Dev Server

```bash
npm run dev
```

### Access the App

**Important:** Access your app via the ngrok HTTPS URL, not localhost!

- **Correct:** https://your-ngrok-url.ngrok-free.dev
- **Wrong:** http://localhost:3000

## Testing OAuth

1. Go to https://your-ngrok-url.ngrok-free.dev/auth/login
2. Click "Sign in with Bluesky"
3. Sign in with your Bluesky credentials
4. Authorize "Wetland Social"
5. You'll be redirected back and authenticated

## ngrok URL Changes

Every time you restart ngrok, you get a new URL (unless you have a paid account). When this happens:

1. Update `.env.local` with the new URL
2. Update `public/client-metadata.json` with the new URL
3. Restart your dev server to pick up the new environment variables

## Alternative: ngrok Custom Domain (Paid)

If you have an ngrok paid account, you can use a custom domain that doesn't change:

```bash
ngrok http 3000 --domain=your-custom-domain.ngrok-free.app
```

Then you only need to configure the URLs once.

## Troubleshooting

### "Invalid client_id" or HTTPS errors

- Make sure you're accessing via the ngrok HTTPS URL, not localhost
- Verify `.env.local` and `client-metadata.json` have matching URLs
- Ensure ngrok is running

### OAuth state lost on hot reload / "Unknown authorization session"

- Current implementation uses in-memory storage
- OAuth state is lost when Next.js hot reloads modules
- **Workaround**: Restart the dev server (`npm run dev`) and try auth again
- This will be fixed in Phase 1.5 when we add Docker + Redis

### Build errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

## Development Workflow

1. **Start ngrok first** and note the URL
2. Update `.env.local` and `client-metadata.json` if URL changed
3. Start dev server
4. Access app via ngrok HTTPS URL
5. Make your changes (dev server hot reloads)
6. Test OAuth flow to verify changes

## Production Deployment

For production, deploy to any HTTPS-enabled platform (Vercel, Netlify, etc.) and update:

- `NEXT_PUBLIC_APP_URL` to your production domain
- `OAUTH_CLIENT_ID` to your production domain
- `public/client-metadata.json` URLs to production domain

No ngrok needed in production!
