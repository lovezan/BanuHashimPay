'use client'

import { useEffect, useState } from 'react'
import { query, collection, orderBy, onSnapshot } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Transaction, User } from '@/lib/types'
import { useThemeLanguage } from '@/lib/use-theme-language'
import { getTranslations } from '@/lib/i18n'
import Navigation from './navigation'
import PaymentModal from './payment-modal'
import TransactionFeed from './transaction-feed'

export default function MainFeed({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { language } = useThemeLanguage()
  const t = getTranslations(language)

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        }
      }) as Transaction[]
      console.log("[v0] Transactions loaded:", docs.length)
      setTransactions(docs)
      setLoading(false)
    }, (error) => {
      console.error("[v0] Error fetching transactions:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const monthlyTotal = transactions
    .filter((txn) => {
      const txnDate = typeof txn.timestamp === 'string' ? new Date(txn.timestamp) : txn.timestamp
      const txnMonth = txnDate.toLocaleString('default', { month: 'long', year: 'numeric' })
      return txnMonth === currentMonth
    })
    .reduce((sum, txn) => sum + txn.amount, 0)

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Header & Info Section */}
        <div className="mb-6 sm:mb-8 space-y-4">
          {/* Society Info Card */}
          <div className="bg-gradient-to-br from-card to-card/80 border border-border rounded-lg p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-3">
              Banuhashim Society
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
              {t.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Monthly Requirement</p>
                <p className="text-lg sm:text-xl font-bold text-accent">₹20</p>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">System Purpose</p>
                <p className="text-xs sm:text-sm text-foreground font-medium">Track contributions & management</p>
              </div>
            </div>
          </div>

          {/* System Description */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground mb-3">How It Works</h2>
            <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-accent font-bold flex-shrink-0">•</span>
                <span>Each member contributes ₹20 monthly for society operations</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold flex-shrink-0">•</span>
                <span>Members can log additional donations and contributions with reasons</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold flex-shrink-0">•</span>
                <span>Leadership (President & Vice President) oversee all transactions</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold flex-shrink-0">•</span>
                <span>View all members and their contributions in the Directory</span>
              </li>
            </ul>
          </div>

          {/* Monthly Total - Responsive */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t.payment.totalThisMonth}</p>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-accent">₹{monthlyTotal.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-muted-foreground">{currentMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-2xl font-serif font-bold text-foreground mb-4">Recent Transactions</h2>
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-8 h-8 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-card rounded-lg border border-border">
              <p className="text-sm sm:text-base text-muted-foreground">No transactions yet. Add your first payment!</p>
            </div>
          ) : (
            <TransactionFeed transactions={transactions} />
          )}
        </div>
      </main>

      {/* Floating Action Button - Fixed bottom-right on mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-accent text-accent-foreground rounded-full hover:bg-primary transition-all shadow-lg hover:shadow-xl z-30 active:scale-95 transform"
        title={t.payment.addPayment}
        aria-label={t.payment.addPayment}
      >
        <span className="text-2xl sm:text-3xl font-light">+</span>
      </button>

      {showModal && <PaymentModal onClose={() => setShowModal(false)} user={user} />}
    </div>
  )
}
