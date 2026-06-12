"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  FileText,
  Users,
  Activity,
  Settings,
  AlertTriangle,
} from "lucide-react"
import type {
  DataSubjectRequest,
  DataProcessingLog,
  Consent,
} from "@/types/lgpd"

export default function LGPDAdminPage() {
  const [requests, setRequests] = useState<DataSubjectRequest[]>([])
  const [processingLogs, setProcessingLogs] = useState<DataProcessingLog[]>([])
  const [consents, setConsents] = useState<Consent[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Carregar solicitações pendentes
      // Carregar logs recentes
      // Carregar estatísticas de consentimentos
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão LGPD</h1>
        <p className="text-muted-foreground">
          Gerencie conformidade, solicitações e políticas de proteção de dados
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="logs">Logs de Processamento</TabsTrigger>
          <TabsTrigger value="consents">Consentimentos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Solicitações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {requests.filter((r) => r.status === "pendente").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Usuários com Consentimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Set(consents.map((c) => c.userId)).size}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Processamentos Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {
                    processingLogs.filter(
                      (log) =>
                        new Date(log.timestamp).toDateString() ===
                        new Date().toDateString()
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Direitos do Titular</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma solicitação encontrada
                  </p>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {request.requestType.replace("_", " ")}
                          </span>
                          <Badge
                            variant={
                              request.status === "concluido"
                                ? "default"
                                : request.status === "pendente"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.userEmail} -{" "}
                          {new Date(request.requestedAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Ver Detalhes
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Processamento de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {processingLogs.slice(0, 50).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border rounded-lg text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.activity}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">{log.purpose}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{log.legalBasis}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.dataType.join(", ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consents">
          <Card>
            <CardHeader>
              <CardTitle>Consentimentos Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Visualização de consentimentos em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações LGPD</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">DPO (Data Protection Officer)</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure os dados do responsável pela proteção de dados
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Políticas de Retenção</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure períodos de retenção e anonimização de dados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


