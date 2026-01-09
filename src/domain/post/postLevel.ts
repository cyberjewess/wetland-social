/**
 * Post visibility levels for Wetland Social
 *
 * MVP includes only Global and Circle levels.
 * Future: Radius (geofence) and Bioregion (ecosystem) levels.
 */

/**
 * Post visibility level
 * - global: Visible to everyone (traditional public post)
 * - circle: Visible only within a specific circle (trusted group)
 */
export type PostLevel = 'global' | 'circle'

/**
 * All valid post levels
 */
export const POST_LEVELS: readonly PostLevel[] = ['global', 'circle'] as const

/**
 * Validates if a string is a valid post level
 *
 * @param level - The level to validate
 * @returns true if valid, false otherwise
 */
export function isValidPostLevel(level: string): level is PostLevel {
  return POST_LEVELS.includes(level as PostLevel)
}

/**
 * Asserts that a post level is valid
 *
 * @param level - The level to validate
 * @throws Error if invalid
 */
export function assertValidPostLevel(level: string): asserts level is PostLevel {
  if (!isValidPostLevel(level)) {
    throw new Error(`Invalid post level: ${level}. Must be one of: ${POST_LEVELS.join(', ')}`)
  }
}
