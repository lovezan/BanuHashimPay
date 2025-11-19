'use client'

import { useEffect, useState } from 'react'
import { query, collection, onSnapshot } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { User, Transaction } from '@/lib/types'
import { useThemeLanguage } from '@/lib/use-theme-language'
import { getTranslations } from '@/lib/i18n'
import Navigation from '@/components/navigation'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'

export default function DirectoryPage() {
  const [users, setUsers] = useState<Record<string, User>>({})
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { language } = useThemeLanguage()
  const t = getTranslations(language)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/')
      }
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const q = query(collection(db, 'users'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersMap: Record<string, User> = {}
      snapshot.docs.forEach((doc) => {
        usersMap[doc.id] = doc.data() as User
      })
      setUsers(usersMap)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'transactions'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        }
      }) as Transaction[]
      setTransactions(docs)
    })
    return () => unsubscribe()
  }, [])

  const membersByRole = {
    presidents: Object.entries(users).filter(([, u]) => u.role === 'president'),
    vicePresidents: Object.entries(users).filter(([, u]) => u.role === 'vice-president'),
    members: Object.entries(users).filter(([, u]) => u.role === 'member'),
  }

  const getUserMonthlyTotal = (userId: string) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    return transactions
      .filter((txn) => {
        const txnDate = typeof txn.timestamp === 'string' ? new Date(txn.timestamp) : new Date(txn.timestamp)
        return txnDate.getMonth() === currentMonth && 
               txnDate.getFullYear() === currentYear && 
               txn.userId === userId
      })
      .reduce((sum, txn) => sum + txn.amount, 0)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-2">
            Society Directory
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View all members, leadership, and their contributions
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading directory...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Presidents */}
            <section>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-4">
                President
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {membersByRole.presidents.length > 0 ? (
                  membersByRole.presidents.map(([id, member]) => (
                    <div key={id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{member.displayName || member.email}</h3>
                          <p className="text-xs text-accent font-medium">President</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">This Month</p>
                          <p className="text-lg font-bold text-accent">₹{getUserMonthlyTotal(id).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground">No president assigned</p>
                  </div>
                )}
              </div>
            </section>

            {/* Vice Presidents */}
            <section>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-4">
                Vice President
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {membersByRole.vicePresidents.length > 0 ? (
                  membersByRole.vicePresidents.map(([id, member]) => (
                    <div key={id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{member.displayName || member.email}</h3>
                          <p className="text-xs text-primary font-medium">Vice President</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">This Month</p>
                          <p className="text-lg font-bold text-primary">₹{getUserMonthlyTotal(id).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground">No vice president assigned</p>
                  </div>
                )}
              </div>
            </section>

            {/* Members */}
            <section>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-4">
                Members ({membersByRole.members.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {membersByRole.members.length > 0 ? (
                  membersByRole.members.map(([id, member]) => (
                    <div key={id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm sm:text-base">{member.displayName || member.email}</h3>
                          <p className="text-xs text-muted-foreground">Member</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">This Month</p>
                          <p className="text-sm sm:text-base font-bold text-foreground">₹{getUserMonthlyTotal(id).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground">No members yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
