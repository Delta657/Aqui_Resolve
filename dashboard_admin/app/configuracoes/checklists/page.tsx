"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, CheckSquare } from "lucide-react"

const checklists = [
  {
    id: "1",
    nome: "Checklist Pré-Serviço",
    descricao: "Verificações antes de iniciar o serviço",
    itens: 8,
    categoria: "Serviços",
    ativo: true,
    criadoEm: "2024-12-01",
  },
  {
    id: "2",
    nome: "Checklist Pós-Serviço",
    descricao: "Verificações após conclusão do serviço",
    itens: 6,
    categoria: "Serviços",
    ativo: true,
    criadoEm: "2024-12-01",
  },
  {
    id: "3",
    nome: "Checklist Segurança",
    descricao: "Itens de segurança obrigatórios",
    itens: 12,
    categoria: "Segurança",
    ativo: true,
    criadoEm: "2024-11-15",
  },
]

export default function ChecklistsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Checklists</h1>
          <p className="text-muted-foreground">autem.com.br › configurações › checklists</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Checklist
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
              <Input placeholder="Buscar checklists..." className="pl-20 w-64" />
            </div>
          </div>
        </div>

        {/* Checklists Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklists.map((checklist) => (
                  <TableRow key={checklist.id}>
                    <TableCell className="font-medium">{checklist.nome}</TableCell>
                    <TableCell>{checklist.descricao}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                        {checklist.itens} itens
                      </div>
                    </TableCell>
                    <TableCell>{checklist.categoria}</TableCell>
                    <TableCell>
                      <Badge className={checklist.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {checklist.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{checklist.criadoEm}</TableCell>
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
