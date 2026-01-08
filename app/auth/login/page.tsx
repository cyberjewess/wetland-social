'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async () => {
    setLoading(true)
    try {
      // Generate random state for CSRF protection
      const state = Math.random().toString(36).substring(7)
      sessionStorage.setItem('oauth_state', state)

      // Redirect to OAuth authorization
      const response = await fetch(`/api/auth/authorize?state=${state}`)
      const { url } = await response.json()

      window.location.href = url
    } catch (err) {
      console.error('Sign in failed:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Wetland Social
          </h1>
          <p className="text-foreground/60">
            Stratified social media on AT Protocol
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in with Bluesky'}
          </button>
        </div>

        <p className="text-center text-sm text-foreground/60">
          Sign in with your existing Bluesky account to get started
        </p>
      </div>
    </div>
  )
}
