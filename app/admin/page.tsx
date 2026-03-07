"use client"

import { useEffect, useState } from "react"
import { query, collection, onSnapshot, doc, setDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import type { User } from "@/lib/types"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { isSuperAdmin } from "@/lib/admin"
import { useAdminMode } from "@/lib/admin-context"
import Link from "next/link"

type Role = "member" | "president" | "vice-president"

const roleOptions: { value: Role; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "president", label: "President" },
  { value: "vice-president", label: "Vice President" },
]

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [usersCollection, setUsersCollection] = useState<Record<string, User>>({})
  const [transactions, setTransactions] = useState<{ userId: string; userName: string }[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { adminMode } = useAdminMode()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) { router.push("/"); return }
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (user && (!isSuperAdmin(user.email) || !adminMode)) {
      router.push("/")
    }
  }, [user, adminMode, router])

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, "users")), (snapshot) => {
      const map: Record<string, User> = {}
      snapshot.docs.forEach((d) => { map[d.id] = d.data() as User })
      setUsersCollection(map)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, "transactions")), (snapshot) => {
      setTransactions(snapshot.docs.map((d) => ({ userId: d.data().userId, userName: d.data().userName })))
    })
    return () => unsubscribe()
  }, [])

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setSaving(userId)
    setSaved(null)
    try {
      // setDoc with merge so it works even if user doc doesn't exist yet
      await setDoc(doc(db, "users", userId), { role: newRole }, { merge: true })
      setSaved(userId)
      setTimeout(() => setSaved(null), 2000)
    } finally {
      setSaving(null)
    }
  }

  if (!user || !isSuperAdmin(user.email) || !adminMode) return null

  // Merge: everyone from transactions + users collection
  const mergedMap: Record<string, { displayName: string; email: string; role: Role }> = {}
  transactions.forEach(({ userId, userName }) => {
    if (!mergedMap[userId]) {
      mergedMap[userId] = { displayName: userName, email: "", role: "member" }
    }
  })
  Object.entries(usersCollection).forEach(([id, u]) => {
    mergedMap[id] = {
      displayName: u.displayName || mergedMap[id]?.displayName || "Unknown",
      email: u.email || "",
      role: (u.role as Role) || mergedMap[id]?.role || "member",
    }
  })

  const sortedUsers = Object.entries(mergedMap).sort(([, a], [, b]) => {
    const order = { president: 0, "vice-president": 1, member: 2 }
    return (order[a.role] ?? 2) - (order[b.role] ?? 2)
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-3xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to Feed
          </Link>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg blur-xl"></div>
            <div className="relative bg-gradient-to-br from-card/80 to-card border border-accent/20 rounded-lg p-5 sm:p-7">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Manage Roles</h1>
                <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-medium">Super Admin</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Assign president and vice president roles to society members.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No registered members yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedUsers.map(([id, member]) => (
              <div
                key={id}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  member.role === "president"
                    ? "bg-accent/20 text-accent"
                    : member.role === "vice-president"
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {member.displayName?.[0]?.toUpperCase() || "?"}
                </div>

                {/* Name & email */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>

                {/* Role selector */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={member.role || "member"}
                    onChange={(e) => handleRoleChange(id, e.target.value as Role)}
                    disabled={saving === id}
                    className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {saving === id && (
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {saved === id && (
                    <span className="text-xs text-green-500 font-medium">Saved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
