'use client'

import { useRouter } from 'next/navigation'
import { useThemeLanguage } from '@/lib/use-theme-language'
import { getTranslations } from '@/lib/i18n'
import Navigation from '@/components/navigation'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useState } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, language, setLanguage } = useThemeLanguage()
  const t = getTranslations(language)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={null} />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">{t.settings.theme}</h1>
        
        {/* Theme Settings */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-serif font-bold text-foreground mb-4">{t.settings.theme}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.657-9.193a1 1 0 00-1.414 0l-.707.707A1 1 0 005.05 6.464l.707-.707a1 1 0 011.414-1.414zM5 11a1 1 0 100-2H4a1 1 0 100 2h1z" clipRule="evenodd" />
                </svg>
                <span>{t.settings.lightMode}</span>
              </div>
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span>{t.settings.darkMode}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-serif font-bold text-foreground mb-4">{t.settings.language}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-lg border-2 transition-all ${
                language === 'en'
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <span className="font-medium">{t.settings.english}</span>
            </button>
            
            <button
              onClick={() => setLanguage('ur')}
              className={`p-4 rounded-lg border-2 transition-all ${
                language === 'ur'
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <span className="font-medium">{t.settings.urdu}</span>
            </button>
            
            <button
              onClick={() => setLanguage('ar')}
              className={`p-4 rounded-lg border-2 transition-all ${
                language === 'ar'
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <span className="font-medium">{t.settings.arabic}</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Loading...' : t.navigation.logout}
        </button>
      </main>
    </div>
  )
}
