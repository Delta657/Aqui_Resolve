"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Tag } from "lucide-react"

const tags = [
  {
    id: "1",
    nome: "Urgente",
    descricao: "Serviços que requerem atendimento imediato",
    cor: "#ef4444",
    categoria: "Prioridade",
    usageCount: 25,
    ativo: true,
    criadaEm: "2024-12-01",
  },
  {
    id: "2",
    nome: "VIP",
    descricao: "Clientes com atendimento diferenciado",
    cor: "#8b5cf6",
    categoria: "Cliente",
    usageCount: 12,
    ativo: true,
    criadaEm: "2024-11-15",
  },
  {
    id: "3",
    nome: "Noturno",
    descricao: "Serviços realizados no período noturno",
    cor: "#1f2937",
    categoria: "Horário",
    usageCount: 8,
    ativo: true,
    criadaEm: "2024-10-20",
  },
  {
    id: "4",
    nome: "Garantia",
    descricao: "Serviços cobertos por garantia",
    cor: "#16a34a",
    categoria: "Tipo",
    usageCount: 15,
    ativo: true,
    criadaEm: "2024-09-10",
  },
]

export default function TagsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tags</h1>
          <p className="text-muted-foreground">autem.com.br › configurações › tags</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tag
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
              <Input placeholder="Buscar tags..." className="pl-20 w-64" />
            </div>
          </div>
        </div>

        {/* Tags Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" style={{ color: tag.cor }} />
                        {tag.nome}
                      </div>
                    </TableCell>
                    <TableCell>{tag.descricao}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.cor }}></div>
                        {tag.cor}
                      </div>
                    </TableCell>
                    <TableCell>{tag.categoria}</TableCell>
                    <TableCell>{tag.usageCount} vezes</TableCell>
                    <TableCell>
                      <Badge className={tag.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {tag.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{tag.criadaEm}</TableCell>
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
