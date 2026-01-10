'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MemberSelector } from './MemberSelector'
import { countGraphemes } from '@/domain/shared/grapheme'
import {
  MAX_CIRCLE_NAME_GRAPHEMES,
  MAX_CIRCLE_DESCRIPTION_GRAPHEMES,
} from '@/domain/circle/circleRules'
import type { Circle } from '@/domain/circle/circle'

interface CircleFormProps {
  initialData?: Partial<Circle>
  uri?: string // For editing existing circles
  onSubmit: (data: Omit<Circle, 'createdAt' | 'updatedAt'>) => Promise<void>
  submitLabel?: string
}

export function CircleForm({
  initialData,
  uri,
  onSubmit,
  submitLabel = 'Create Circle',
}: CircleFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [members, setMembers] = useState<string[]>(initialData?.members || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameGraphemes = countGraphemes(name)
  const descriptionGraphemes = countGraphemes(description)

  const nameError =
    nameGraphemes > MAX_CIRCLE_NAME_GRAPHEMES
      ? `Name exceeds ${MAX_CIRCLE_NAME_GRAPHEMES} graphemes`
      : name.trim().length === 0
        ? 'Name is required'
        : null

  const descriptionError =
    descriptionGraphemes > MAX_CIRCLE_DESCRIPTION_GRAPHEMES
      ? `Description exceeds ${MAX_CIRCLE_DESCRIPTION_GRAPHEMES} graphemes`
      : null

  const canSubmit =
    !nameError && !descriptionError && !isSubmitting && name.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        members,
      })

      router.push('/circles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save circle')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      {/* Circle name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
        >
          Circle Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Close Friends, Work Team"
          maxLength={60} // Slightly more than grapheme limit for safety
          className={`w-full px-4 py-2 rounded-lg border ${
            nameError
              ? 'border-red-500 dark:border-red-400'
              : 'border-zinc-300 dark:border-zinc-600'
          } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
        />
        <div className="flex justify-between mt-1">
          <div className="text-sm text-red-600 dark:text-red-400">{nameError || '\u00A0'}</div>
          <div
            className={`text-sm ${
              nameGraphemes > MAX_CIRCLE_NAME_GRAPHEMES
                ? 'text-red-600 dark:text-red-400'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {nameGraphemes} / {MAX_CIRCLE_NAME_GRAPHEMES}
          </div>
        </div>
      </div>

      {/* Circle description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this circle for?"
          rows={3}
          maxLength={220}
          className={`w-full px-4 py-2 rounded-lg border ${
            descriptionError
              ? 'border-red-500 dark:border-red-400'
              : 'border-zinc-300 dark:border-zinc-600'
          } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none`}
        />
        <div className="flex justify-between mt-1">
          <div className="text-sm text-red-600 dark:text-red-400">
            {descriptionError || '\u00A0'}
          </div>
          <div
            className={`text-sm ${
              descriptionGraphemes > MAX_CIRCLE_DESCRIPTION_GRAPHEMES
                ? 'text-red-600 dark:text-red-400'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {descriptionGraphemes} / {MAX_CIRCLE_DESCRIPTION_GRAPHEMES}
          </div>
        </div>
      </div>

      {/* Member selector */}
      <div>
        <div className="mb-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Members</span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">(optional)</span>
        </div>
        <MemberSelector selectedMembers={members} onChange={setMembers} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
