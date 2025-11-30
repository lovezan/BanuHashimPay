"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import LoginPage from "@/components/auth/login-page"
import MainFeed from "@/components/main-feed"
import LoadingAnimation from "@/components/loading-animation"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const hasShownAnimation = sessionStorage.getItem("banuhashim_animation_shown")

    if (!hasShownAnimation) {
      setShowLoadingAnimation(true)
      sessionStorage.setItem("banuhashim_animation_shown", "true")
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (showLoadingAnimation) {
    return (
      <LoadingAnimation
        onComplete={() => {
          setShowLoadingAnimation(false)
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-muted-foreground border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <MainFeed user={user} /> : <LoginPage />
}
