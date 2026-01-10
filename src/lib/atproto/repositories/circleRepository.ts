import { AtpAgent } from '@atproto/api'
import { TID } from '@atproto/common'
import { createLogger } from '@/lib/logger'
import type { WetlandCircle, WetlandCircleWithMetadata } from '@/types/wetland'

const logger = createLogger({ service: 'circle-repository' })

const CIRCLE_COLLECTION = 'app.wland.circle'

/**
 * Repository for Circle CRUD operations via AT Protocol PDS
 */
export class CircleRepository {
  constructor(private agent: AtpAgent) {}

  /**
   * List all circles owned by a DID
   */
  async listCircles(did: string): Promise<WetlandCircleWithMetadata[]> {
    try {
      logger.debug({ did }, 'Listing circles')

      const response = await this.agent.com.atproto.repo.listRecords({
        repo: did,
        collection: CIRCLE_COLLECTION,
        limit: 100, // Max 5 circles per user, but fetch more for safety
      })

      return response.data.records.map((record) => ({
        ...(record.value as unknown as WetlandCircle),
        uri: record.uri,
        cid: record.cid,
        owner: did,
      }))
    } catch (err) {
      logger.error({ error: err, did }, 'Failed to list circles')
      throw new Error('Failed to list circles')
    }
  }

  /**
   * Get a single circle by AT-URI
   */
  async getCircle(uri: string): Promise<WetlandCircleWithMetadata | null> {
    try {
      logger.debug({ uri }, 'Getting circle')

      // Parse AT-URI: at://did:plc:xxx/app.wland.circle/tid
      const parts = uri.replace('at://', '').split('/')
      if (parts.length !== 3) {
        throw new Error('Invalid AT-URI format')
      }

      const [did, collection, rkey] = parts

      const response = await this.agent.com.atproto.repo.getRecord({
        repo: did,
        collection,
        rkey,
      })

      if (!response.data.value) {
        return null
      }

      return {
        ...(response.data.value as unknown as WetlandCircle),
        uri: response.data.uri,
        cid: response.data.cid,
        owner: did,
      }
    } catch (err) {
      logger.error({ error: err, uri }, 'Failed to get circle')
      return null
    }
  }

  /**
   * Create a new circle record
   */
  async createCircle(
    did: string,
    circle: Omit<WetlandCircle, 'createdAt' | 'updatedAt'>
  ): Promise<WetlandCircleWithMetadata> {
    try {
      logger.info({ did, name: circle.name }, 'Creating circle')

      const now = new Date().toISOString()
      const record: WetlandCircle = {
        ...circle,
        createdAt: now,
        updatedAt: now,
      }

      const response = await this.agent.com.atproto.repo.createRecord({
        repo: did,
        collection: CIRCLE_COLLECTION,
        rkey: TID.nextStr(), // Generate timestamp-based ID
        record,
      })

      logger.info(
        { uri: response.data.uri, cid: response.data.cid },
        'Circle created'
      )

      return {
        ...record,
        uri: response.data.uri,
        cid: response.data.cid,
        owner: did,
      }
    } catch (err) {
      logger.error({ error: err, did }, 'Failed to create circle')
      throw new Error('Failed to create circle')
    }
  }

  /**
   * Update an existing circle record
   */
  async updateCircle(
    uri: string,
    updates: Partial<Omit<WetlandCircle, 'createdAt' | 'updatedAt'>>
  ): Promise<WetlandCircleWithMetadata> {
    try {
      logger.info({ uri }, 'Updating circle')

      // Get current circle
      const current = await this.getCircle(uri)
      if (!current) {
        throw new Error('Circle not found')
      }

      // Parse AT-URI for repo and rkey
      const parts = uri.replace('at://', '').split('/')
      const [did, collection, rkey] = parts

      // Merge updates with current record
      const record: WetlandCircle = {
        name: updates.name ?? current.name,
        description: updates.description ?? current.description,
        members: updates.members ?? current.members,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      }

      const response = await this.agent.com.atproto.repo.putRecord({
        repo: did,
        collection,
        rkey,
        record,
      })

      logger.info({ uri, cid: response.data.cid }, 'Circle updated')

      return {
        ...record,
        uri,
        cid: response.data.cid,
        owner: did,
      }
    } catch (err) {
      logger.error({ error: err, uri }, 'Failed to update circle')
      throw new Error('Failed to update circle')
    }
  }

  /**
   * Delete a circle record
   */
  async deleteCircle(uri: string): Promise<void> {
    try {
      logger.info({ uri }, 'Deleting circle')

      // Parse AT-URI
      const parts = uri.replace('at://', '').split('/')
      const [did, collection, rkey] = parts

      await this.agent.com.atproto.repo.deleteRecord({
        repo: did,
        collection,
        rkey,
      })

      logger.info({ uri }, 'Circle deleted')
    } catch (err) {
      logger.error({ error: err, uri }, 'Failed to delete circle')
      throw new Error('Failed to delete circle')
    }
  }

  /**
   * Get circles where a DID is a member
   */
  async getCirclesWithMember(
    ownerDid: string,
    memberDid: string
  ): Promise<WetlandCircleWithMetadata[]> {
    try {
      logger.debug({ ownerDid, memberDid }, 'Getting circles with member')

      const allCircles = await this.listCircles(ownerDid)
      return allCircles.filter((circle) => circle.members.includes(memberDid))
    } catch (err) {
      logger.error(
        { error: err, ownerDid, memberDid },
        'Failed to get circles with member'
      )
      throw new Error('Failed to get circles with member')
    }
  }
}

/**
 * Create a CircleRepository instance from an authenticated agent
 */
export function createCircleRepository(agent: AtpAgent): CircleRepository {
  return new CircleRepository(agent)
}
