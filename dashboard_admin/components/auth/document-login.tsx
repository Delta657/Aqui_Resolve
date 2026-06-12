"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from "lucide-react"
import { useDocumentAuth } from "@/hooks/use-document-auth"
import { useRouter } from "next/navigation"

export const DocumentLogin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { login, isLoading } = useDocumentAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.")
      return
    }

    const success = await login(email, password)
    if (!success) {
      setError("Email ou senha incorretos.")
    }
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      {/* Botão de Voltar */}
      <Button
        variant="outline"
        onClick={handleBack}
        className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 hover:bg-background"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Dashboard
      </Button>
      
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Área de Documentos
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Acesso restrito para verificação de documentos
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-20"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-20 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Entrar
                </div>
              )}
            </Button>
          </form>

          {/* Informações de Segurança */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Informações de Segurança</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Conexão criptografada com SSL</li>
              <li>• Acesso restrito e monitorado</li>
              <li>• Sessão com expiração automática</li>
              <li>• Logs de auditoria completos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
