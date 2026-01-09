/**
 * Post domain entity for Wetland Social
 *
 * Business rules:
 * - Text must be non-empty and <= 300 graphemes
 * - Level must be 'global' or 'circle'
 * - Circle posts must have a circleRef
 * - Global posts must NOT have a circleRef
 * - createdAt must be valid ISO datetime
 */

import { assertGraphemeLimit, countGraphemes } from '../shared/grapheme'
import { type PostLevel, assertValidPostLevel } from './postLevel'

/**
 * Maximum graphemes allowed in post text (MVP limit)
 */
export const MAX_POST_GRAPHEMES = 300

/**
 * Post entity
 */
export interface Post {
  text: string
  level: PostLevel
  circleRef?: string // AT-URI to circle record (required if level="circle")
  createdAt: string // ISO datetime
  langs?: string[] // Optional language codes (e.g., ['en', 'es'])
}

/**
 * Validation errors for posts
 */
export class PostValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PostValidationError'
  }
}

/**
 * Validates post text
 *
 * @param text - The text to validate
 * @throws PostValidationError if invalid
 */
export function validatePostText(text: string): void {
  if (!text || typeof text !== 'string') {
    throw new PostValidationError('Post text is required')
  }

  const trimmed = text.trim()
  if (trimmed.length === 0) {
    throw new PostValidationError('Post text cannot be empty')
  }

  try {
    assertGraphemeLimit(text, MAX_POST_GRAPHEMES, 'Post text')
  } catch (err) {
    throw new PostValidationError((err as Error).message)
  }
}

/**
 * Validates post level and circleRef consistency
 *
 * @param level - The post level
 * @param circleRef - Optional circle reference
 * @throws PostValidationError if invalid
 */
export function validatePostLevel(level: PostLevel, circleRef?: string): void {
  try {
    assertValidPostLevel(level)
  } catch (err) {
    throw new PostValidationError((err as Error).message)
  }

  if (level === 'circle' && !circleRef) {
    throw new PostValidationError('Circle posts must have a circleRef')
  }

  if (level === 'global' && circleRef) {
    throw new PostValidationError('Global posts cannot have a circleRef')
  }
}

/**
 * Validates ISO datetime format
 *
 * @param dateTime - The datetime string to validate
 * @throws PostValidationError if invalid
 */
export function validateDateTime(dateTime: string): void {
  if (!dateTime || typeof dateTime !== 'string') {
    throw new PostValidationError('createdAt is required')
  }

  const date = new Date(dateTime)
  if (isNaN(date.getTime())) {
    throw new PostValidationError('createdAt must be a valid ISO datetime')
  }
}

/**
 * Validates a complete post entity
 *
 * @param post - The post to validate
 * @throws PostValidationError if invalid
 */
export function validatePost(post: Post): void {
  validatePostText(post.text)
  validatePostLevel(post.level, post.circleRef)
  validateDateTime(post.createdAt)

  // Validate language codes if provided
  if (post.langs) {
    if (!Array.isArray(post.langs)) {
      throw new PostValidationError('langs must be an array')
    }

    if (post.langs.some(lang => typeof lang !== 'string' || lang.length !== 2)) {
      throw new PostValidationError('langs must be an array of 2-letter ISO language codes')
    }
  }
}

/**
 * Creates a new post entity with validation
 *
 * @param params - Post creation parameters
 * @returns Validated post entity
 * @throws PostValidationError if validation fails
 */
export function createPost(params: {
  text: string
  level: PostLevel
  circleRef?: string
  langs?: string[]
}): Post {
  const post: Post = {
    text: params.text,
    level: params.level,
    circleRef: params.circleRef,
    createdAt: new Date().toISOString(),
    langs: params.langs,
  }

  validatePost(post)

  return post
}

/**
 * Gets a human-readable summary of a post
 *
 * @param post - The post to summarize
 * @returns Summary string (truncated to 50 graphemes)
 */
export function getPostSummary(post: Post): string {
  const graphemeCount = countGraphemes(post.text)
  const preview = graphemeCount > 50 ? post.text.slice(0, 50) + '...' : post.text
  return `${post.level} post: ${preview}`
}
