"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, User, CheckCircle, XCircle } from "lucide-react"

const professionals = [
  {
    id: "1",
    nome: "João Silva",
    email: "joao@exemplo.com",
    telefone: "(27) 99999-9999",
    cpf: "123.456.789-00",
    categorias: ["Mecânica", "Elétrica"],
    verificado: true,
    status: "ativo",
    rating: 4.8,
    servicosRealizados: 125,
    criadoEm: "2024-12-01",
  },
  {
    id: "2",
    nome: "Maria Santos",
    email: "maria@exemplo.com",
    telefone: "(27) 88888-8888",
    cpf: "987.654.321-00",
    categorias: ["Pintura", "Funilaria"],
    verificado: true,
    status: "ativo",
    rating: 4.9,
    servicosRealizados: 98,
    criadoEm: "2024-11-15",
  },
  {
    id: "3",
    nome: "Pedro Costa",
    email: "pedro@exemplo.com",
    telefone: "(27) 77777-7777",
    cpf: "456.789.123-00",
    categorias: ["Mecânica"],
    verificado: false,
    status: "pendente",
    rating: 0,
    servicosRealizados: 0,
    criadoEm: "2025-01-10",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "ativo":
      return "bg-green-100 text-green-800"
    case "inativo":
      return "bg-red-100 text-red-800"
    case "pendente":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function ProfissionaisPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profissionais</h1>
          <p className="text-muted-foreground">autem.com.br › configurações › profissionais</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Profissional
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
              <Input placeholder="Buscar profissionais..." className="pl-20 w-64" />
            </div>
          </div>
        </div>

        {/* Professionals Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Categorias</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        {professional.nome}
                      </div>
                    </TableCell>
                    <TableCell>{professional.email}</TableCell>
                    <TableCell>{professional.telefone}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {professional.categorias.map((categoria, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {categoria}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {professional.verificado ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(professional.status)}>{professional.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {professional.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          {professional.rating.toFixed(1)}
                        </div>
                      ) : (
                        "---"
                      )}
                    </TableCell>
                    <TableCell>{professional.servicosRealizados}</TableCell>
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
