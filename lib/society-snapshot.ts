export type SocietyMember = {
  id: string
  displayName: string
  email?: string
  role?: string
}

export type SocietyTransaction = {
  id: string
  userId: string
  userName: string
  amount: number
  reason: string
  timestamp: number
}

export type MonthMemberStatus = {
  name: string
  role: string
  email: string
  amountPaid: number
  due: number
}

export type MonthBreakdown = {
  month: string
  status: 'current' | 'completed'
  collected: number
  expected: number
  pending: number
  paid: MonthMemberStatus[]
  unpaid: MonthMemberStatus[]
}

export type SocietySnapshot = {
  generatedAt: string
  viewer: {
    uid: string
    email: string | null
    displayName: string | null
  }
  currentMonth: string
  lastCompletedMonth: string
  monthlyAmount: number
  lateFeeAmount: number
  totals: {
    thisMonth: number
    allTime: number
    lastCompletedCollected: number
    lastCompletedPending: number
  }
  members: Array<SocietyMember & { paidLastCompletedMonth: boolean; due: number }>
  unpaidLastCompletedMonth: Array<{ name: string; role: string; due: number }>
  months: MonthBreakdown[]
  allTransactions: Array<{
    name: string
    amount: number
    reason: string
    date: string
    month: string
  }>
  recentTransactions: Array<{
    name: string
    amount: number
    reason: string
    date: string
  }>
  briefing: string
}

export function monthKey(date: Date) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export function getCompletedMonths(transactions: SocietyTransaction[]): Date[] {
  const now = new Date()
  const lastCompleted = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  let earliest = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth() - 11, 1)

  if (transactions.length > 0) {
    const txnEarliest = new Date(
      Math.min(
        ...transactions.map((txn) => {
          const d = new Date(txn.timestamp)
          return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
        }),
      ),
    )
    if (txnEarliest < earliest) earliest = txnEarliest
  }

  const months: Date[] = []
  const cursor = new Date(earliest)
  while (cursor <= lastCompleted) {
    months.push(new Date(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months.reverse()
}

function formatTxnDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function buildSocietySnapshot(input: {
  viewer: { uid: string; email: string | null; displayName: string | null }
  members: SocietyMember[]
  transactions: SocietyTransaction[]
  monthlyAmount: number
}): SocietySnapshot {
  const now = new Date()
  const currentMonth = monthKey(now)
  const lastCompleted = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastCompletedMonth = monthKey(lastCompleted)
  const lateFeeAmount = input.monthlyAmount + 100

  const memberMap = new Map<string, SocietyMember>()
  for (const txn of input.transactions) {
    if (!memberMap.has(txn.userId)) {
      memberMap.set(txn.userId, {
        id: txn.userId,
        displayName: txn.userName || 'Unknown',
        role: 'member',
      })
    }
  }
  for (const member of input.members) {
    const existing = memberMap.get(member.id)
    memberMap.set(member.id, {
      id: member.id,
      displayName: member.displayName || existing?.displayName || 'Unknown',
      email: member.email || existing?.email || '',
      role: member.role || existing?.role || 'member',
    })
  }

  const allMembers = Array.from(memberMap.values())
  const expected = allMembers.length * input.monthlyAmount

  const paidLastCompleted = new Set(
    input.transactions
      .filter((txn) => monthKey(new Date(txn.timestamp)) === lastCompletedMonth)
      .map((txn) => txn.userId),
  )

  const members = allMembers.map((member) => {
    const paid = paidLastCompleted.has(member.id)
    return {
      ...member,
      paidLastCompletedMonth: paid,
      due: paid ? 0 : lateFeeAmount,
    }
  })

  const unpaidLastCompletedMonth = members
    .filter((member) => !member.paidLastCompletedMonth)
    .map((member) => ({
      name: member.displayName,
      role: member.role || 'member',
      due: member.due,
    }))

  const thisMonthTotal = input.transactions
    .filter((txn) => monthKey(new Date(txn.timestamp)) === currentMonth)
    .reduce((sum, txn) => sum + txn.amount, 0)

  const lastCompletedCollected = input.transactions
    .filter((txn) => monthKey(new Date(txn.timestamp)) === lastCompletedMonth)
    .reduce((sum, txn) => sum + txn.amount, 0)

  const allTime = input.transactions.reduce((sum, txn) => sum + txn.amount, 0)

  const monthDates = [
    { date: new Date(now.getFullYear(), now.getMonth(), 1), status: 'current' as const },
    ...getCompletedMonths(input.transactions).map((date) => ({ date, status: 'completed' as const })),
  ]

  const months: MonthBreakdown[] = monthDates.map(({ date, status }) => {
    const key = monthKey(date)
    const due = status === 'completed' ? lateFeeAmount : input.monthlyAmount
    const monthTxns = input.transactions.filter((txn) => monthKey(new Date(txn.timestamp)) === key)
    const paidAmounts = new Map<string, number>()
    for (const txn of monthTxns) {
      paidAmounts.set(txn.userId, (paidAmounts.get(txn.userId) || 0) + txn.amount)
    }

    const paid: MonthMemberStatus[] = []
    const unpaid: MonthMemberStatus[] = []

    for (const member of allMembers) {
      const amountPaid = paidAmounts.get(member.id) || 0
      const row = {
        name: member.displayName,
        role: member.role || 'member',
        email: member.email || '',
        amountPaid,
        due: amountPaid > 0 ? 0 : due,
      }
      if (amountPaid > 0) paid.push(row)
      else unpaid.push(row)
    }

    const collected = monthTxns.reduce((sum, txn) => sum + txn.amount, 0)
    return {
      month: key,
      status,
      collected,
      expected,
      pending: unpaid.length * due,
      paid,
      unpaid,
    }
  })

  const allTransactions = [...input.transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((txn) => ({
      name: txn.userName,
      amount: txn.amount,
      reason: txn.reason,
      date: formatTxnDate(txn.timestamp),
      month: monthKey(new Date(txn.timestamp)),
    }))

  const recentTransactions = allTransactions.slice(0, 25).map(({ name, amount, reason, date }) => ({
    name,
    amount,
    reason,
    date,
  }))

  const directoryLines = allMembers
    .map((member) => `- ${member.displayName} (${member.role || 'member'})${member.email ? ` <${member.email}>` : ''}`)
    .join('\n')

  const monthLines = months
    .map((month) => {
      const paidLines =
        month.paid.length === 0
          ? '- None'
          : month.paid.map((row) => `- ${row.name} (${row.role}) paid ₹${row.amountPaid}`).join('\n')
      const unpaidLines =
        month.unpaid.length === 0
          ? '- None. Everyone paid.'
          : month.unpaid.map((row) => `- ${row.name} (${row.role}) — ₹${row.due} due`).join('\n')

      return [
        `## ${month.month} [${month.status}]`,
        `Collected ₹${month.collected} of expected ₹${month.expected}. Unpaid: ${month.unpaid.length}/${allMembers.length}. Pending ₹${month.pending}.`,
        'PAID:',
        paidLines,
        'UNPAID:',
        unpaidLines,
      ].join('\n')
    })
    .join('\n\n')

  const txnLines =
    allTransactions.length === 0
      ? '- No transactions yet.'
      : allTransactions
          .map((row) => `- ${row.date} [${row.month}]: ${row.name} paid ₹${row.amount} (${row.reason || 'no reason'})`)
          .join('\n')

  const briefing = [
    'You are the Banuhashim Society payment assistant. Answer from this live Firebase data.',
    `Viewer: ${input.viewer.displayName || 'Unknown'} <${input.viewer.email || 'no-email'}>.`,
    'Do not ask to reconnect connectors. This file is the full payment book: every member, every month, paid and unpaid, and every transaction.',
    `Current month: ${currentMonth}. Last completed dues month: ${lastCompletedMonth}.`,
    `Monthly contribution: ₹${input.monthlyAmount}. Late unpaid amount for a completed month: ₹${lateFeeAmount}.`,
    `This month collected: ₹${thisMonthTotal}. All-time collected: ₹${allTime}. Members: ${allMembers.length}. Transactions: ${allTransactions.length}.`,
    '',
    '# Member directory',
    directoryLines || '- No members.',
    '',
    '# Paid and unpaid by month',
    monthLines,
    '',
    '# All transactions',
    txnLines,
  ].join('\n')

  return {
    generatedAt: now.toISOString(),
    viewer: input.viewer,
    currentMonth,
    lastCompletedMonth,
    monthlyAmount: input.monthlyAmount,
    lateFeeAmount,
    totals: {
      thisMonth: thisMonthTotal,
      allTime,
      lastCompletedCollected,
      lastCompletedPending: unpaidLastCompletedMonth.length * lateFeeAmount,
    },
    members,
    unpaidLastCompletedMonth,
    months,
    allTransactions,
    recentTransactions,
    briefing,
  }
}
