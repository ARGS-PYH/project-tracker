import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { auth } from '../../firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      nextUser => {
        setUser(nextUser)
        setLoading(false)
      },
      () => {
        setUser(null)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email.trim(), password),
    signUp: async ({ name, email, password }) => {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() })
      await sendEmailVerification(credential.user)
      await reload(credential.user)
      setUser(auth.currentUser)
      return auth.currentUser
    },
    signOut: () => signOut(auth),
    sendVerification: () => auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.reject(new Error('No signed-in user.')),
    refreshUser: async () => {
      if (!auth.currentUser) return null
      await reload(auth.currentUser)
      setUser(auth.currentUser)
      return auth.currentUser
    },
    resetPassword: email => sendPasswordResetEmail(auth, email.trim())
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
