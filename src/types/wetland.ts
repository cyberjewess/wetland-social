/**
 * TypeScript types for Wetland Social custom lexicons
 *
 * These types mirror the lexicon JSON schemas in /lexicons/app/wland/
 * and are used throughout the application for type safety.
 */

/**
 * Post visibility level
 * From: app.wland.defs#postLevel
 */
export type PostLevel = 'global' | 'circle'

/**
 * Reference to a circle record
 * From: app.wland.defs#circleRef
 */
export interface CircleRef {
  uri: string // AT-URI
  cid: string // Content ID
}

/**
 * Post record
 * From: app.wland.post#main
 */
export interface WetlandPost {
  text: string // Max 300 graphemes
  level: PostLevel
  circleRef?: string // AT-URI, required if level='circle'
  createdAt: string // ISO datetime
  langs?: string[] // ISO 639-1 language codes
  facets?: any[] // Rich text facets (future use)
}

/**
 * Circle record
 * From: app.wland.circle#main
 */
export interface WetlandCircle {
  name: string // Max 50 graphemes
  description?: string // Max 200 graphemes
  members: string[] // Array of DIDs (max 1000)
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
}

/**
 * Post with AT Protocol metadata
 */
export interface WetlandPostWithMetadata extends WetlandPost {
  uri: string // AT-URI of the post record
  cid: string // Content ID
  author: string // DID of post author
}

/**
 * Circle with AT Protocol metadata
 */
export interface WetlandCircleWithMetadata extends WetlandCircle {
  uri: string // AT-URI of the circle record
  cid: string // Content ID
  owner: string // DID of circle owner
}

/**
 * Feed post (for display in feeds)
 */
export interface FeedPost {
  post: WetlandPostWithMetadata
  authorHandle?: string // User-friendly handle (e.g., "user.bsky.social")
  circleName?: string // Circle name if level='circle'
}

/**
 * Circle summary (for listing circles)
 */
export interface CircleSummary {
  circle: WetlandCircleWithMetadata
  memberCount: number
  postCount?: number // Optional: number of posts in this circle
}
