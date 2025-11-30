"use client"

import { useEffect, useState } from "react"
import { query, collection, onSnapshot } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import type { User, Transaction } from "@/lib/types"
import { useThemeLanguage } from "@/lib/use-theme-language"
import { getTranslations } from "@/lib/i18n"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"

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
        router.push("/")
      }
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const q = query(collection(db, "users"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersMap: Record<string, User> = {}
      snapshot.docs.forEach((doc) => {
        usersMap[doc.id] = doc.data() as User
      })
      console.log("[v0] Users fetched:", Object.keys(usersMap).length)
      setUsers(usersMap)
      setLoading(false)
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
    })
    return () => unsubscribe()
  }, [])

  const membersByRole = {
    presidents: Object.entries(users).filter(([, u]) => u.role === "president" || u.role === "President"),
    vicePresidents: Object.entries(users).filter(
      ([, u]) => u.role === "vice-president" || u.role === "vice president" || u.role === "vicePresident",
    ),
    members: Object.entries(users).filter(([, u]) => u.role === "member" || u.role === "Member"),
  }

  const getUserMonthlyTotal = (userId: string) => {
    const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" })
    return transactions
      .filter((txn) => {
        const txnDate = typeof txn.timestamp === "string" ? new Date(txn.timestamp) : txn.timestamp
        const txnMonth = txnDate.toLocaleString("default", { month: "long", year: "numeric" })
        return txnMonth === currentMonth && txn.userId === userId
      })
      .reduce((sum, txn) => sum + txn.amount, 0)
  }

  const getUserAllTimeTotal = (userId: string) => {
    return transactions.filter((txn) => txn.userId === userId).reduce((sum, txn) => sum + txn.amount, 0)
  }

  if (!user) return null

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {/* Header with Futuristic Design */}
        <div className="mb-8 sm:mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-card/80 to-card border border-accent/20 rounded-xl p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-2">
                Society Directory
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                View all members, leadership, and their contributions
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading directory...</p>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12">
            {/* Presidents */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 bg-gradient-to-r from-accent via-accent to-accent/50 rounded-full"></div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">🏆 Presidents</h2>
                <span className="ml-auto text-sm font-semibold bg-accent/20 text-accent px-3 py-1 rounded-full">
                  {membersByRole.presidents.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {membersByRole.presidents.length > 0 ? (
                  membersByRole.presidents.map(([id, member]) => (
                    <div
                      key={id}
                      className="group relative bg-gradient-to-br from-card to-card/80 border-2 border-accent/30 rounded-lg p-4 sm:p-6 hover:shadow-2xl hover:border-accent/60 transition-all transform hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-serif font-bold text-foreground text-lg sm:text-xl">
                              {member.displayName}
                            </h3>
                            <p className="text-xs sm:text-sm text-accent font-bold uppercase tracking-wider">
                              🏛️ President
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs text-muted-foreground mb-1">This Month</p>
                            <p className="text-xl sm:text-2xl font-bold text-accent">
                              ₹{getUserMonthlyTotal(id).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-accent/20">
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          <p className="text-xs text-muted-foreground text-right">
                            Total: ₹{getUserAllTimeTotal(id).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-card rounded-lg border-2 border-dashed border-accent/30">
                    <p className="text-muted-foreground text-sm">No president assigned yet</p>
                  </div>
                )}
              </div>
            </section>

            {/* Vice Presidents */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 bg-gradient-to-r from-primary via-primary to-primary/50 rounded-full"></div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">⭐ Vice Presidents</h2>
                <span className="ml-auto text-sm font-semibold bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {membersByRole.vicePresidents.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {membersByRole.vicePresidents.length > 0 ? (
                  membersByRole.vicePresidents.map(([id, member]) => (
                    <div
                      key={id}
                      className="group relative bg-gradient-to-br from-card to-card/80 border-2 border-primary/30 rounded-lg p-4 sm:p-6 hover:shadow-2xl hover:border-primary/60 transition-all transform hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-serif font-bold text-foreground text-lg sm:text-xl">
                              {member.displayName}
                            </h3>
                            <p className="text-xs sm:text-sm text-primary font-bold uppercase tracking-wider">
                              🎖️ Vice President
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs text-muted-foreground mb-1">This Month</p>
                            <p className="text-xl sm:text-2xl font-bold text-primary">
                              ₹{getUserMonthlyTotal(id).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-primary/20">
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          <p className="text-xs text-muted-foreground text-right">
                            Total: ₹{getUserAllTimeTotal(id).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-card rounded-lg border-2 border-dashed border-primary/30">
                    <p className="text-muted-foreground text-sm">No vice president assigned yet</p>
                  </div>
                )}
              </div>
            </section>

            {/* Members */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 bg-gradient-to-r from-secondary via-secondary to-secondary/50 rounded-full"></div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">👥 Members</h2>
                <span className="ml-auto text-sm font-semibold bg-secondary/20 text-secondary-foreground px-3 py-1 rounded-full">
                  {membersByRole.members.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {membersByRole.members.length > 0 ? (
                  membersByRole.members.map(([id, member]) => (
                    <div
                      key={id}
                      className="group relative bg-gradient-to-br from-card to-card/80 border border-border rounded-lg p-4 sm:p-5 hover:shadow-xl hover:border-secondary/50 transition-all transform hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground text-sm sm:text-base">{member.displayName}</h3>
                            <p className="text-xs text-muted-foreground">👤 Member</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs text-muted-foreground mb-1">This Month</p>
                            <p className="text-lg sm:text-xl font-bold text-foreground">
                              ₹{getUserMonthlyTotal(id).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          <p className="text-xs text-muted-foreground text-right">
                            Total: ₹{getUserAllTimeTotal(id).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-card rounded-lg border-2 border-dashed border-border">
                    <p className="text-muted-foreground text-sm">No members yet</p>
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
