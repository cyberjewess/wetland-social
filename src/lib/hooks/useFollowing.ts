'use client'

import { useQuery } from '@tanstack/react-query'
import type { ProfileInfo } from '@/lib/atproto/repositories/graphRepository'

/**
 * React Query hooks for social graph operations
 */

/**
 * Fetch the user's following list from Bluesky
 * Used to bootstrap circle members from existing social graph
 */
export function useFollowing() {
  return useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const response = await fetch('/api/following')
      if (!response.ok) {
        throw new Error('Failed to fetch following list')
      }
      return response.json() as Promise<ProfileInfo[]>
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

/**
 * Search for profiles by handle or DID
 */
export function useSearchProfiles(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['profiles', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return []
      }

      const response = await fetch(
        `/api/profiles/search?q=${encodeURIComponent(query)}`
      )
      if (!response.ok) {
        throw new Error('Failed to search profiles')
      }
      return response.json() as Promise<ProfileInfo[]>
    },
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 30 * 1000, // Cache for 30 seconds
  })
}
