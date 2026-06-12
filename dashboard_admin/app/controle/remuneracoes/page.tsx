"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, DollarSign } from "lucide-react"

const payroll = [
  {
    id: "1",
    profissional: "João Silva",
    periodo: "Janeiro 2025",
    servicosRealizados: 15,
    valorBase: 2500.0,
    comissoes: 450.0,
    descontos: 125.0,
    valorLiquido: 2825.0,
    status: "pago",
    dataPagamento: "2025-01-05",
  },
  {
    id: "2",
    profissional: "Maria Santos",
    periodo: "Janeiro 2025",
    servicosRealizados: 22,
    valorBase: 3000.0,
    comissoes: 660.0,
    descontos: 180.0,
    valorLiquido: 3480.0,
    status: "pendente",
    dataPagamento: null,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "pago":
      return "bg-green-100 text-green-800"
    case "pendente":
      return "bg-yellow-100 text-yellow-800"
    case "atrasado":
      return "bg-red-100 text-red-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function RemuneracoesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Remunerações</h1>
          <p className="text-muted-foreground">autem.com.br › controle › remunerações</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Processar Folha
            </Button>
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Relatório
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
              <Input placeholder="Buscar..." className="pl-20 w-64" />
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead>Valor Base</TableHead>
                  <TableHead>Comissões</TableHead>
                  <TableHead>Descontos</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.profissional}</TableCell>
                    <TableCell>{payment.periodo}</TableCell>
                    <TableCell>{payment.servicosRealizados}</TableCell>
                    <TableCell>R$ {payment.valorBase.toFixed(2)}</TableCell>
                    <TableCell>R$ {payment.comissoes.toFixed(2)}</TableCell>
                    <TableCell>R$ {payment.descontos.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">R$ {payment.valorLiquido.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell>{payment.dataPagamento || "---"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {payment.status === "pendente" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Pagar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
