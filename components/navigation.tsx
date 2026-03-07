'use client'

import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isSuperAdmin } from '@/lib/admin'
import { useAdminMode } from '@/lib/admin-context'
import { AnimatedThemeToggler } from './animated-theme-toggler'

export default function Navigation({ user }: { user: any }) {
  const [showMenu, setShowMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { adminMode, toggleAdminMode } = useAdminMode()
  const canToggleAdmin = isSuperAdmin(user?.email)

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="text-lg sm:text-xl font-serif font-bold text-foreground">
          Banuhashim
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Feed
          </Link>
          {/* <Link
            href="/directory"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Directory
          </Link> */}
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
          <Link
            href="/unpaid"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Unpaid
          </Link>

          {/* Dark / Light mode toggle */}
          <AnimatedThemeToggler />

          {canToggleAdmin && adminMode && (
            <Link
              href="/admin"
              className="text-sm text-accent font-medium hover:text-foreground transition-colors"
            >
              Manage Roles
            </Link>
          )}

          {canToggleAdmin && (
            <button
              onClick={toggleAdminMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                adminMode
                  ? 'bg-accent text-accent-foreground border-accent shadow-md'
                  : 'bg-secondary text-muted-foreground border-border hover:border-accent/50'
              }`}
              title={adminMode ? 'Admin mode ON — click to switch to normal view' : 'Click to enable admin mode'}
            >
              <span className={`w-2 h-2 rounded-full ${adminMode ? 'bg-accent-foreground' : 'bg-muted-foreground'}`}></span>
              {adminMode ? 'Admin ON' : 'Admin OFF'}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm text-secondary-foreground hover:bg-muted transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs">{user?.displayName || 'User'}</span>
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border p-4 space-y-3">
          <Link
            href="/"
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Feed
          </Link>
          {/* <Link
            href="/directory"
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Directory
          </Link> */}
          <Link
            href="/transactions"
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Transactions
          </Link>
          <Link
            href="/account"
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            My Payments
          </Link>
          <Link
            href="/unpaid"
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Unpaid
          </Link>
          <Link
            href="/profile"
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Profile
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <AnimatedThemeToggler onClick={() => setMobileMenuOpen(false)} />
          </div>
          {canToggleAdmin && adminMode && (
            <Link
              href="/admin"
              className="block text-sm text-accent font-medium hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Manage Roles
            </Link>
          )}
          {canToggleAdmin && (
            <button
              onClick={() => { toggleAdminMode(); setMobileMenuOpen(false) }}
              className={`w-full text-left text-sm font-semibold px-3 py-2 rounded transition-colors ${
                adminMode
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {adminMode ? 'Admin Mode: ON (tap to disable)' : 'Admin Mode: OFF (tap to enable)'}
            </button>
          )}
          <button
            onClick={() => {
              handleLogout()
              setMobileMenuOpen(false)
            }}
            className="block w-full text-left text-sm text-destructive hover:text-destructive/80 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}
