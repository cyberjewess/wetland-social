import {
  createPost,
  validatePost,
  validatePostText,
  validatePostLevel,
  validateDateTime,
  PostValidationError,
  getPostSummary,
} from './post'
import type { PostLevel } from './postLevel'

describe('Post Domain', () => {
  describe('validatePostText', () => {
    it('should accept valid text', () => {
      expect(() => validatePostText('Hello world')).not.toThrow()
      expect(() => validatePostText('A'.repeat(300))).not.toThrow()
    })

    it('should reject empty text', () => {
      expect(() => validatePostText('')).toThrow(PostValidationError)
      expect(() => validatePostText('   ')).toThrow('Post text cannot be empty')
    })

    it('should reject null/undefined', () => {
      expect(() => validatePostText(null as unknown as string)).toThrow(
        'Post text is required'
      )
      expect(() => validatePostText(undefined as unknown as string)).toThrow(
        'Post text is required'
      )
    })

    it('should reject text exceeding 300 graphemes', () => {
      const longText = 'A'.repeat(301)
      expect(() => validatePostText(longText)).toThrow(PostValidationError)
      expect(() => validatePostText(longText)).toThrow(
        'exceeds maximum length of 300 graphemes'
      )
    })

    it('should count emoji as single graphemes', () => {
      const emojiText = '👋'.repeat(300) // Exactly 300 graphemes
      expect(() => validatePostText(emojiText)).not.toThrow()

      const tooManyEmoji = '👋'.repeat(301)
      expect(() => validatePostText(tooManyEmoji)).toThrow(PostValidationError)
    })
  })

  describe('validatePostLevel', () => {
    it('should accept global without circleRef', () => {
      expect(() => validatePostLevel('global')).not.toThrow()
    })

    it('should accept circle with circleRef', () => {
      expect(() =>
        validatePostLevel('circle', {
          uri: 'at://did:plc:abc/app.wland.circle/123',
          cid: 'bafyreib2rxk3rybk6hfs56gvqcgcn',
        })
      ).not.toThrow()
    })

    it('should reject circle without circleRef', () => {
      expect(() => validatePostLevel('circle')).toThrow(
        'Circle posts must have a circleRef'
      )
    })

    it('should reject global with circleRef', () => {
      expect(() =>
        validatePostLevel('global', {
          uri: 'at://did:plc:abc/app.wland.circle/123',
          cid: 'bafyreib2rxk3rybk6hfs56gvqcgcn',
        })
      ).toThrow('Global posts cannot have a circleRef')
    })

    it('should reject invalid levels', () => {
      expect(() =>
        validatePostLevel('invalid' as unknown as PostLevel)
      ).toThrow('Invalid post level')
    })

    it('should reject circleRef without uri', () => {
      expect(() =>
        validatePostLevel('circle', {
          uri: '',
          cid: 'bafyreib2rxk3rybk6hfs56gvqcgcn',
        })
      ).toThrow('circleRef.uri is required and must be a string')
    })

    it('should reject circleRef without cid', () => {
      expect(() =>
        validatePostLevel('circle', {
          uri: 'at://did:plc:abc/app.wland.circle/123',
          cid: '',
        })
      ).toThrow('circleRef.cid is required and must be a string')
    })

    it('should reject circleRef with invalid AT-URI format', () => {
      expect(() =>
        validatePostLevel('circle', {
          uri: 'https://example.com/circle/123',
          cid: 'bafyreib2rxk3rybk6hfs56gvqcgcn',
        })
      ).toThrow('circleRef.uri must be a valid AT-URI (starts with at://)')
    })
  })

  describe('validateDateTime', () => {
    it('should accept valid ISO datetimes', () => {
      expect(() => validateDateTime(new Date().toISOString())).not.toThrow()
      expect(() => validateDateTime('2024-01-15T10:30:00.000Z')).not.toThrow()
    })

    it('should reject invalid datetimes', () => {
      expect(() => validateDateTime('invalid')).toThrow(
        'createdAt must be a valid ISO datetime'
      )
      expect(() => validateDateTime('')).toThrow('createdAt is required')
      expect(() => validateDateTime(null as unknown as string)).toThrow(
        'createdAt is required'
      )
    })
  })

  describe('validatePost', () => {
    it('should validate complete global post', () => {
      const post = {
        text: 'Hello world',
        level: 'global' as const,
        createdAt: new Date().toISOString(),
      }
      expect(() => validatePost(post)).not.toThrow()
    })

    it('should validate complete circle post', () => {
      const post = {
        text: 'Hello circle',
        level: 'circle' as const,
        circleRef: {
          uri: 'at://did:plc:abc/app.wland.circle/123',
          cid: 'bafyreib2rxk3rybk6hfs56gvqcgcn',
        },
        createdAt: new Date().toISOString(),
      }
      expect(() => validatePost(post)).not.toThrow()
    })

    it('should validate post with language codes', () => {
      const post = {
        text: 'Hello world',
        level: 'global' as const,
        createdAt: new Date().toISOString(),
        langs: ['en', 'es'],
      }
      expect(() => validatePost(post)).not.toThrow()
    })

    it('should reject post with invalid language codes', () => {
      const post = {
        text: 'Hello world',
        level: 'global' as const,
        createdAt: new Date().toISOString(),
        langs: ['english', 'spanish'], // Should be 2-letter codes
      }
      expect(() => validatePost(post)).toThrow(
        'langs must be an array of 2-letter ISO language codes'
      )
    })

    it('should reject post with non-array langs', () => {
      const post = {
        text: 'Hello world',
        level: 'global' as const,
        createdAt: new Date().toISOString(),
        langs: 'en' as unknown as string[],
      }
      expect(() => validatePost(post)).toThrow('langs must be an array')
    })
  })

  describe('createPost', () => {
    it('should create valid global post', () => {
      const post = createPost({
        text: 'Hello world',
        level: 'global',
      })

      expect(post.text).toBe('Hello world')
      expect(post.level).toBe('global')
      expect(post.circleRef).toBeUndefined()
      expect(post.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should create valid circle post', () => {
      const post = createPost({
        text: 'Hello circle',
        level: 'circle',
        circleRef: {
          uri: 'at://did:plc:abc/app.wland.circle/123',
          cid: 'bafyreib2rxk3rybk6hfs56gvqcgcn',
        },
      })

      expect(post.text).toBe('Hello circle')
      expect(post.level).toBe('circle')
      expect(post.circleRef).toEqual({
        uri: 'at://did:plc:abc/app.wland.circle/123',
        cid: 'bafyreib2rxk3rybk6hfs56gvqcgcn',
      })
    })

    it('should throw for invalid post', () => {
      expect(() =>
        createPost({
          text: '',
          level: 'global',
        })
      ).toThrow(PostValidationError)
    })

    it('should include language codes if provided', () => {
      const post = createPost({
        text: 'Hello world',
        level: 'global',
        langs: ['en'],
      })

      expect(post.langs).toEqual(['en'])
    })
  })

  describe('getPostSummary', () => {
    it('should return full text for short posts', () => {
      const post = createPost({
        text: 'Hello world',
        level: 'global',
      })

      expect(getPostSummary(post)).toBe('global post: Hello world')
    })

    it('should truncate long posts', () => {
      const longText = 'A'.repeat(100)
      const post = createPost({
        text: longText,
        level: 'global',
      })

      const summary = getPostSummary(post)
      expect(summary).toContain('global post:')
      expect(summary).toContain('...')
      expect(summary.length).toBeLessThan(longText.length)
    })

    it('should include level in summary', () => {
      const circlePost = createPost({
        text: 'Circle post',
        level: 'circle',
        circleRef: {
          uri: 'at://did:plc:abc/app.wland.circle/123',
          cid: 'bafyreib2rxk3rybk6hfs56gvqcgcn',
        },
      })

      expect(getPostSummary(circlePost)).toContain('circle post:')
    })
  })
})
