"use client"

import { useEffect, useState } from "react"
import { query, collection, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Transaction } from "@/lib/types"
import { useThemeLanguage } from "@/lib/use-theme-language"
import { getTranslations } from "@/lib/i18n"
import Navigation from "./navigation"
import PaymentModal from "./payment-modal"
import QRModal from "./qr-modal"
import TransactionFeed from "./transaction-feed"

export default function MainFeed({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { language } = useThemeLanguage()
  const t = getTranslations(language)

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
      },
      (error) => {
        console.error("[v0] Error fetching transactions:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" })

  const monthlyTotal = transactions
    .filter((txn) => {
      const txnDate = typeof txn.timestamp === "string" ? new Date(txn.timestamp) : txn.timestamp
      const txnMonth = txnDate.toLocaleString("default", { month: "long", year: "numeric" })
      return txnMonth === currentMonth
    })
    .reduce((sum, txn) => sum + txn.amount, 0)

  const allTimeTotal = transactions.reduce((sum, txn) => sum + txn.amount, 0)

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <Navigation user={user} />

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Header & Info Section */}
        <div className="mb-6 sm:mb-8 space-y-4">
          {/* Society Info Card with Futuristic Design */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-card to-card/80 border border-accent/20 rounded-lg p-4 sm:p-6 hover:border-accent/40 transition-all">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3">
                Banuhashim Society
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">{t.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-lg hover:border-accent/50 transition-colors">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Monthly Requirement</p>
                  <p className="text-lg sm:text-xl font-bold text-accent">₹20</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-lg hover:border-primary/50 transition-colors">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">System Purpose</p>
                  <p className="text-xs sm:text-sm text-foreground font-medium">Track contributions & management</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Description */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow">
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

          {/* Financial Overview - Monthly and All-Time Totals with Enhanced Design */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-primary/10 to-transparent rounded-lg blur-xl"></div>
            <div className="relative bg-gradient-to-br from-accent/5 via-card/50 to-background border-2 border-accent/30 rounded-lg p-4 sm:p-6 hover:border-accent/50 transition-all">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground mb-4">Financial Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monthly Total */}
                <div className="group relative bg-gradient-to-br from-card/80 to-card border border-accent/20 rounded-lg p-4 sm:p-5 hover:shadow-lg hover:border-accent/50 transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">
                          {t.payment.totalThisMonth}
                        </p>
                        <p className="text-2xl sm:text-3xl font-serif font-bold text-accent">
                          ₹{monthlyTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-muted-foreground">{currentMonth}</p>
                      </div>
                    </div>
                    <div className="h-2.5 bg-background rounded-full overflow-hidden border border-accent/10">
                      <div
                        className="h-full bg-gradient-to-r from-accent via-accent to-accent/50 transition-all duration-1000"
                        style={{ width: `${Math.min((monthlyTotal / 600) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* All-Time Total */}
                <div className="group relative bg-gradient-to-br from-card/80 to-card border border-primary/20 rounded-lg p-4 sm:p-5 hover:shadow-lg hover:border-primary/50 transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">All-Time Total</p>
                        <p className="text-2xl sm:text-3xl font-serif font-bold text-primary">
                          ₹{allTimeTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-muted-foreground">{transactions.length} Transactions</p>
                      </div>
                    </div>
                    <div className="h-2.5 bg-background rounded-full overflow-hidden border border-primary/10">
                      <div
                        className="h-full bg-gradient-to-r from-primary via-primary to-primary/50 transition-all duration-1000"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>
                </div>
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

      {/* QR Button - Bottom Left */}
      <button
        onClick={() => setShowQRModal(true)}
        className="fixed bottom-6 left-6 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full hover:from-primary/90 hover:to-primary transition-all shadow-lg hover:shadow-2xl z-30 active:scale-95 transform hover:scale-110 font-bold text-sm sm:text-base"
        title="QR Code"
        aria-label="Show QR Code"
      >
        QR
      </button>

      {/* Floating Action Button - Bottom Right */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-accent to-accent/80 text-accent-foreground rounded-full hover:from-accent/90 hover:to-accent transition-all shadow-lg hover:shadow-2xl z-30 active:scale-95 transform hover:scale-110"
        title={t.payment.addPayment}
        aria-label={t.payment.addPayment}
      >
        <span className="text-2xl sm:text-3xl font-light">+</span>
      </button>

      {showModal && <PaymentModal onClose={() => setShowModal(false)} user={user} />}
      {showQRModal && <QRModal onClose={() => setShowQRModal(false)} user={user} />}
    </div>
  )
}
