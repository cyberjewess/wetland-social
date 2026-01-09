import { isValidDid, assertValidDid, areValidDids } from './did'

describe('DID Validation', () => {
  describe('isValidDid', () => {
    it('should validate PLC DIDs', () => {
      expect(isValidDid('did:plc:abc123')).toBe(true)
      expect(isValidDid('did:plc:7iza6de2dwap2sbkpav7c6c6')).toBe(true)
    })

    it('should validate web DIDs', () => {
      expect(isValidDid('did:web:example.com')).toBe(true)
      expect(isValidDid('did:web:bsky.app')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidDid('invalid')).toBe(false)
      expect(isValidDid('did:')).toBe(false)
      expect(isValidDid('did:plc:')).toBe(false)
      expect(isValidDid('')).toBe(false)
    })

    it('should reject non-string inputs', () => {
      expect(isValidDid(null as unknown as string)).toBe(false)
      expect(isValidDid(undefined as unknown as string)).toBe(false)
      expect(isValidDid(123 as unknown as string)).toBe(false)
    })

    it('should handle DIDs with special characters', () => {
      expect(isValidDid('did:plc:abc-123')).toBe(true)
      expect(isValidDid('did:plc:abc_123')).toBe(true)
      expect(isValidDid('did:plc:abc.123')).toBe(true)
    })
  })

  describe('assertValidDid', () => {
    it('should not throw for valid DIDs', () => {
      expect(() => assertValidDid('did:plc:abc123')).not.toThrow()
      expect(() => assertValidDid('did:web:example.com')).not.toThrow()
    })

    it('should throw for invalid DIDs', () => {
      expect(() => assertValidDid('invalid')).toThrow('Invalid DID format: invalid')
      expect(() => assertValidDid('')).toThrow('Invalid DID format: ')
    })
  })

  describe('areValidDids', () => {
    it('should validate array of valid DIDs', () => {
      expect(
        areValidDids(['did:plc:abc123', 'did:plc:def456', 'did:web:example.com'])
      ).toBe(true)
    })

    it('should reject arrays with invalid DIDs', () => {
      expect(areValidDids(['did:plc:abc123', 'invalid', 'did:plc:def456'])).toBe(
        false
      )
    })

    it('should return true for empty arrays', () => {
      expect(areValidDids([])).toBe(true)
    })

    it('should reject non-array inputs', () => {
      expect(areValidDids(null as unknown as string[])).toBe(false)
      expect(areValidDids(undefined as unknown as string[])).toBe(false)
      expect(areValidDids('not-an-array' as unknown as string[])).toBe(false)
    })
  })
})
