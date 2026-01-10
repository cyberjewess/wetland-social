/**
 * Business rules for circles in Wetland Social
 */

/**
 * Maximum number of circles a user can create (MVP limit)
 */
export const MAX_CIRCLES_PER_USER = 5

/**
 * Maximum number of members in a circle
 */
export const MAX_CIRCLE_MEMBERS = 1000

/**
 * Maximum graphemes for circle name
 */
export const MAX_CIRCLE_NAME_GRAPHEMES = 50

/**
 * Maximum graphemes for circle description
 */
export const MAX_CIRCLE_DESCRIPTION_GRAPHEMES = 200

/**
 * Validates that a user hasn't exceeded their circle limit
 *
 * @param currentCircleCount - Number of circles user currently has
 * @throws Error if limit exceeded
 */
export function assertCircleLimit(currentCircleCount: number): void {
  if (currentCircleCount >= MAX_CIRCLES_PER_USER) {
    throw new Error(
      `Cannot create more circles. Maximum allowed: ${MAX_CIRCLES_PER_USER}`
    )
  }
}

/**
 * Validates that circle membership count is within limits
 *
 * @param memberCount - Number of members in circle
 * @throws Error if limit exceeded
 */
export function assertMemberLimit(memberCount: number): void {
  if (memberCount > MAX_CIRCLE_MEMBERS) {
    throw new Error(
      `Circle cannot have more than ${MAX_CIRCLE_MEMBERS} members (got ${memberCount})`
    )
  }

  if (memberCount < 0) {
    throw new Error('Circle member count cannot be negative')
  }
}

/**
 * Checks if user can create another circle
 *
 * @param currentCircleCount - Number of circles user currently has
 * @returns true if user can create more circles, false otherwise
 */
export function canCreateMoreCircles(currentCircleCount: number): boolean {
  return currentCircleCount < MAX_CIRCLES_PER_USER
}
