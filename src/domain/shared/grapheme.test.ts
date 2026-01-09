import {
  countGraphemes,
  isWithinGraphemeLimit,
  assertGraphemeLimit,
  truncateToGraphemes,
} from './grapheme'

describe('Grapheme Utilities', () => {
  describe('countGraphemes', () => {
    it('should count ASCII characters correctly', () => {
      expect(countGraphemes('Hello')).toBe(5)
      expect(countGraphemes('Hello world')).toBe(11)
    })

    it('should count emoji as single graphemes', () => {
      expect(countGraphemes('👋')).toBe(1)
      expect(countGraphemes('👋🌍')).toBe(2)
      expect(countGraphemes('Hello 👋')).toBe(7)
    })

    it('should handle combining characters', () => {
      expect(countGraphemes('café')).toBe(4) // é is one grapheme
      expect(countGraphemes('e\u0301')).toBe(1) // e + combining acute = 1 grapheme
    })

    it('should handle empty and null inputs', () => {
      expect(countGraphemes('')).toBe(0)
      expect(countGraphemes(null as unknown as string)).toBe(0)
      expect(countGraphemes(undefined as unknown as string)).toBe(0)
    })

    it('should handle multi-byte characters', () => {
      expect(countGraphemes('你好')).toBe(2)
      expect(countGraphemes('مرحبا')).toBe(5)
    })
  })

  describe('isWithinGraphemeLimit', () => {
    it('should return true for text within limit', () => {
      expect(isWithinGraphemeLimit('Hello', 10)).toBe(true)
      expect(isWithinGraphemeLimit('Hello', 5)).toBe(true)
    })

    it('should return false for text exceeding limit', () => {
      expect(isWithinGraphemeLimit('Hello world', 5)).toBe(false)
      expect(isWithinGraphemeLimit('Hello', 4)).toBe(false)
    })

    it('should handle emoji correctly', () => {
      expect(isWithinGraphemeLimit('👋🌍🎉', 3)).toBe(true)
      expect(isWithinGraphemeLimit('👋🌍🎉', 2)).toBe(false)
    })
  })

  describe('assertGraphemeLimit', () => {
    it('should not throw for text within limit', () => {
      expect(() => assertGraphemeLimit('Hello', 10)).not.toThrow()
      expect(() => assertGraphemeLimit('Hello', 5)).not.toThrow()
    })

    it('should throw for text exceeding limit', () => {
      expect(() => assertGraphemeLimit('Hello world', 5)).toThrow(
        'Text exceeds maximum length of 5 graphemes (got 11)'
      )
    })

    it('should use custom field name in error', () => {
      expect(() => assertGraphemeLimit('Hello world', 5, 'Post text')).toThrow(
        'Post text exceeds maximum length of 5 graphemes (got 11)'
      )
    })
  })

  describe('truncateToGraphemes', () => {
    it('should truncate text to grapheme limit', () => {
      expect(truncateToGraphemes('Hello world', 5)).toBe('Hello')
      expect(truncateToGraphemes('Hello', 3)).toBe('Hel')
    })

    it('should not truncate text within limit', () => {
      expect(truncateToGraphemes('Hello', 10)).toBe('Hello')
      expect(truncateToGraphemes('Hello', 5)).toBe('Hello')
    })

    it('should handle emoji correctly', () => {
      expect(truncateToGraphemes('👋🌍🎉', 2)).toBe('👋🌍')
      expect(truncateToGraphemes('Hello 👋🌍', 7)).toBe('Hello 👋')
    })

    it('should handle empty inputs', () => {
      expect(truncateToGraphemes('', 5)).toBe('')
      expect(truncateToGraphemes(null as unknown as string, 5)).toBe('')
    })

    it('should handle combining characters', () => {
      expect(truncateToGraphemes('café', 3)).toBe('caf')
    })
  })
})
