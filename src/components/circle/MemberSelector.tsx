'use client'

import { useState, useMemo } from 'react'
import { useFollowing } from '@/lib/hooks/useFollowing'
import { isValidDid } from '@/domain/shared/did'

interface MemberSelectorProps {
  selectedMembers: string[]
  onChange: (members: string[]) => void
}

export function MemberSelector({
  selectedMembers,
  onChange,
}: MemberSelectorProps) {
  const { data: following, isLoading } = useFollowing()
  const [searchQuery, setSearchQuery] = useState('')
  const [manualDid, setManualDid] = useState('')

  // Filter following list by search query
  const filteredFollowing = useMemo(() => {
    if (!following) return []

    if (!searchQuery) return following

    const query = searchQuery.toLowerCase()
    return following.filter(
      profile =>
        profile.handle.toLowerCase().includes(query) ||
        profile.displayName?.toLowerCase().includes(query) ||
        profile.did.toLowerCase().includes(query)
    )
  }, [following, searchQuery])

  const handleToggleMember = (did: string) => {
    if (selectedMembers.includes(did)) {
      onChange(selectedMembers.filter(m => m !== did))
    } else {
      onChange([...selectedMembers, did])
    }
  }

  const handleAddManualDid = () => {
    const trimmed = manualDid.trim()

    if (!trimmed) {
      return
    }

    if (!isValidDid(trimmed)) {
      alert(
        'Invalid DID format. DIDs must start with "did:" followed by method and identifier.'
      )
      return
    }

    if (selectedMembers.includes(trimmed)) {
      alert('This DID is already in the circle.')
      return
    }

    onChange([...selectedMembers, trimmed])
    setManualDid('')
  }

  const handleRemoveMember = (did: string) => {
    onChange(selectedMembers.filter(m => m !== did))
  }

  if (isLoading) {
    return (
      <div className="text-zinc-600 dark:text-zinc-400 text-sm py-4">
        Loading your following list from Bluesky...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected members */}
      {selectedMembers.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">
            Selected Members ({selectedMembers.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map(did => {
              const profile = following?.find(p => p.did === did)
              return (
                <div
                  key={did}
                  className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-md px-3 py-1.5 text-sm"
                >
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {profile?.handle || did}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(did)}
                    className="text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Search from following */}
      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Add from your Bluesky following
        </label>
        <input
          type="text"
          placeholder="Search by handle or name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />

        {filteredFollowing && filteredFollowing.length > 0 && (
          <div className="mt-2 max-h-64 overflow-y-auto border border-zinc-300 dark:border-zinc-600 rounded-lg">
            {filteredFollowing.map(profile => {
              const isSelected = selectedMembers.includes(profile.did)
              return (
                <button
                  key={profile.did}
                  type="button"
                  onClick={() => handleToggleMember(profile.did)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 last:border-0 ${
                    isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-600 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      @{profile.handle}
                    </div>
                    {profile.displayName && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                        {profile.displayName}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {searchQuery && filteredFollowing && filteredFollowing.length === 0 && (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 py-4 text-center">
            No matches found in your following list.
          </div>
        )}

        {!following || following.length === 0 ? (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 py-4 text-center">
            You dont follow anyone on Bluesky yet. Add members manually by DID
            below.
          </div>
        ) : null}
      </div>

      {/* Manual DID entry */}
      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Or add by DID manually
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="did:plc:..."
            value={manualDid}
            onChange={e => setManualDid(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddManualDid}
            disabled={!manualDid.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
          Example: did:plc:abcd1234efgh5678
        </div>
      </div>
    </div>
  )
}
