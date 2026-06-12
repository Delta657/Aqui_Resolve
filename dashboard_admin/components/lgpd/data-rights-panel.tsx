"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  Download,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import type { DataSubjectRequest } from "@/types/lgpd"

interface DataRightsPanelProps {
  userId: string
  userEmail: string
}

export function DataRightsPanel({ userId, userEmail }: DataRightsPanelProps) {
  const [requests, setRequests] = useState<DataSubjectRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accessDialogOpen, setAccessDialogOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    loadRequests()
  }, [userId])

  const loadRequests = async () => {
    try {
      const response = await fetch(`/api/lgpd/rights?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error)
    }
  }

  const handleAccessRequest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/lgpd/rights/access?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setUserData(data.data)
        setAccessDialogOpen(true)
      }
    } catch (error) {
      console.error("Erro ao obter dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePortabilityRequest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/lgpd/rights/portability?userId=${userId}&format=json`
      )
      const data = await response.json()
      if (data.success) {
        // Download do arquivo JSON
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `meus-dados-${new Date().toISOString()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRequest = async (confirm: boolean) => {
    if (!confirm) {
      setDeleteDialogOpen(false)
      return
    }

    setIsLoading(true)
    try {
      // Criar solicitação de exclusão
      const requestResponse = await fetch("/api/lgpd/rights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail,
          requestType: "exclusao",
          description: "Solicitação de exclusão de dados pessoais",
        }),
      })

      if (requestResponse.ok) {
        const requestData = await requestResponse.json()

        // Processar exclusão
        const deleteResponse = await fetch("/api/lgpd/rights/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            userEmail,
            requestId: requestData.requestId,
            confirm: true,
          }),
        })

        if (deleteResponse.ok) {
          alert("Seus dados foram anonimizados com sucesso.")
          setDeleteDialogOpen(false)
          // Redirecionar ou fazer logout
        }
      }
    } catch (error) {
      console.error("Erro ao processar exclusão:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: { variant: "secondary", icon: Clock },
      em_andamento: { variant: "default", icon: Clock },
      concluido: { variant: "default", icon: CheckCircle2 },
      rejeitado: { variant: "destructive", icon: XCircle },
    }

    const config = variants[status] || variants.pendente
    const Icon = config.icon

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-orange-600" />
            <CardTitle>Seus Direitos LGPD</CardTitle>
          </div>
          <CardDescription>
            Gerencie seus dados pessoais e exerça seus direitos conforme a LGPD
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleAccessRequest}
              disabled={isLoading}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="h-4 w-4" />
                <span className="font-semibold">Acessar Meus Dados</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Visualizar todos os dados pessoais que temos sobre você
              </span>
            </Button>

            <Button
              onClick={handlePortabilityRequest}
              disabled={isLoading}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Download className="h-4 w-4" />
                <span className="font-semibold">Exportar Meus Dados</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Baixar seus dados em formato estruturado (portabilidade)
              </span>
            </Button>

            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isLoading}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start border-red-200 text-red-600 hover:bg-red-50"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Trash2 className="h-4 w-4" />
                <span className="font-semibold">Excluir Meus Dados</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Solicitar anonimização/exclusão de seus dados pessoais
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">Política de Privacidade</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Ler nossa política completa de privacidade
              </span>
            </Button>
          </div>

          {requests.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Histórico de Solicitações</h3>
              <div className="space-y-2">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {request.requestType.replace("_", " ")}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(request.requestedAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Acesso */}
      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Seus Dados Pessoais</DialogTitle>
            <DialogDescription>
              Todos os dados pessoais que temos sobre você
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <pre className="bg-muted/50 p-4 rounded-lg text-xs">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setAccessDialogOpen(false)}>Fechar</Button>
            <Button
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify(userData, null, 2)],
                  { type: "application/json" }
                )
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `meus-dados-${new Date().toISOString()}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão de Dados</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ao confirmar, seus dados pessoais serão anonimizados. Alguns
              dados podem ser mantidos de forma anonimizada para cumprimento de
              obrigações legais (ex: registros fiscais).
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDeleteRequest(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteRequest(true)}
              disabled={isLoading}
            >
              {isLoading ? "Processando..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


