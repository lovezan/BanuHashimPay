'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { setDoc, doc, getDoc } from 'firebase/firestore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/lib/types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<UserRole>('member')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(result.user, { displayName })
        
        await setDoc(doc(db, 'users', result.user.uid), {
          email,
          displayName,
          role,
          createdAt: new Date(),
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.')
      } else {
        setError(err.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'consent' })
      provider.addScope('profile')
      provider.addScope('email')
      
      const result = await signInWithPopup(auth, provider)
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'member',
          createdAt: new Date(),
        })
      }
      console.log("[v0] Google sign-in successful for user:", result.user.uid)
    } catch (err: any) {
      console.error("[v0] Google sign-in error:", err.code, err.message)
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please contact admin to configure Firebase settings.')
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid authentication credentials. Please try again.')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups and try again.')
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign in cancelled.')
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please contact admin.')
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-32 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-accent to-accent/80 rounded-xl mb-4 shadow-lg">
            <svg className="w-7 h-7 text-accent-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
            Banuhashim
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">Premium Payment Management System</p>
        </div>

        {/* Auth Container */}
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl p-8 md:p-10 space-y-8">
          
          {/* Google Sign-In - Top Priority */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Access</p>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#1f2937] to-[#111827] hover:from-[#374151] hover:to-[#1f2937] text-white font-medium border border-border/50 transition-all duration-200 flex items-center justify-center gap-3 rounded-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground font-medium">or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2.5">Full Name</label>
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    required={isSignUp}
                    className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:bg-background focus:border-accent/50 transition-colors h-11"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2.5">Select Your Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['president', 'vice-president', 'member'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                          role === r
                            ? 'bg-accent text-accent-foreground border-2 border-accent'
                            : 'bg-secondary text-secondary-foreground border-2 border-border hover:border-accent/50'
                        }`}
                      >
                        {r === 'vice-president' ? 'V. President' : r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2.5">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:bg-background focus:border-accent/50 transition-colors h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2.5">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:bg-background focus:border-accent/50 transition-colors h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm p-3.5 rounded-lg flex items-start gap-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground font-semibold rounded-lg transition-all duration-200 mt-6"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="flex items-center justify-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setRole('member')
              }}
              className="ml-2 text-accent hover:text-accent/80 font-semibold transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By signing in, you agree to our{' '}
          <a href="#" className="text-accent hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" className="text-accent hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
