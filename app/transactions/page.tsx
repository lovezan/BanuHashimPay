'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { query, collection, orderBy, onSnapshot } from 'firebase/firestore'
import { Transaction } from '@/lib/types'
import Navigation from '@/components/navigation'
import Link from 'next/link'

export default function TransactionsPage() {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/')
      } else {
        setUser(currentUser)
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[]
      setTransactions(docs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (!user) {
    return null
  }

  const transactionsByMember = transactions.reduce((acc, txn) => {
    if (!acc[txn.userId]) {
      acc[txn.userId] = []
    }
    acc[txn.userId].push(txn)
    return acc
  }, {} as Record<string, Transaction[]>)

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Feed
          </Link>
          
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
            All Transactions
          </h2>
          <p className="text-muted-foreground">
            View transactions organized by member
          </p>
        </div>

        {/* Transactions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        ) : Object.keys(transactionsByMember).length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(transactionsByMember).map(([userId, userTransactions]) => (
              <div key={userId} className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="mb-4 pb-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">{userTransactions[0].userName}</h3>
                  <p className="text-sm text-accent font-bold">
                    Total: ₹{userTransactions.reduce((sum, txn) => sum + txn.amount, 0).toFixed(2)}
                  </p>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto themed-scroll pr-1">
                  {userTransactions.map((txn) => (
                    <div key={txn.id} className="text-xs bg-background/50 p-2 rounded">
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground truncate flex-1">{txn.reason}</span>
                        <span className="text-accent font-semibold ml-2">₹{txn.amount}</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {new Date(txn.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
