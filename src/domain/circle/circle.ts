/**
 * Circle domain entity for Wetland Social
 *
 * Business rules:
 * - Name must be non-empty and <= 50 graphemes
 * - Description optional, <= 200 graphemes if provided
 * - Members must be valid DIDs
 * - Maximum 1000 members per circle
 * - Maximum 5 circles per user (enforced at creation time)
 */

import { assertGraphemeLimit } from '../shared/grapheme'
import { areValidDids } from '../shared/did'
import {
  assertMemberLimit,
  MAX_CIRCLE_NAME_GRAPHEMES,
  MAX_CIRCLE_DESCRIPTION_GRAPHEMES,
} from './circleRules'

/**
 * Circle entity
 */
export interface Circle {
  name: string
  description?: string
  members: string[] // Array of DIDs
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
}

/**
 * Validation errors for circles
 */
export class CircleValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CircleValidationError'
  }
}

/**
 * Validates circle name
 *
 * @param name - The name to validate
 * @throws CircleValidationError if invalid
 */
export function validateCircleName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new CircleValidationError('Circle name is required')
  }

  const trimmed = name.trim()
  if (trimmed.length === 0) {
    throw new CircleValidationError('Circle name cannot be empty')
  }

  try {
    assertGraphemeLimit(name, MAX_CIRCLE_NAME_GRAPHEMES, 'Circle name')
  } catch (err) {
    throw new CircleValidationError((err as Error).message)
  }
}

/**
 * Validates circle description
 *
 * @param description - The description to validate
 * @throws CircleValidationError if invalid
 */
export function validateCircleDescription(description?: string): void {
  if (!description) {
    return // Description is optional
  }

  if (typeof description !== 'string') {
    throw new CircleValidationError('Circle description must be a string')
  }

  try {
    assertGraphemeLimit(
      description,
      MAX_CIRCLE_DESCRIPTION_GRAPHEMES,
      'Circle description'
    )
  } catch (err) {
    throw new CircleValidationError((err as Error).message)
  }
}

/**
 * Validates circle members
 *
 * @param members - Array of member DIDs
 * @throws CircleValidationError if invalid
 */
export function validateCircleMembers(members: string[]): void {
  if (!Array.isArray(members)) {
    throw new CircleValidationError('Circle members must be an array')
  }

  try {
    assertMemberLimit(members.length)
  } catch (err) {
    throw new CircleValidationError((err as Error).message)
  }

  if (!areValidDids(members)) {
    throw new CircleValidationError('All circle members must be valid DIDs')
  }

  // Check for duplicate members
  const uniqueMembers = new Set(members)
  if (uniqueMembers.size !== members.length) {
    throw new CircleValidationError('Circle members must be unique')
  }
}

/**
 * Validates complete circle entity
 *
 * @param circle - The circle to validate
 * @throws CircleValidationError if invalid
 */
export function validateCircle(circle: Circle): void {
  validateCircleName(circle.name)
  validateCircleDescription(circle.description)
  validateCircleMembers(circle.members)

  // Validate timestamps
  if (!circle.createdAt || isNaN(new Date(circle.createdAt).getTime())) {
    throw new CircleValidationError('createdAt must be a valid ISO datetime')
  }

  if (!circle.updatedAt || isNaN(new Date(circle.updatedAt).getTime())) {
    throw new CircleValidationError('updatedAt must be a valid ISO datetime')
  }
}

/**
 * Creates a new circle entity with validation
 *
 * @param params - Circle creation parameters
 * @returns Validated circle entity
 * @throws CircleValidationError if validation fails
 */
export function createCircle(params: {
  name: string
  description?: string
  members: string[]
}): Circle {
  const now = new Date().toISOString()

  const circle: Circle = {
    name: params.name,
    description: params.description,
    members: params.members,
    createdAt: now,
    updatedAt: now,
  }

  validateCircle(circle)

  return circle
}

/**
 * Updates a circle entity with validation
 *
 * @param circle - Existing circle
 * @param updates - Fields to update
 * @returns Updated circle entity
 * @throws CircleValidationError if validation fails
 */
export function updateCircle(
  circle: Circle,
  updates: {
    name?: string
    description?: string
    members?: string[]
  }
): Circle {
  const updated: Circle = {
    ...circle,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  validateCircle(updated)

  return updated
}

/**
 * Checks if a DID is a member of a circle
 *
 * @param circle - The circle to check
 * @param did - The DID to look for
 * @returns true if member, false otherwise
 */
export function isMember(circle: Circle, did: string): boolean {
  return circle.members.includes(did)
}

/**
 * Adds a member to a circle
 *
 * @param circle - The circle to update
 * @param did - The DID to add
 * @returns Updated circle
 * @throws CircleValidationError if validation fails
 */
export function addMember(circle: Circle, did: string): Circle {
  if (isMember(circle, did)) {
    throw new CircleValidationError('Member already exists in circle')
  }

  return updateCircle(circle, {
    members: [...circle.members, did],
  })
}

/**
 * Removes a member from a circle
 *
 * @param circle - The circle to update
 * @param did - The DID to remove
 * @returns Updated circle
 * @throws CircleValidationError if member doesn't exist
 */
export function removeMember(circle: Circle, did: string): Circle {
  if (!isMember(circle, did)) {
    throw new CircleValidationError('Member does not exist in circle')
  }

  return updateCircle(circle, {
    members: circle.members.filter(member => member !== did),
  })
}
