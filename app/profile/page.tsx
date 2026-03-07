'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { UserRole } from '@/lib/types'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const roleLabels: Record<string, string> = {
  president: 'President',
  'vice-president': 'Vice President',
  member: 'Member',
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<UserRole>('member')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/')
      } else {
        setUser(currentUser)
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          setRole(userDoc.data().role || 'member')
        }
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-12">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to Feed
          </Link>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Profile Settings</h2>
          <p className="text-muted-foreground">Your account information</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          {/* Account Info */}
          <div>
            <h3 className="text-lg font-serif font-bold text-foreground mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
                <Input
                  type="text"
                  value={user.displayName || ''}
                  disabled
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Role — read only */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-serif font-bold text-foreground mb-2">Society Role</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your role is assigned by the society admin and cannot be changed here.
            </p>
            <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user.displayName || user.email}</p>
                <p className="text-xs text-accent font-medium capitalize">{roleLabels[role] || role}</p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="pt-6 border-t border-border">
            <Button
              onClick={handleLogout}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
