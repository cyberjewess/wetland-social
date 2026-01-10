/**
 * DID (Decentralized Identifier) validation for AT Protocol
 *
 * AT Protocol uses DIDs to identify users. Common formats:
 * - did:plc:xxx (PLC directory)
 * - did:web:xxx (Web-based DIDs)
 */

/**
 * Regular expression for valid DID formats
 * Format: did:<method>:<identifier>
 * - method: lowercase alphanumeric
 * - identifier: alphanumeric, hyphens, underscores, dots
 */
const DID_REGEX = /^did:[a-z]+:[a-zA-Z0-9._-]+$/

/**
 * Validates if a string is a valid DID format
 *
 * @param did - The DID string to validate
 * @returns true if valid DID format, false otherwise
 *
 * @example
 * isValidDid('did:plc:abc123') // true
 * isValidDid('did:web:example.com') // true
 * isValidDid('invalid') // false
 */
export function isValidDid(did: string): boolean {
  if (!did || typeof did !== 'string') {
    return false
  }

  return DID_REGEX.test(did)
}

/**
 * Asserts that a DID is valid, throwing an error if not
 *
 * @param did - The DID to validate
 * @throws Error if DID is invalid
 */
export function assertValidDid(did: string): void {
  if (!isValidDid(did)) {
    throw new Error(`Invalid DID format: ${did}`)
  }
}

/**
 * Validates an array of DIDs
 *
 * @param dids - Array of DIDs to validate
 * @returns true if all DIDs are valid, false otherwise
 */
export function areValidDids(dids: string[]): boolean {
  if (!Array.isArray(dids)) {
    return false
  }

  return dids.every(isValidDid)
}
