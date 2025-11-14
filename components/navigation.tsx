'use client'

import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Navigation({ user }: { user: any }) {
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-serif font-bold text-foreground">
          Banuhashim
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/transactions"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Transactions
          </Link>
          <Link
            href="/account"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            My Payments
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm text-secondary-foreground hover:bg-muted transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs">{user?.displayName || 'User'}</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 bg-card border border-border rounded-lg shadow-md p-2 min-w-48">
                <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border mb-2">
                  {user?.email}
                </div>
                <Link
                  href="/profile"
                  className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded transition-colors"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
