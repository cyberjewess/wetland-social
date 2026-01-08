# OAuth Keys Directory

This directory stores the ES256 key pair used for OAuth authentication with Bluesky.

## Security

- **DO NOT** commit these keys to version control
- This directory is gitignored
- Keys should have restrictive permissions (600 for private key)

## Files

- `private-key.pem` - ES256 private key for OAuth client authentication
- `public-key.pem` - Public key (used to generate JWKS in Phase 2)

## Generating Keys

If you need to regenerate the keys:

```bash
# Generate ES256 private key
openssl ecparam -name prime256v1 -genkey -noout -out keys/private-key.pem

# Extract public key
openssl ec -in keys/private-key.pem -pubout -out keys/public-key.pem

# Set secure permissions
chmod 600 keys/private-key.pem
```

## Usage

The private key path is referenced in `.env.local`:

```env
OAUTH_PRIVATE_KEY_PATH=/absolute/path/to/wetland-social/keys/private-key.pem
```

In Phase 2, the public key will be used to generate `/public/jwks.json` for OAuth client metadata.
