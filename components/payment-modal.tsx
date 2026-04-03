'use client'

import { useEffect, useState } from 'react'
import { addDoc, collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { isSuperAdmin } from '@/lib/admin'
import { useAdminMode } from '@/lib/admin-context'
import type { Transaction } from '@/lib/types'

interface PaymentModalProps {
  onClose: () => void
  user: any
  preSelectedMember?: { userId: string; userName: string }
  preSelectedReason?: string
  preSelectedAmount?: string
  isFixedAmount?: boolean
  editTransaction?: Transaction | null
  targetMonth?: string
}

interface MemberOption {
  userId: string
  userName: string
}

export default function PaymentModal({ onClose, user, preSelectedMember, preSelectedReason, preSelectedAmount, isFixedAmount, editTransaction, targetMonth }: PaymentModalProps) {
  const [amount, setAmount] = useState(preSelectedAmount || '30')
  const [reason, setReason] = useState(preSelectedReason || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState<MemberOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>(editTransaction?.userId || preSelectedMember?.userId || user.uid)
  const [selectedUserName, setSelectedUserName] = useState<string>(editTransaction?.userName || preSelectedMember?.userName || user.displayName || user.email)

  const { adminMode } = useAdminMode()
  const isAdmin = isSuperAdmin(user.email) && adminMode

  // Admin: fetch all members from users collection + transactions
  useEffect(() => {
    if (!isAdmin) return

    const usersMap: Record<string, string> = {}

    // Fetch from users collection
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      snap.docs.forEach((doc) => {
        const d = doc.data()
        usersMap[doc.id] = d.displayName || d.email || doc.id
      })
      rebuildList()
    })

    // Fetch from transactions for any user not in users collection
    const unsubTxns = onSnapshot(query(collection(db, 'transactions')), (snap) => {
      snap.docs.forEach((doc) => {
        const d = doc.data()
        if (!usersMap[d.userId]) {
          usersMap[d.userId] = d.userName || d.userId
        }
      })
      rebuildList()
    })

    function rebuildList() {
      const list = Object.entries(usersMap).map(([userId, userName]) => ({ userId, userName }))
      list.sort((a, b) => a.userName.localeCompare(b.userName))
      setMembers(list)
    }

    return () => {
      unsubUsers()
      unsubTxns()
    }
  }, [isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!amount || !reason) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      const amountValue = parseFloat(amount)
      if (amountValue < 0) {
        setError('Amount cannot be negative')
        setLoading(false)
        return
      }

      let txTimestamp = new Date().getTime()
      let txDateStr = new Date().toISOString()

      if (targetMonth && !editTransaction) {
        // Force timestamp into the selected month securely (using the 15th of the month)
        const targetDate = new Date(`${targetMonth} 15`)
        if (!isNaN(targetDate.getTime())) {
          txTimestamp = targetDate.getTime()
          txDateStr = targetDate.toISOString()
        }
      }

      const txData: any = {
        userId: selectedUserId,
        userName: selectedUserName,
        amount: amountValue,
        reason,
        timestamp: txTimestamp,
        date: txDateStr,
        status: 'done',
        paymentMethod: 'cash',
      }

      if (isAdmin) {
        txData.addedBy = user.email
      }

      if (editTransaction) {
        await updateDoc(doc(db, 'transactions', editTransaction.id), txData)
      } else {
        await addDoc(collection(db, 'transactions'), txData)
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to process payment')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md shadow-lg animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-foreground">
            {editTransaction ? 'Edit Payment' : isAdmin ? 'Add Payment (Admin)' : 'Add Payment'}
          </h2>
          {isAdmin && (
            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-medium">
              Super Admin
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin: user selector */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {editTransaction ? 'Member' : 'Adding Payment For'}
              </label>
              {(preSelectedMember || editTransaction) ? (
                <div className="w-full bg-background border border-accent/40 rounded-md px-3 py-2 text-sm text-foreground flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                    {selectedUserName[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium">{selectedUserName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{editTransaction ? 'locked' : 'pre-selected'}</span>
                </div>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    const selected = members.find((m) => m.userId === e.target.value)
                    if (selected) {
                      setSelectedUserId(selected.userId)
                      setSelectedUserName(selected.userName)
                    }
                  }}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {members.length === 0 ? (
                    <option value={user.uid}>{user.displayName || user.email}</option>
                  ) : (
                    members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userName}
                      </option>
                    ))
                  )}
                </select>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                As super admin you can record payment for any member
              </p>
            </div>
          )}

          {targetMonth && isAdmin && !editTransaction && (
            <div className="flex gap-2 bg-muted/30 p-1.5 rounded-lg border border-border mt-3">
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${amount === preSelectedAmount ? 'bg-destructive text-destructive-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                onClick={() => setAmount(preSelectedAmount || '130')}
              >
                With Fine
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${amount === (parseFloat(preSelectedAmount || '130') - 100).toString() ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                onClick={() => setAmount((parseFloat(preSelectedAmount || '130') - 100).toString())}
              >
                Without Fine
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 mt-4">
              Amount (₹)
            </label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isFixedAmount && !isAdmin}
              placeholder="0.00"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason
            </label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Monthly dues Feb 2026, Event fund..."
              className="bg-background border-border text-foreground"
            />
          </div>

          <p className="text-xs text-muted-foreground -mt-2">
            Direct payment (Physical cash/offline payment)
          </p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent text-accent-foreground hover:bg-primary"
            >
              {loading ? 'Adding...' : 'Add Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
