'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const savedState = sessionStorage.getItem('oauth_state')

      if (!code) {
        setError('No authorization code received')
        return
      }

      if (state !== savedState) {
        setError('Invalid state parameter')
        return
      }

      try {
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          throw new Error('Failed to complete authentication')
        }

        sessionStorage.removeItem('oauth_state')
        router.push('/feed/global')
      } catch (err) {
        console.error('Authentication failed:', err)
        setError('Authentication failed. Please try again.')
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
