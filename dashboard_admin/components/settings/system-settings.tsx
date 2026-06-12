"use client"

import { AlertTriangle, Server } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SystemSettings() {
  const environment = process.env.NODE_ENV || 'desconhecido'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Sistema
              </CardTitle>
              <CardDescription>
                Informacoes sinteticas de uptime, integracoes e servicos foram removidas desta tela.
              </CardDescription>
            </div>
            <Badge variant="outline">Somente dado real</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Ambiente atual:</strong> {environment}
          </p>
          <p>
            Metricas operacionais, alertas e status de servicos devem ser exibidos apenas quando houver telemetria real
            conectada.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Integracoes e Alertas
          </CardTitle>
          <CardDescription>
            Nenhuma acao administrativa fica disponivel sem um endpoint real de execucao e monitoramento.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Os botoes locais de reinicio, teste, atualizacao e limpeza de cache foram removidos para nao simular sucesso.
        </CardContent>
      </Card>
    </div>
  )
}
