'use client'

import { CircleForm } from '@/components/circle/CircleForm'
import { useCreateCircle } from '@/lib/hooks/useCircles'
import type { Circle } from '@/domain/circle/circle'

export default function NewCirclePage() {
  const createCircle = useCreateCircle()

  const handleCreate = async (
    data: Omit<Circle, 'createdAt' | 'updatedAt'>
  ) => {
    await createCircle.mutateAsync(data)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Create New Circle
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Circles are trusted groups where you can share private posts.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
          <CircleForm onSubmit={handleCreate} submitLabel="Create Circle" />
        </div>
      </div>
    </div>
  )
}
