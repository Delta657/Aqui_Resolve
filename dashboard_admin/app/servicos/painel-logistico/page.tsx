"use client"

import { AlertCircle, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PainelLogisticoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Painel Logistico</h1>
        <p className="text-muted-foreground">
          A visualizacao logistica de exemplo foi removida do runtime.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Sem fonte logistica real
          </CardTitle>
          <CardDescription>
            Esta tela exigiria dados reais de despacho, deslocamento ou localizacao para funcionar corretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          A tabela de protocolos, bairros, tempos e quilometragem foi removida porque era composta por dados ficticios.
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-6 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
          <p>
            Quando houver colecao ou servico real de logistica, esta pagina deve exibir apenas os registros efetivos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
