'use client'

import { createContext, useContext, useState } from 'react'

interface AdminModeContextType {
  adminMode: boolean
  toggleAdminMode: () => void
}

const AdminModeContext = createContext<AdminModeContextType>({
  adminMode: false,
  toggleAdminMode: () => {},
})

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [adminMode, setAdminMode] = useState(false)
  return (
    <AdminModeContext.Provider value={{ adminMode, toggleAdminMode: () => setAdminMode((p) => !p) }}>
      {children}
    </AdminModeContext.Provider>
  )
}

export function useAdminMode() {
  return useContext(AdminModeContext)
}
