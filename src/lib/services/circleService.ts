import { AtpAgent } from '@atproto/api'
import {
  createCircleRepository,
  CircleRepository,
} from '@/lib/atproto/repositories/circleRepository'
import { validateCircle, type Circle } from '@/domain/circle/circle'
import { assertCircleLimit } from '@/domain/circle/circleRules'
import type { WetlandCircleWithMetadata } from '@/types/wetland'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'circle-service' })

/**
 * Service for circle management
 * Orchestrates domain validation and repository operations
 */
export class CircleService {
  private repository: CircleRepository

  constructor(agent: AtpAgent) {
    this.repository = createCircleRepository(agent)
  }

  /**
   * Get all circles for a user
   */
  async getCircles(did: string): Promise<WetlandCircleWithMetadata[]> {
    logger.debug({ did }, 'Getting circles')
    return this.repository.listCircles(did)
  }

  /**
   * Get a single circle by URI
   */
  async getCircle(uri: string): Promise<WetlandCircleWithMetadata | null> {
    logger.debug({ uri }, 'Getting circle')
    return this.repository.getCircle(uri)
  }

  /**
   * Create a new circle
   * Validates domain rules before creating
   */
  async createCircle(
    did: string,
    circle: Omit<Circle, 'createdAt' | 'updatedAt'>
  ): Promise<WetlandCircleWithMetadata> {
    logger.info({ did, name: circle.name }, 'Creating circle')

    // Check max circles limit
    const existingCircles = await this.repository.listCircles(did)
    assertCircleLimit(existingCircles.length)

    // Validate circle data (domain layer)
    const now = new Date().toISOString()
    const fullCircle: Circle = {
      ...circle,
      createdAt: now,
      updatedAt: now,
    }
    validateCircle(fullCircle)

    // Create via repository
    return this.repository.createCircle(did, circle)
  }

  /**
   * Update an existing circle
   * Validates domain rules before updating
   */
  async updateCircle(
    uri: string,
    updates: Partial<Omit<Circle, 'createdAt' | 'updatedAt'>>
  ): Promise<WetlandCircleWithMetadata> {
    logger.info({ uri }, 'Updating circle')

    // Get current circle
    const current = await this.repository.getCircle(uri)
    if (!current) {
      throw new Error('Circle not found')
    }

    // Merge updates and validate
    const updated: Circle = {
      name: updates.name ?? current.name,
      description: updates.description ?? current.description,
      members: updates.members ?? current.members,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    validateCircle(updated)

    // Update via repository
    return this.repository.updateCircle(uri, updates)
  }

  /**
   * Delete a circle
   */
  async deleteCircle(uri: string): Promise<void> {
    logger.info({ uri }, 'Deleting circle')
    await this.repository.deleteCircle(uri)
  }

  /**
   * Get circles where a DID is a member
   */
  async getCirclesWithMember(
    ownerDid: string,
    memberDid: string
  ): Promise<WetlandCircleWithMetadata[]> {
    logger.debug({ ownerDid, memberDid }, 'Getting circles with member')
    return this.repository.getCirclesWithMember(ownerDid, memberDid)
  }
}

/**
 * Create a CircleService instance from an authenticated agent
 */
export function createCircleService(agent: AtpAgent): CircleService {
  return new CircleService(agent)
}
