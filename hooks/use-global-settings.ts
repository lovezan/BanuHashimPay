import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useGlobalSettings() {
  const [monthlyAmount, setMonthlyAmount] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const docRef = doc(db, 'settings', 'global')
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().monthlyPaymentAmount !== undefined) {
        setMonthlyAmount(docSnap.data().monthlyPaymentAmount)
      } else {
        setMonthlyAmount(30)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const updateMonthlyAmount = async (amount: number) => {
    const docRef = doc(db, 'settings', 'global')
    await setDoc(docRef, { monthlyPaymentAmount: amount }, { merge: true })
  }

  return { monthlyAmount, updateMonthlyAmount, loading }
}
