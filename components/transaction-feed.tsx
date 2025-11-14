'use client'

import { Transaction } from '@/lib/types'
import { format, parse } from 'date-fns'

interface TransactionFeedProps {
  transactions: Transaction[]
}

export default function TransactionFeed({ transactions }: TransactionFeedProps) {
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
                <div className="text-right">
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
