'use client'

import { useEffect, useState } from 'react'
import { query, collection, orderBy, onSnapshot } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Transaction, User } from '@/lib/types'
import Navigation from './navigation'
import PaymentModal from './payment-modal'
import TransactionFeed from './transaction-feed'
import MemberPaymentsList from './member-payments-list'
import LeadershipContainer from './leadership-container'

export default function MainFeed({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all transactions
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

  useEffect(() => {
    // Fetch all users
    const q = query(collection(db, 'users'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersMap: Record<string, User> = {}
      snapshot.docs.forEach((doc) => {
        usersMap[doc.id] = doc.data() as User
      })
      setUsers(usersMap)
    })

    return () => unsubscribe()
  }, [])

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const monthlyTotal = transactions
    .filter((txn) => {
      const txnDate = new Date(txn.timestamp)
      const txnMonth = txnDate.toLocaleString('default', { month: 'long', year: 'numeric' })
      return txnMonth === currentMonth
    })
    .reduce((sum, txn) => sum + txn.amount, 0)

  const membersByRole = {
    presidents: Object.values(users).filter(u => u.role === 'president'),
    vicePresidents: Object.values(users).filter(u => u.role === 'vice-president'),
    members: Object.values(users).filter(u => u.role === 'member'),
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Monthly Total */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
              Transaction Feed
            </h2>
            <p className="text-muted-foreground">Track all society payments</p>
          </div>
          
          <div className="text-right bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Total This Month</p>
            <p className="text-4xl font-serif font-bold text-accent">₹{monthlyTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">{currentMonth}</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center w-12 h-12 bg-accent text-accent-foreground rounded-full hover:bg-primary transition-colors shadow-md"
            title="Add payment"
          >
            <span className="text-2xl">+</span>
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Sidebar - Members & Payments */}
          <div className="lg:col-span-1">
            <MemberPaymentsList transactions={transactions} users={users} membersByRole={membersByRole} />
          </div>

          {/* Center - Leadership Container */}
          <div className="lg:col-span-2">
            <LeadershipContainer membersByRole={membersByRole} transactions={transactions} />
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No transactions yet. Add your first payment!</p>
          </div>
        ) : (
          <TransactionFeed transactions={transactions} />
        )}
      </main>

      {showModal && <PaymentModal onClose={() => setShowModal(false)} user={user} />}
    </div>
  )
}
