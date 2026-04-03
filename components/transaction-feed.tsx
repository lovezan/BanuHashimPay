'use client'

import { Transaction } from '@/lib/types'
import { format, parse } from 'date-fns'

interface TransactionFeedProps {
  transactions: Transaction[]
  isAdmin?: boolean
  onEdit?: (txn: Transaction) => void
  onDelete?: (txnId: string) => Promise<void> | void
}

export default function TransactionFeed({ transactions, isAdmin, onEdit, onDelete }: TransactionFeedProps) {
  // Group transactions by month
  const grouped = transactions.reduce((acc, txn) => {
    const date = new Date(txn.timestamp)
    const monthKey = format(date, 'MMMM yyyy')
    
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(txn)
    return acc
  }, {} as Record<string, Transaction[]>)

  const monthOrder = Object.keys(grouped).sort((a, b) => {
    const dateA = parse(a, 'MMMM yyyy', new Date())
    const dateB = parse(b, 'MMMM yyyy', new Date())
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="space-y-8">
      {monthOrder.map((month) => (
        <div key={month}>
          {/* Month Header */}
          <div className="mb-4">
            <h3 className="text-sm font-serif font-bold text-muted-foreground uppercase tracking-wider">
              {month}
            </h3>
            <div className="h-px bg-border mt-2"></div>
          </div>

          {/* Transactions */}
          <div className="space-y-3">
            {grouped[month].map((txn) => (
              <div
                key={txn.id}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{txn.userName}</p>
                  <p className="text-sm text-muted-foreground">{txn.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(txn.timestamp), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(txn)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit transaction"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${txn.userName}'s payment of ₹${txn.amount}?`)) {
                              onDelete(txn.id)
                            }
                          }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete transaction"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-lg font-serif font-semibold text-accent">
                    +₹{txn.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
