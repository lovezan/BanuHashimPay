"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if app is already installed or prompt was recently dismissed
    const isDismissed = localStorage.getItem("pwa-prompt-dismissed")
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches

    if (isStandalone || isDismissed === "true") {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }
    // Show the install prompt
    deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowPrompt(false)
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Remember the user's choice for a while (e.g., 7 days or indefinitely)
    localStorage.setItem("pwa-prompt-dismissed", "true")
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-gradient-to-br from-card to-card/95 border-2 border-accent/30 rounded-xl shadow-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-accent/50 transition-colors">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-white font-bold text-xl font-serif">B</span>
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-sm font-bold text-foreground mb-1">Install Banuhashim Pay</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Add our app to your home screen for quick access and offline tracking.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
