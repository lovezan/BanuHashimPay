'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { query, collection, orderBy, onSnapshot } from 'firebase/firestore'
import { Transaction } from '@/lib/types'
import Navigation from '@/components/navigation'
import TransactionFeed from '@/components/transaction-feed'
import Link from 'next/link'

export default function AccountPage() {
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
    if (!user) return

    // Now fetching all transactions and filtering by userId on the client-side
    const q = query(
      collection(db, 'transactions'),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[]
      
      const userTransactions = docs.filter((doc: any) => doc.userId === user.uid)
      setTransactions(userTransactions)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (!user) {
    return null
  }

  const totalSpent = transactions.reduce((sum, txn) => sum + txn.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Feed
          </Link>
          
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
            My Payments
          </h2>
          <p className="text-muted-foreground">
            Your transaction history for {user.displayName || 'your account'}
          </p>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-lg p-6 mb-12">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Payments</p>
              <p className="text-3xl font-serif font-bold text-accent">
                {transactions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-3xl font-serif font-bold text-accent">
                ₹{totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">You haven't made any payments yet.</p>
          </div>
        ) : (
          <TransactionFeed transactions={transactions} />
        )}
      </main>
    </div>
  )
}
