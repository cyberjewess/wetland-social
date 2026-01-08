'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (!code) {
        setError('No authorization code received')
        return
      }

      try {
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to complete authentication')
        }

        router.push('/feed/global')
      } catch (err) {
        console.error('Authentication failed:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Authentication failed. Please try again.'
        )
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Authentication Error
          </h1>
          <p className="text-foreground/60 mb-6">{error}</p>
          <a
            href="/auth/login"
            className="text-primary hover:text-primary-dark"
          >
            Try again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p className="text-foreground/60">Completing sign in...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
            <p className="text-foreground/60">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
