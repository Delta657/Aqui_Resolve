"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2 } from "lucide-react"

const damages = [
  {
    id: "1",
    data: "2025-01-15",
    profissional: "João Silva",
    tipo: "Dano em Veículo",
    descricao: "Arranhão na lateral direita",
    valor: 350.0,
    descontoProfissional: 100.0,
    status: "pendente",
  },
  {
    id: "2",
    data: "2025-01-10",
    profissional: "Maria Santos",
    tipo: "Perda de Equipamento",
    descricao: "Chave de fenda perdida",
    valor: 25.0,
    descontoProfissional: 25.0,
    status: "aprovado",
  },
]

export default function DanosPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danos</h1>
          <p className="text-muted-foreground">autem.com.br › controle › danos</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Dano
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
              <Input placeholder="Buscar danos..." className="pl-20 w-64" />
            </div>
          </div>
        </div>

        {/* Damages Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Desconto Profissional</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {damages.map((damage) => (
                  <TableRow key={damage.id}>
                    <TableCell>{damage.data}</TableCell>
                    <TableCell>{damage.profissional}</TableCell>
                    <TableCell>{damage.tipo}</TableCell>
                    <TableCell>{damage.descricao}</TableCell>
                    <TableCell>R$ {damage.valor.toFixed(2)}</TableCell>
                    <TableCell>R$ {damage.descontoProfissional.toFixed(2)}</TableCell>
                    <TableCell>{damage.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 bg-transparent">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
