"use client"

import { useEffect, useState } from "react"
import { query, collection, onSnapshot } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import type { User, Transaction } from "@/lib/types"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import Link from "next/link"
import PaymentModal from "@/components/payment-modal"
import { isSuperAdmin } from "@/lib/admin"
import { useAdminMode } from "@/lib/admin-context"

function monthKey(date: Date) {
  return date.toLocaleString("default", { month: "long", year: "numeric" })
}

// Only returns COMPLETED months (never the current ongoing month)
// Starts from the earliest transaction month or 12 months back, whichever is earlier
function getCompletedMonths(transactions: Transaction[]): Date[] {
  const now = new Date()
  // Last day of previous month = the most recent completed month
  const lastCompleted = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Go back 12 months from last completed as a minimum range
  let earliest = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth() - 11, 1)

  // If we have transactions older than that, extend back to them
  if (transactions.length > 0) {
    const txnDates = transactions.map((t) => {
      const d = typeof t.timestamp === "string" ? new Date(t.timestamp) : (t.timestamp as Date)
      return new Date(d.getFullYear(), d.getMonth(), 1)
    })
    const txnEarliest = new Date(Math.min(...txnDates.map((d) => d.getTime())))
    if (txnEarliest < earliest) earliest = txnEarliest
  }

  const months: Date[] = []
  const cursor = new Date(earliest)
  while (cursor <= lastCompleted) {
    months.push(new Date(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months.reverse() // newest first → February 2026 first when in March 2026
}

export default function UnpaidPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<Record<string, User>>({})
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [paymentTarget, setPaymentTarget] = useState<{ userId: string; userName: string } | null>(null)
  const router = useRouter()
  const { adminMode } = useAdminMode()
  const isAdmin = isSuperAdmin(user?.email) && adminMode

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/")
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const q = query(collection(db, "users"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, User> = {}
      snapshot.docs.forEach((doc) => {
        map[doc.id] = doc.data() as User
      })
      setUsers(map)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const q = query(collection(db, "transactions"))
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
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Completed months only — never current month
  const completedMonths = getCompletedMonths(transactions)

  // Always default to the most recent completed month (index 0 = previous month)
  useEffect(() => {
    if (!selectedMonth && completedMonths.length > 0) {
      setSelectedMonth(monthKey(completedMonths[0]))
    }
  }, [completedMonths.length, selectedMonth])

  if (!user) return null

  // Build complete member list from BOTH sources:
  // 1. Everyone who has ever made a transaction (same as transactions page)
  // 2. Everyone in the users collection (registered accounts)
  const allMembersMap: Record<string, { displayName: string; email: string; role: string }> = {}

  // First pass: users from transactions (userName + userId)
  transactions.forEach((txn) => {
    if (!allMembersMap[txn.userId]) {
      allMembersMap[txn.userId] = { displayName: txn.userName, email: "", role: "member" }
    }
  })

  // Second pass: users collection overrides with richer data (email, role)
  Object.entries(users).forEach(([id, u]) => {
    allMembersMap[id] = { displayName: u.displayName || allMembersMap[id]?.displayName || "Unknown", email: u.email, role: u.role }
  })

  const allMembers = Object.entries(allMembersMap)

  // Who paid in selectedMonth
  const paidUserIds = new Set(
    transactions
      .filter((txn) => {
        const d = typeof txn.timestamp === "string" ? new Date(txn.timestamp) : (txn.timestamp as Date)
        return d.toLocaleString("default", { month: "long", year: "numeric" }) === selectedMonth
      })
      .map((txn) => txn.userId)
  )

  const paidMembers = allMembers.filter(([id]) => paidUserIds.has(id))
  const unpaidMembers = allMembers.filter(([id]) => !paidUserIds.has(id))

  const collectedAmount = transactions
    .filter((txn) => {
      const d = typeof txn.timestamp === "string" ? new Date(txn.timestamp) : (txn.timestamp as Date)
      return d.toLocaleString("default", { month: "long", year: "numeric" }) === selectedMonth
    })
    .reduce((sum, txn) => sum + txn.amount, 0)

  const expectedAmount = allMembers.length * 30
  const collectionRate = expectedAmount > 0 ? Math.min((collectedAmount / expectedAmount) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to Feed
          </Link>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 to-accent/10 rounded-lg blur-xl"></div>
            <div className="relative bg-gradient-to-br from-card/80 to-card border border-destructive/20 rounded-lg p-5 sm:p-7">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-1">
                Unpaid Tracker
              </h1>
              <p className="text-sm text-muted-foreground">
                Month-by-month view of who has and hasn't paid their ₹30 contribution.
                Current month is excluded — only completed months are tracked.
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select Completed Month
          </label>
          <div className="flex flex-wrap gap-2">
            {completedMonths.slice(0, 6).map((m) => {
              const key = monthKey(m)
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMonth(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedMonth === key
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-accent/50"
                  }`}
                >
                  {key}
                </button>
              )
            })}
            {completedMonths.length > 6 && (
              <select
                value={completedMonths.slice(6).some((m) => monthKey(m) === selectedMonth) ? selectedMonth : ""}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-card border border-border rounded-full text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="">Older months...</option>
                {completedMonths.slice(6).map((m) => {
                  const key = monthKey(m)
                  return (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  )
                })}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : !selectedMonth ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No completed months to display yet.</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{allMembers.length}</p>
              </div>
              <div className="bg-card border border-green-500/30 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-muted-foreground mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-500">{paidMembers.length}</p>
              </div>
              <div className="bg-card border border-destructive/30 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-muted-foreground mb-1">Unpaid</p>
                <p className="text-2xl font-bold text-destructive">{unpaidMembers.length}</p>
              </div>
              <div className="bg-card border border-accent/30 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-muted-foreground mb-1">Collected</p>
                <p className="text-2xl font-bold text-accent">₹{collectedAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">of ₹{expectedAmount}</p>
              </div>
            </div>

            {/* Collection Progress */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Collection Progress — {selectedMonth}</p>
                <p className="text-sm font-bold text-accent">{collectionRate.toFixed(0)}%</p>
              </div>
              <div className="h-3 bg-background rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-700 rounded-full"
                  style={{ width: `${collectionRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ₹{collectedAmount.toFixed(0)} collected · ₹{Math.max(expectedAmount - collectedAmount, 0).toFixed(0)} not collected
              </p>
            </div>

            {/* Unpaid Members */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-6 bg-destructive rounded-full"></div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                  Did Not Pay — {selectedMonth} ({unpaidMembers.length})
                </h2>
              </div>

              {unpaidMembers.length === 0 ? (
                <div className="bg-card border border-green-500/30 rounded-lg p-6 text-center">
                  <p className="text-green-500 font-semibold text-sm">
                    All members paid for {selectedMonth}!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unpaidMembers.map(([id, member]) => (
                    <div
                      key={id}
                      className="flex items-center gap-3 p-3 sm:p-4 bg-card border border-destructive/30 rounded-lg hover:border-destructive/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center text-sm font-bold text-destructive flex-shrink-0">
                        {member.displayName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{member.displayName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {isAdmin ? (
                        <button
                          onClick={() => setPaymentTarget({ userId: id, userName: member.displayName })}
                          className="flex-shrink-0 text-xs font-bold text-accent-foreground bg-accent hover:bg-accent/80 px-2 py-1.5 rounded transition-colors"
                        >
                          + Add
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded flex-shrink-0">
                          ₹30 due
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Paid Members */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-6 bg-green-500 rounded-full"></div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                  Paid — {selectedMonth} ({paidMembers.length})
                </h2>
              </div>

              {paidMembers.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground text-sm">No members paid for {selectedMonth}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paidMembers.map(([id, member]) => {
                    const memberTotal = transactions
                      .filter((txn) => {
                        const d =
                          typeof txn.timestamp === "string" ? new Date(txn.timestamp) : (txn.timestamp as Date)
                        return (
                          d.toLocaleString("default", { month: "long", year: "numeric" }) === selectedMonth &&
                          txn.userId === id
                        )
                      })
                      .reduce((sum, txn) => sum + txn.amount, 0)

                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-3 sm:p-4 bg-card border border-green-500/20 rounded-lg hover:border-green-500/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center text-sm font-bold text-green-500 flex-shrink-0">
                          {member.displayName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{member.displayName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded flex-shrink-0">
                          ₹{memberTotal.toFixed(0)} paid
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      {paymentTarget && (
        <PaymentModal
          onClose={() => setPaymentTarget(null)}
          user={user}
          preSelectedMember={paymentTarget}
          preSelectedReason={`Monthly dues ${selectedMonth}`}
        />
      )}
    </div>
  )
}
