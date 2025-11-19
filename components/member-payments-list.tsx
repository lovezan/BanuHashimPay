'use client'

import { Transaction, User } from '@/lib/types'
import { useMemo } from 'react'
import { useThemeLanguage } from '@/lib/use-theme-language'
import { getTranslations } from '@/lib/i18n'

interface MemberPaymentsListProps {
  transactions: Transaction[]
  users: Record<string, User>
  membersByRole: {
    presidents: User[]
    vicePresidents: User[]
    members: User[]
  }
}

export default function MemberPaymentsList({ transactions, users, membersByRole }: MemberPaymentsListProps) {
  const { language } = useThemeLanguage()
  const t = getTranslations(language)
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  
  const memberPayments = useMemo(() => {
    const payments: Record<string, number> = {}
    
    transactions.forEach((txn) => {
      const txnDate = typeof txn.timestamp === 'string' ? new Date(txn.timestamp) : txn.timestamp
      const txnMonth = txnDate.toLocaleString('default', { month: 'long', year: 'numeric' })
      
      if (txnMonth === currentMonth) {
        payments[txn.userId] = (payments[txn.userId] || 0) + txn.amount
      }
    })
    
    return payments
  }, [transactions])

  const allMembers = [...membersByRole.presidents, ...membersByRole.vicePresidents, ...membersByRole.members]
  
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <h3 className="text-lg font-serif font-bold text-foreground mb-4">{t.members.allMembers}</h3>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {allMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">{t.members.noMembers}</p>
        ) : (
          allMembers.map((member) => (
            <div key={member.uid} className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {member.role === 'vice-president' ? t.members.vicePresident : member.role === 'president' ? t.members.president : t.members.member}
                </p>
              </div>
              <div className="text-right ml-2 flex-shrink-0">
                <p className="text-sm font-semibold text-accent">₹{(memberPayments[member.uid] || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{currentMonth}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
