"use client"

import { Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminLogs() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center">
          <Shield className="h-5 w-5 text-orange-500 mr-2" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum log real de auditoria foi encontrado para este painel.
        </div>
      </CardContent>
    </Card>
  )
}
