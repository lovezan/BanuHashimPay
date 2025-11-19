'use client'

import { useEffect } from 'react'

export default function PWAServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Only register service worker in production or if explicitly enabled
    if (process.env.NODE_ENV === 'development') {
      return
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

