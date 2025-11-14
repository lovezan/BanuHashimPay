'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { UserRole } from '@/lib/types'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<UserRole>('member')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
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

  const handleSaveRole = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage('')

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role,
      })
      setMessage('Role updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage('Error updating role: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  if (loading) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Feed
          </Link>
          
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
            Profile Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your account and society role
          </p>
        </div>

        {/* Profile Card */}
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

          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-serif font-bold text-foreground mb-4">Society Role</h3>
            <p className="text-sm text-muted-foreground mb-4">Select your role in the society (this can be edited anytime)</p>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(['president', 'vice-president', 'member'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-lg font-medium text-sm transition-all ${
                    role === r
                      ? 'bg-accent text-accent-foreground border-2 border-accent shadow-md'
                      : 'bg-secondary text-secondary-foreground border-2 border-border hover:border-accent/50'
                  }`}
                >
                  {r === 'vice-president' ? 'V. President' : r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-lg mb-4 ${message.includes('Error') ? 'bg-destructive/15 text-destructive' : 'bg-accent/15 text-accent'}`}>
                {message}
              </div>
            )}

            <Button
              onClick={handleSaveRole}
              disabled={saving}
              className="w-full bg-accent text-accent-foreground hover:bg-primary"
            >
              {saving ? 'Saving...' : 'Save Role'}
            </Button>
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
