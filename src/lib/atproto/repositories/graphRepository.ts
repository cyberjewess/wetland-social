import { AtpAgent } from '@atproto/api'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ service: 'graph-repository' })

export interface ProfileInfo {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

/**
 * Repository for social graph operations (following, followers, etc.)
 */
export class GraphRepository {
  constructor(private agent: AtpAgent) {}

  /**
   * Get list of profiles that a user follows (Bluesky following list)
   * This is used to bootstrap circle members from existing social graph
   */
  async getFollowing(
    did: string,
    cursor?: string
  ): Promise<{ profiles: ProfileInfo[]; cursor?: string }> {
    try {
      logger.debug({ did, cursor }, 'Getting following list')

      const response = await this.agent.app.bsky.graph.getFollows({
        actor: did,
        limit: 100,
        cursor,
      })

      const profiles: ProfileInfo[] = response.data.follows.map(follow => ({
        did: follow.did,
        handle: follow.handle,
        displayName: follow.displayName,
        avatar: follow.avatar,
      }))

      logger.debug(
        { did, count: profiles.length, hasMore: !!response.data.cursor },
        'Retrieved following list'
      )

      return {
        profiles,
        cursor: response.data.cursor,
      }
    } catch (err) {
      logger.error({ error: err, did }, 'Failed to get following list')
      throw new Error('Failed to get following list')
    }
  }

  /**
   * Get all following (fetch all pages)
   * Useful for small following lists when you need complete data
   */
  async getAllFollowing(did: string): Promise<ProfileInfo[]> {
    try {
      logger.debug({ did }, 'Getting all following')

      const allProfiles: ProfileInfo[] = []
      let cursor: string | undefined

      do {
        const result = await this.getFollowing(did, cursor)
        allProfiles.push(...result.profiles)
        cursor = result.cursor
      } while (cursor)

      logger.info(
        { did, totalCount: allProfiles.length },
        'Retrieved all following'
      )

      return allProfiles
    } catch (err) {
      logger.error({ error: err, did }, 'Failed to get all following')
      throw new Error('Failed to get all following')
    }
  }

  /**
   * Search for a profile by handle or DID
   */
  async searchProfiles(query: string): Promise<ProfileInfo[]> {
    try {
      logger.debug({ query }, 'Searching profiles')

      const response = await this.agent.app.bsky.actor.searchActors({
        term: query,
        limit: 25,
      })

      const profiles: ProfileInfo[] = response.data.actors.map(actor => ({
        did: actor.did,
        handle: actor.handle,
        displayName: actor.displayName,
        avatar: actor.avatar,
      }))

      logger.debug({ query, count: profiles.length }, 'Search completed')

      return profiles
    } catch (err) {
      logger.error({ error: err, query }, 'Failed to search profiles')
      throw new Error('Failed to search profiles')
    }
  }
}

/**
 * Create a GraphRepository instance from an authenticated agent
 */
export function createGraphRepository(agent: AtpAgent): GraphRepository {
  return new GraphRepository(agent)
}
