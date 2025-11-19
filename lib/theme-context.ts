'use client'

import { createContext } from 'react'

export type Theme = 'light' | 'dark'
export type Language = 'en' | 'ur' | 'ar'

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  language: Language
  setLanguage: (language: Language) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
