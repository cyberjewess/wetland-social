'use client'

import Link from 'next/link'
import { useCircles, useDeleteCircle } from '@/lib/hooks/useCircles'
import { MAX_CIRCLES_PER_USER } from '@/domain/circle/circleRules'

export default function CirclesPage() {
  const { data: circles, isLoading, error } = useCircles()
  const deleteCircle = useDeleteCircle()

  const circleCount = circles?.length ?? 0
  const canCreateMore = circleCount < MAX_CIRCLES_PER_USER

  const handleDelete = async (uri: string, name: string) => {
    if (!confirm(`Delete circle "${name}"? This cannot be undone.`)) {
      return
    }

    try {
      await deleteCircle.mutateAsync(uri)
    } catch (err) {
      alert(
        'Failed to delete circle: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-zinc-600 dark:text-zinc-400">
          Loading circles...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-red-600 dark:text-red-400">
          Failed to load circles. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Your Circles
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              {circleCount} of {MAX_CIRCLES_PER_USER} circles created
            </p>
          </div>

          <Link
            href="/circles/new"
            className={`flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
              canCreateMore
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900'
                : 'bg-zinc-300 text-zinc-500 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-500'
            }`}
            aria-disabled={!canCreateMore}
            onClick={e => !canCreateMore && e.preventDefault()}
          >
            + Create Circle
          </Link>
        </div>

        {/* Circles list */}
        {circles && circles.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-12 text-center">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              No circles yet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Create your first circle to share posts with trusted groups.
            </p>
            <Link
              href="/circles/new"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              + Create Your First Circle
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {circles?.map(circle => (
              <div
                key={circle.uri}
                className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {circle.name}
                    </h3>
                    {circle.description && (
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        {circle.description}
                      </p>
                    )}
                    <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
                      {circle.members.length}{' '}
                      {circle.members.length === 1 ? 'member' : 'members'}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/circles/${encodeURIComponent(circle.uri)}/edit`}
                      className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(circle.uri, circle.name)}
                      disabled={deleteCircle.isPending}
                      className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 disabled:opacity-50"
                    >
                      {deleteCircle.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
