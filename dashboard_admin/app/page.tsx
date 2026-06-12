"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Eye, EyeOff, Moon, Sun, ArrowRight, Shield, BarChart3, Users } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login, user, loading: authLoading } = useAuth()

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")
    
    try {
      await login({ email, password, rememberMe })
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Erro no login:", error)
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        setLoginError("Email ou senha incorretos.")
      } else if (error?.code === 'auth/user-not-found') {
        setLoginError("Usuário não encontrado.")
      } else if (error?.code === 'auth/too-many-requests') {
        setLoginError("Muitas tentativas. Tente novamente em alguns minutos.")
      } else {
        setLoginError("Erro ao fazer login. Tente novamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-muted/40 via-orange-50 to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-linear-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-linear-to-br from-muted/40 via-orange-50 to-amber-50">
      {/* Lado esquerdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-linear-to-br from-orange-500 via-amber-500 to-orange-600">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)"/>
            </svg>
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-amber-400/20 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">AquiResolve</h1>
                <p className="text-white/80 text-sm">Painel Administrativo</p>
              </div>
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Gestão inteligente<br />para seu negócio
            </h2>
            
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Plataforma completa para gerenciar serviços, equipes e clientes com dados em tempo real.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics em Tempo Real</h3>
                <p className="text-sm text-white/70">Métricas e relatórios detalhados</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Gestão de Equipes</h3>
                <p className="text-sm text-white/70">Controle total de prestadores e clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">AquiResolve</h1>
            <p className="text-muted-foreground">Painel Administrativo</p>
          </div>

          {/* Card do formulário */}
          <div className="bg-card rounded-2xl shadow-card border border-border p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
              <p className="text-muted-foreground">Entre com suas credenciais para acessar o sistema</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Campo Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 pr-12 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Opções */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-orange-500 focus:ring-orange-500/20 cursor-pointer" 
                  />
                  <span className="text-sm text-muted-foreground">Lembrar-me</span>
                </label>
              </div>

              {/* Erro de login */}
              {loginError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium">{loginError}</p>
                </div>
              )}

              {/* Botão de Login */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-12 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Sistema de Administração - AquiResolve
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Versão 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
