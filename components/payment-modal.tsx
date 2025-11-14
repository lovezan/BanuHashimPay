'use client'

import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PaymentModalProps {
  onClose: () => void
  user: any
}

export default function PaymentModal({ onClose, user }: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        amount: parseFloat(amount),
        reason,
        timestamp: new Date().getTime(),
        date: new Date().toISOString(),
      })

      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md shadow-lg animate-in fade-in zoom-in-95">
        <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
          Add Payment
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Amount (₹)
            </label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
              placeholder="E.g., Monthly dues, Event fund..."
              className="bg-background border-border text-foreground"
            />
          </div>

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
