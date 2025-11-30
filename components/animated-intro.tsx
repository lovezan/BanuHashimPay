"use client"

import { useEffect, useState } from "react"

interface AnimatedIntroProps {
  onComplete: () => void
}

export default function AnimatedIntro({ onComplete }: AnimatedIntroProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        onComplete()
      }, 500) // Wait for fade out animation
    }, 2000) // Show intro for 2 seconds

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className={`min-h-screen bg-background flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-accent to-accent/80 rounded-2xl mb-4 shadow-lg animate-pulse">
          <svg className="w-10 h-10 text-accent-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent animate-fade-in">
          Banuhashim
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl animate-fade-in-delay">
          Premium Payment Management System
        </p>
      </div>
    </div>
  )
}
