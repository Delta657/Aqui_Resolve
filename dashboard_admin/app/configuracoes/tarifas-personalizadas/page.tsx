"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, DollarSign } from "lucide-react"

const customRates = [
  {
    id: "1",
    nome: "Tarifa Padrão",
    categoria: "Serviços Gerais",
    valorBase: 50.00,
    valorKm: 2.50,
    valorMinuto: 1.00,
    regiao: "Todas",
    ativo: true,
    criadaEm: "2024-12-01",
  },
  {
    id: "2",
    nome: "Tarifa Emergência",
    categoria: "Emergência",
    valorBase: 80.00,
    valorKm: 4.00,
    valorMinuto: 2.00,
    regiao: "Todas",
    ativo: true,
    criadaEm: "2024-11-15",
  },
  {
    id: "3",
    nome: "Tarifa Noturna",
    categoria: "Serviços Noturnos",
    valorBase: 65.00,
    valorKm: 3.00,
    valorMinuto: 1.50,
    regiao: "Centro",
    ativo: true,
    criadaEm: "2024-10-20",
  },
]

export default function TarifasPersonalizadasPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tarifas Personalizadas</h1>
          <p className="text-muted-foreground">autem.com.br › configurações › tarifas personalizadas</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarifa
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
              <Input placeholder="Buscar tarifas..." className="pl-20 w-64" />
            </div>
          </div>
        </div>

        {/* Custom Rates Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor Base</TableHead>
                  <TableHead>Valor por Km</TableHead>
                  <TableHead>Valor por Minuto</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.nome}</TableCell>
                    <TableCell>{rate.categoria}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        R$ {rate.valorBase.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>R$ {rate.valorKm.toFixed(2)}</TableCell>
                    <TableCell>R$ {rate.valorMinuto.toFixed(2)}</TableCell>
                    <TableCell>{rate.regiao}</TableCell>
                    <TableCell>
                      <Badge className={rate.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {rate.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{rate.criadaEm}</TableCell>
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
