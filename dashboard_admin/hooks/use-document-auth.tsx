"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { validateCredentials, generateSessionToken, isAuthenticated as checkTokenValid } from '@/lib/auth-documents'
import { useToast } from '@/hooks/use-toast'

interface DocumentUser {
  email: string
  role: string
  name: string
}

interface DocumentAuthContextType {
  user: DocumentUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => void
}

const DocumentAuthContext = createContext<DocumentAuthContextType | undefined>(undefined)

export const useDocumentAuth = (): DocumentAuthContextType => {
  const context = useContext(DocumentAuthContext)
  // Fallback seguro: permite uso do hook sem o provider (ex.: durante SSR/prerender)
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => false,
      logout: () => {},
      checkAuth: () => {},
    }
  }
  return context
}

interface DocumentAuthProviderProps {
  children: ReactNode
}

export const DocumentAuthProvider = ({ children }: DocumentAuthProviderProps) => {
  const [user, setUser] = useState<DocumentUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Verificar autenticação ao carregar
  const checkAuth = () => {
    try {
      const sessionToken = localStorage.getItem('document_session_token')
      const userData = localStorage.getItem('document_user_data')
      
      if (sessionToken && userData && checkTokenValid(sessionToken)) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } else {
        // Limpar dados inválidos
        localStorage.removeItem('document_session_token')
        localStorage.removeItem('document_user_data')
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const validation = validateCredentials(email, password)
      
      if (validation.valid && validation.user) {
        const sessionToken = generateSessionToken()
        
        // Armazenar dados da sessão
        localStorage.setItem('document_session_token', sessionToken)
        localStorage.setItem('document_user_data', JSON.stringify(validation.user))
        
        setUser(validation.user)
        setIsAuthenticated(true)
        
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${validation.user.name}!`,
        })
        
        return true
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Email ou senha incorretos.",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Erro no login:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o login.",
        variant: "destructive"
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout
  const logout = () => {
    try {
      // Limpar dados da sessão
      localStorage.removeItem('document_session_token')
      localStorage.removeItem('document_user_data')
      
      setUser(null)
      setIsAuthenticated(false)
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  // Verificar autenticação na inicialização
  useEffect(() => {
    checkAuth()
  }, [])

  const value: DocumentAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  }

  return (
    <DocumentAuthContext.Provider value={value}>
      {children}
    </DocumentAuthContext.Provider>
  )
}

// Hook para verificar se o usuário tem permissão
export const useDocumentPermission = (requiredRole?: string) => {
  const { user, isAuthenticated } = useDocumentAuth()
  
  const hasPermission = (): boolean => {
    if (!isAuthenticated || !user) return false
    if (!requiredRole) return true
    return user.role === requiredRole
  }
  
  return {
    hasPermission: hasPermission(),
    user,
    isAuthenticated
  }
}
