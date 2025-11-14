'use client'

import { Transaction, User } from '@/lib/types'
import { useMemo } from 'react'

interface LeadershipContainerProps {
  membersByRole: {
    presidents: User[]
    vicePresidents: User[]
    members: User[]
  }
  transactions: Transaction[]
}

export default function LeadershipContainer({ membersByRole, transactions }: LeadershipContainerProps) {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  
  const rolePayments = useMemo(() => {
    const payments: Record<string, number> = {
      president: 0,
      'vice-president': 0,
    }
    
    transactions.forEach((txn) => {
      const txnDate = new Date(txn.timestamp)
      const txnMonth = txnDate.toLocaleString('default', { month: 'long', year: 'numeric' })
      
      if (txnMonth === currentMonth) {
        const user = membersByRole.presidents.find(u => u.uid === txn.userId) ||
                     membersByRole.vicePresidents.find(u => u.uid === txn.userId)
        
        if (user?.role === 'president') {
          payments.president += txn.amount
        } else if (user?.role === 'vice-president') {
          payments['vice-president'] += txn.amount
        }
      }
    })
    
    return payments
  }, [transactions, membersByRole])

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-serif font-bold text-foreground">Society Leadership</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* President */}
        <div className="bg-gradient-to-br from-card to-card/80 border-2 border-accent/30 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 8a2 2 0 11-4 0 2 2 0 014 0z"></path>
                <path fillRule="evenodd" d="M14 14H2v4h12v-4zM2 12a6 6 0 1112 0H2z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider">President</p>
              <p className="text-sm text-muted-foreground">Organization Head</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {membersByRole.presidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No president assigned</p>
            ) : (
              membersByRole.presidents.map((president) => (
                <div key={president.uid} className="bg-background/50 rounded p-3">
                  <p className="font-medium text-foreground">{president.displayName}</p>
                  <p className="text-sm text-accent font-semibold">₹{rolePayments.president.toFixed(2)} this month</p>
                  <p className="text-xs text-muted-foreground">{president.email}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vice President */}
        <div className="bg-gradient-to-br from-card to-card/80 border-2 border-secondary/50 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-secondary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zm-2-9a1 1 0 11-2 0 1 1 0 012 0zM14 12a4 4 0 11-8 0 4 4 0 018 0zM16 19h4v-2a6 6 0 00-9-5.666V9a6 6 0 00-6 6v.666A4 4 0 004 21h12z"></path>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vice President</p>
              <p className="text-sm text-muted-foreground">Assistant Lead</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {membersByRole.vicePresidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vice president assigned</p>
            ) : (
              membersByRole.vicePresidents.map((vp) => (
                <div key={vp.uid} className="bg-background/50 rounded p-3">
                  <p className="font-medium text-foreground">{vp.displayName}</p>
                  <p className="text-sm text-secondary-foreground font-semibold">₹{rolePayments['vice-president'].toFixed(2)} this month</p>
                  <p className="text-xs text-muted-foreground">{vp.email}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
