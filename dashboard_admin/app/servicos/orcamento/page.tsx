"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, X } from "lucide-react"

export default function OrcamentoPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamento de Serviços</h1>
          <p className="text-muted-foreground">autem.com.br › serviços › orçamento</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              📋
            </Button>
            <Button variant="outline" size="sm">
              🔄
            </Button>
            <Button variant="outline" size="sm">
              📥
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
              <Input placeholder="PROCURAR" className="pl-20 w-32" />
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            CADASTRAR
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="text-muted-foreground/60 mb-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum registro encontrado...</h3>
              <p className="text-muted-foreground mb-6">Não há orçamentos cadastrados no sistema ainda.</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table Structure (hidden when empty) */}
        <Card className="hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Intervalo de Tempo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>O. Cidade</TableHead>
                  <TableHead>D. Cidade</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado...
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Mostrando 0 até 0 de 0 resultado(s)</p>
        </div>
      </div>
    </AppShell>
  )
}
