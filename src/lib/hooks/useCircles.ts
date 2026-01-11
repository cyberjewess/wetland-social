'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { WetlandCircleWithMetadata } from '@/types/wetland'
import type { Circle } from '@/domain/circle/circle'

/**
 * React Query hooks for circle management
 */

// Query keys
export const circleKeys = {
  all: ['circles'] as const,
  lists: () => [...circleKeys.all, 'list'] as const,
  list: (did: string) => [...circleKeys.lists(), did] as const,
  details: () => [...circleKeys.all, 'detail'] as const,
  detail: (uri: string) => [...circleKeys.details(), uri] as const,
}

/**
 * Fetch all circles for the current user
 */
export function useCircles() {
  return useQuery({
    queryKey: circleKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/circles')
      if (!response.ok) {
        throw new Error('Failed to fetch circles')
      }
      return response.json() as Promise<WetlandCircleWithMetadata[]>
    },
  })
}

/**
 * Fetch a single circle by URI
 */
export function useCircle(uri: string) {
  return useQuery({
    queryKey: circleKeys.detail(uri),
    queryFn: async () => {
      const response = await fetch(`/api/circles/${encodeURIComponent(uri)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch circle')
      }
      return response.json() as Promise<WetlandCircleWithMetadata>
    },
    enabled: !!uri,
  })
}

/**
 * Create a new circle
 */
export function useCreateCircle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (circle: Omit<Circle, 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(circle),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create circle')
      }

      return response.json() as Promise<WetlandCircleWithMetadata>
    },
    onSuccess: () => {
      // Invalidate circles list to refetch
      queryClient.invalidateQueries({ queryKey: circleKeys.lists() })
    },
  })
}

/**
 * Update an existing circle
 */
export function useUpdateCircle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uri,
      updates,
    }: {
      uri: string
      updates: Partial<Omit<Circle, 'createdAt' | 'updatedAt'>>
    }) => {
      const response = await fetch(`/api/circles/${encodeURIComponent(uri)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update circle')
      }

      return response.json() as Promise<WetlandCircleWithMetadata>
    },
    onSuccess: (_, variables) => {
      // Invalidate both lists and the specific circle
      queryClient.invalidateQueries({ queryKey: circleKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: circleKeys.detail(variables.uri),
      })
    },
  })
}

/**
 * Delete a circle
 */
export function useDeleteCircle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uri: string) => {
      const response = await fetch(`/api/circles/${encodeURIComponent(uri)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete circle')
      }
    },
    onSuccess: () => {
      // Invalidate circles list to refetch
      queryClient.invalidateQueries({ queryKey: circleKeys.lists() })
    },
  })
}
