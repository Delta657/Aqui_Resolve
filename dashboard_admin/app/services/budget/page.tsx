import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, RefreshCw, X } from "lucide-react"

export default function ServicesBudgetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamento de Serviços</h1>
          <p className="text-muted-foreground">autem.com.br › serviços › orçamento</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <X className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        <Button className="bg-blue-500 hover:bg-blue-600">+ CADASTRAR</Button>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input placeholder="PROCURAR" className="pl-20" />
          </div>
        </div>
      </div>

      {/* Budget Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Intervalo de Tempo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Número</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Produto</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Profissional</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Placa</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Veículo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Serviço</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">O. Cidade</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">D. Cidade</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Observação</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={14} className="p-8 text-center text-muted-foreground">
                    Nenhum registro encontrado...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 text-sm text-muted-foreground border-t">Mostrando 0 até 0 de 0 resultado(s)</div>
        </CardContent>
      </Card>
    </div>
  )
}
