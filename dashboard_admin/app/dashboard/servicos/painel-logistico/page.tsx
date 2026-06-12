"use client"

import { AlertCircle, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PainelLogisticoPage() {
  return (
    <main className="flex-1 space-y-6 p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Logistico</h1>
        <p className="text-sm text-muted-foreground">
          Os cards e agendamentos de exemplo foram removidos desta visao.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Dados logisticos indisponiveis
          </CardTitle>
          <CardDescription>
            Nenhuma fonte real de roteirizacao, despacho ou acompanhamento foi ligada a esta pagina.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          A lista de agendamentos, enderecos, clientes e status locais foi removida para evitar exibicao de dados
          artificiais.
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-6 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
          <p>
            Esta rota deve ser preenchida apenas quando existir backend real para o fluxo logistico.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
