'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface User {
  did: string
  handle: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Failed to check auth:', err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/auth/login')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signOut,
  }
}
