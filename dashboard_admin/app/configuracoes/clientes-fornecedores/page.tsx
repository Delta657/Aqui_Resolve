"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit, Trash2, Building, Users } from "lucide-react"

const clients = [
  {
    id: "1",
    nome: "João Silva",
    tipo: "cliente",
    email: "joao@exemplo.com",
    telefone: "(27) 99999-9999",
    cpfCnpj: "123.456.789-00",
    endereco: "Rua das Flores, 123",
    cidade: "Vitória - ES",
    status: "ativo",
  },
  {
    id: "2",
    nome: "Maria Santos",
    tipo: "cliente",
    email: "maria@exemplo.com",
    telefone: "(27) 88888-8888",
    cpfCnpj: "987.654.321-00",
    endereco: "Av. Principal, 456",
    cidade: "Vila Velha - ES",
    status: "ativo",
  },
]

const suppliers = [
  {
    id: "1",
    nome: "Auto Peças Ltda",
    tipo: "fornecedor",
    email: "contato@autopecas.com",
    telefone: "(27) 3333-3333",
    cpfCnpj: "12.345.678/0001-90",
    endereco: "Rua Industrial, 789",
    cidade: "Serra - ES",
    status: "ativo",
    categoria: "Peças",
  },
  {
    id: "2",
    nome: "Combustível Express",
    tipo: "fornecedor",
    email: "vendas@combexpress.com",
    telefone: "(27) 2222-2222",
    cpfCnpj: "98.765.432/0001-10",
    endereco: "Av. Comercial, 321",
    cidade: "Cariacica - ES",
    status: "ativo",
    categoria: "Combustível",
  },
]

export default function ClientesFornecedoresPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes e Fornecedores</h1>
          <p className="text-muted-foreground">autem.com.br › configurações › clientes e fornecedores</p>
        </div>

        <Tabs defaultValue="clientes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="fornecedores" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Fornecedores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clientes" className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
                  <Input placeholder="Buscar clientes..." className="pl-20 w-64" />
                </div>
              </div>
            </div>

            {/* Clients Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.nome}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.telefone}</TableCell>
                        <TableCell>{client.cpfCnpj}</TableCell>
                        <TableCell>{client.cidade}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{client.status}</Badge>
                        </TableCell>
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
          </TabsContent>

          <TabsContent value="fornecedores" className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
                  <Input placeholder="Buscar fornecedores..." className="pl-20 w-64" />
                </div>
              </div>
            </div>

            {/* Suppliers Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.nome}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.telefone}</TableCell>
                        <TableCell>{supplier.cpfCnpj}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">{supplier.categoria}</Badge>
                        </TableCell>
                        <TableCell>{supplier.cidade}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{supplier.status}</Badge>
                        </TableCell>
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
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
