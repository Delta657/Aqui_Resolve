"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async ({ email, password, rememberMe }: { email: string; password: string; rememberMe?: boolean }) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
    await setPersistence(auth, persistence)
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const logout = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
