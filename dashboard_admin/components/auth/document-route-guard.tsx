"use client"

import { ReactNode } from "react"
import { useDocumentAuth } from "@/hooks/use-document-auth"
import { DocumentLogin } from "./document-login"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, AlertTriangle, Loader2 } from "lucide-react"

interface DocumentRouteGuardProps {
  children: ReactNode
  requiredRole?: string
}

export const DocumentRouteGuard = ({ children, requiredRole }: DocumentRouteGuardProps) => {
  const { isAuthenticated, isLoading, user } = useDocumentAuth()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium text-foreground">
                Verificando autenticação...
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto verificamos suas credenciais
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <DocumentLogin />
  }

  // Se estiver autenticado mas não tiver a role necessária
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Acesso Negado
            </h2>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar esta área.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Role necessária: <span className="font-mono bg-muted px-2 py-1 rounded">{requiredRole}</span></p>
              <p>Seu role: <span className="font-mono bg-muted px-2 py-1 rounded">{user?.role}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se estiver autenticado e tiver permissão, mostrar o conteúdo
  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header de Segurança */}
      <div className="bg-card border-b border-border px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-foreground">
              Área Segura - Documentos
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto p-4">
        {children}
      </div>
    </div>
  )
}
