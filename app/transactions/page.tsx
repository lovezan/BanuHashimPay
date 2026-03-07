'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { query, collection, orderBy, onSnapshot } from 'firebase/firestore'
import { Transaction } from '@/lib/types'
import Navigation from '@/components/navigation'
import Link from 'next/link'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

interface MemberDetail {
  userId: string
  userName: string
  txns: Transaction[]
}

function DetailOverlay({ detail, onClose }: { detail: MemberDetail; onClose: () => void }) {
  const total = detail.txns.reduce((s, t) => s + t.amount, 0)
  const sorted = [...detail.txns].sort((a, b) => (b.timestamp as unknown as number) - (a.timestamp as unknown as number))

  // close on backdrop click
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent flex-shrink-0">
              {detail.userName[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">{detail.userName}</h2>
              <p className="text-sm text-muted-foreground">{detail.txns.length} transaction{detail.txns.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
            <p className="text-xl font-bold text-accent">₹{total.toFixed(0)}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Transactions</p>
            <p className="text-xl font-bold text-foreground">{detail.txns.length}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Latest</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(sorted[0]?.timestamp as unknown as number)}</p>
          </div>
        </div>

        {/* Transaction list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {sorted.map((txn, i) => (
            <div key={txn.id} className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                    #{detail.txns.length - i}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{txn.reason}</p>
                </div>
                <span className="text-lg font-serif font-bold text-accent flex-shrink-0">+₹{txn.amount}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 ml-11 text-xs text-muted-foreground">
                <span>📅 {formatDate(txn.timestamp as unknown as number)}</span>
                <span>🕐 {formatTime(txn.timestamp as unknown as number)}</span>
                {(txn as any).paymentMethod && (
                  <span className="capitalize">💳 {(txn as any).paymentMethod}</span>
                )}
                {(txn as any).status && (
                  <span className={`capitalize font-medium ${(txn as any).status === 'done' ? 'text-green-500' : 'text-yellow-500'}`}>
                    ✓ {(txn as any).status}
                  </span>
                )}
                {(txn as any).addedBy && (
                  <span>👤 Added by {(txn as any).addedBy}</span>
                )}
                {(txn as any).updatedBy && (
                  <span>✏️ Edited by {(txn as any).updatedBy}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MemberDetail | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push('/')
      else setUser(currentUser)
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Transaction[]
      setTransactions(docs)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // close detail overlay on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!user) return null

  const transactionsByMember = transactions.reduce((acc, txn) => {
    if (!acc[txn.userId]) acc[txn.userId] = []
    acc[txn.userId].push(txn)
    return acc
  }, {} as Record<string, Transaction[]>)

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to Feed
          </Link>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-1">All Transactions</h2>
          <p className="text-muted-foreground text-sm">Click any card to see full details</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(transactionsByMember).map(([userId, userTxns]) => {
              const total = userTxns.reduce((s, t) => s + t.amount, 0)
              const latest = userTxns[0]
              return (
                <button
                  key={userId}
                  onClick={() => setSelected({ userId, userName: userTxns[0].userName, txns: userTxns })}
                  className="text-left bg-card border border-border rounded-xl p-5 hover:border-accent/50 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center text-lg font-bold text-accent flex-shrink-0">
                      {userTxns[0].userName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{userTxns[0].userName}</p>
                      <p className="text-xs text-muted-foreground">{userTxns.length} transaction{userTxns.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-serif font-bold text-accent">₹{total.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">total</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border mb-3"></div>

                  {/* Recent transactions preview */}
                  <div className="space-y-2">
                    {userTxns.slice(0, 3).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate flex-1 mr-2">{txn.reason}</span>
                        <span className="text-accent font-semibold flex-shrink-0">₹{txn.amount}</span>
                      </div>
                    ))}
                    {userTxns.length > 3 && (
                      <p className="text-xs text-muted-foreground pt-1">+{userTxns.length - 3} more — click to view all</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Last: {formatDate(latest.timestamp as unknown as number)}
                    </span>
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {selected && <DetailOverlay detail={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
