'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePathname } from 'next/navigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/circles"
              className="text-xl font-bold text-emerald-600 dark:text-emerald-400"
            >
              Wetland Social
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-6">
              <Link
                href="/circles"
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith('/circles')
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Circles
              </Link>

              {/* User info */}
              {user && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    @{user.handle}
                  </span>
                  <button
                    onClick={signOut}
                    className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {children}
    </div>
  )
}
