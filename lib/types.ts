export type UserRole = 'president' | 'vice-president' | 'member'

export interface Transaction {
  id: string
  userId: string
  userName: string
  amount: number
  reason: string
  timestamp: number
  date: string
}

export interface User {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt?: any
}
