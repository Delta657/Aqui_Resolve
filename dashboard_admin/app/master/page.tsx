"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/logo"
import { useMasterAuth } from "@/hooks/use-master-auth"
import { MasterDashboard } from "@/components/master/master-dashboard"
import {
  LogIn,
  Mail,
  Lock,
  Shield,
  AlertTriangle,
} from "lucide-react"

// Configuração de cache/dinâmica é definida no app/master/layout.tsx (Server Component)

export default function MasterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { isMasterAuthenticated, masterLogin, masterUser, loading } = useMasterAuth()

  // Não redirecionar automaticamente - deixar o usuário tentar fazer login
  // useEffect(() => {
  //   if (!isMasterAuthenticated && masterUser === null) {
  //     // Se não está autenticado como master, redirecionar para dashboard
  //     router.push("/dashboard")
  //   }
  // }, [isMasterAuthenticated, masterUser, router])

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      await masterLogin(email, password)
      setEmail("")
      setPassword("")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('Erro no login:', error)
      if (message === 'PERMISSION_DENIED') {
        setError("Sem permissão no Firestore. Verifique se as regras foram publicadas no projeto correto (firebase deploy --only firestore:rules).")
      } else if (message === 'MASTER_NOT_FOUND') {
        setError("Documento master não encontrado. Execute na raiz do projeto: pnpm run setup:master")
      } else if (message === 'MASTER_INVALID_CONFIG') {
        setError("Documento master inválido (falta senhaHash). Execute: pnpm run setup:master")
      } else if (message.includes('FIREBASE_SERVICE_ACCOUNT') || message.includes('indisponível')) {
        setError("Login master indisponível. Configure FIREBASE_SERVICE_ACCOUNT no servidor (Vercel).")
      } else {
        setError("Credenciais inválidas. Apenas administradores master podem acessar esta área.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#FFFFFF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#F7931E', borderTopColor: 'transparent' }}></div>
          <p className="text-[#1F2B3D]">Verificando autenticação...</p>
        </div>
      </main>
    )
  }

  // Se já está autenticado como master, mostrar dashboard
  if (isMasterAuthenticated && masterUser) {
    return <MasterDashboard />
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#FFFFFF]">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Logo className="h-16" showText={true} />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="h-6 w-6" style={{ color: '#F7931E' }} />
            <p className="font-bold text-lg" style={{ color: '#203864' }}>
              Área Master
            </p>
          </div>
          <p className="font-medium" style={{ color: '#6B7280' }}>
            Acesso Exclusivo para Administradores Master
          </p>
        </div>

        {/* Card de Login Master */}
        <Card className="shadow-xl border bg-[#F9FAFB] backdrop-blur-sm" style={{ borderColor: '#E5E7EB' }}>
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center space-x-2" style={{ color: '#1F2B3D' }}>
              <LogIn className="h-5 w-5" style={{ color: '#F7931E' }} />
              <span>Login Master</span>
            </CardTitle>
            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
              Acesso restrito para configuração de permissões
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMasterLogin} className="space-y-6">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-md" style={{ border: '1px solid #FCA5A5' }}>
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium" style={{ color: '#1F2B3D' }}>
                  Email Master
                </Label>
                <div className="flex items-center rounded-md bg-background border border-border focus-within:ring-2 focus-within:ring-orange-400">
                  <div className="pl-3 pr-2 shrink-0">
                    <Mail className="h-4 w-4" style={{ color: '#6B7280' }} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="master@aquiresolve.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-0 bg-transparent pl-0 pr-4 h-11 placeholder:text-[#6B7280] focus:ring-0 focus:border-0 focus:outline-none"
                    style={{ color: '#1F2B3D' }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium" style={{ color: '#1F2B3D' }}>
                  Senha Master
                </Label>
                <div className="flex items-center rounded-md bg-background border border-border focus-within:ring-2 focus-within:ring-orange-400">
                  <div className="pl-3 pr-2 shrink-0">
                    <Lock className="h-4 w-4" style={{ color: '#6B7280' }} />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 bg-transparent pl-0 pr-4 h-11 placeholder:text-[#6B7280] focus:ring-0 focus:border-0 focus:outline-none"
                    style={{ color: '#1F2B3D' }}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-white font-medium focus:ring-2 focus:ring-offset-2 active:translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F7931E' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 mr-2" style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }} />
                    Verificando...
                  </>
                ) : (
                  "Acessar Área Master"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="text-sm"
                style={{ color: '#6B7280' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1F2B3D')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
              >
                ← Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <div className="mt-8 text-center text-sm" style={{ color: '#6B7280' }}>
          <p className="font-medium" style={{ color: '#1F2B3D' }}>Sistema Master - AquiResolve</p>
          <p>Controle de Permissões e Usuários</p>
        </div>
      </div>
    </main>
  )
}
