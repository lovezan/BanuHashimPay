'use client'

import { useContext } from 'react'
import { ThemeContext } from '@/lib/theme-context'

export function useThemeLanguage() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeLanguage must be used within ThemeLanguageProvider')
  }
  return context
}
