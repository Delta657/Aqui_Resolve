"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Users, User } from "lucide-react"

const teams = [
  {
    id: "1",
    nome: "Equipe Norte",
    descricao: "Responsável pela região norte da cidade",
    lider: "João Silva",
    membros: 5,
    regiao: "Norte",
    status: "ativa",
    criadaEm: "2024-12-01",
  },
  {
    id: "2",
    nome: "Equipe Sul",
    descricao: "Responsável pela região sul da cidade",
    lider: "Maria Santos",
    membros: 4,
    regiao: "Sul",
    status: "ativa",
    criadaEm: "2024-11-15",
  },
  {
    id: "3",
    nome: "Equipe Emergência",
    descricao: "Equipe especializada em atendimentos de emergência",
    lider: "Pedro Costa",
    membros: 3,
    regiao: "Todas",
    status: "ativa",
    criadaEm: "2024-10-20",
  },
]

export default function EquipesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipes</h1>
          <p className="text-muted-foreground">autem.com.br › configurações › equipes</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Equipe
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
              <Input placeholder="Buscar equipes..." className="pl-20 w-64" />
            </div>
          </div>
        </div>

        {/* Teams Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Líder</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.nome}</TableCell>
                    <TableCell>{team.descricao}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        {team.lider}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        {team.membros} membros
                      </div>
                    </TableCell>
                    <TableCell>{team.regiao}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">{team.status}</Badge>
                    </TableCell>
                    <TableCell>{team.criadaEm}</TableCell>
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
