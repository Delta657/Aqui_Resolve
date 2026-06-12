"use client"

import { AlertTriangle, Database, Key, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuracoes de Seguranca
              </CardTitle>
              <CardDescription>
                Esta tela nao exibe mais politicas, backups ou logs simulados.
              </CardDescription>
            </div>
            <Badge variant="outline">Dados reais obrigatorios</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ative um backend real de configuracao para expor politicas de senha, sessoes e recursos de seguranca.
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Politicas
            </CardTitle>
            <CardDescription>Nenhuma politica real carregada.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Os valores padrao artificiais foram removidos para nao sugerir uma configuracao que nao existe.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backups
            </CardTitle>
            <CardDescription>Nenhum agendamento real carregado.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Acionar backup ou salvar politicas permanece bloqueado ate existir endpoint real.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Auditoria
            </CardTitle>
            <CardDescription>Sem logs simulados em runtime.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Quando houver fonte real de auditoria, os eventos devem aparecer aqui com leitura direta do backend.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
