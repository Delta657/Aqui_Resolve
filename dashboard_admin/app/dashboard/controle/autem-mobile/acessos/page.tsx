"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  LogIn, 
  Maximize2, 
  Filter, 
  RefreshCw, 
  Upload, 
  Search,
  ChevronUp,
  ChevronDown,
  Plus,
  Phone
} from "lucide-react"

interface Acesso {
  id: string
  dataHora: string
  usuario: string
  fonte: string
  acao: 'conectou' | 'desconectou'
}

export default function AcessosPage() {
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const acessos: Acesso[] = [
    {
      id: "1",
      dataHora: "12/08/2025 10:57",
      usuario: "JOYCE BARBOSA",
      fonte: "AUTEM MOBILE",
      acao: "conectou"
    },
    {
      id: "2",
      dataHora: "29/07/2025 10:33",
      usuario: "JOYCE BARBOSA",
      fonte: "AUTEM MOBILE",
      acao: "desconectou"
    },
    {
      id: "3",
      dataHora: "28/07/2025 15:45",
      usuario: "JOYCE BARBOSA",
      fonte: "AUTEM MOBILE",
      acao: "conectou"
    },
    {
      id: "4",
      dataHora: "28/07/2025 12:20",
      usuario: "JOYCE BARBOSA",
      fonte: "AUTEM MOBILE",
      acao: "desconectou"
    },
    {
      id: "5",
      dataHora: "27/07/2025 09:15",
      usuario: "JOYCE BARBOSA",
      fonte: "AUTEM MOBILE",
      acao: "conectou"
    },
    {
      id: "6",
      dataHora: "26/07/2025 18:30",
      usuario: "JOYCE BARBOSA",
      fonte: "AUTEM MOBILE",
      acao: "desconectou"
    },
    {
      id: "7",
      dataHora: "26/07/2025 08:45",
      usuario: "JOYCE BARBOSA",
      fonte: "AUTEM MOBILE",
      acao: "conectou"
    },
    {
      id: "8",
      dataHora: "25/07/2025 17:22",
      usuario: "JOYCE BARBOSA",
      fonte: "AUTEM MOBILE",
      acao: "desconectou"
    }
  ]

  const columns = [
    { key: "dataHora", label: "Data e Hora", sortable: true },
    { key: "usuario", label: "Usuário", sortable: true },
    { key: "fonte", label: "Fonte", sortable: true },
    { key: "acao", label: "Ação", sortable: true }
  ]

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
    }
    return sortDirection === "asc" ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />
  }

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'conectou':
        return <Badge className="bg-green-100 text-green-800 border-green-200">CONECTOU</Badge>
      case 'desconectou':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">DESCONECTOU</Badge>
      default:
        return <Badge variant="outline">{acao.toUpperCase()}</Badge>
    }
  }

  const filteredAcessos = acessos.filter(acesso =>
    Object.values(acesso).some(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <main className="flex-1 space-y-6 p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Acessos</h1>
            <p className="text-sm text-muted-foreground">
              autem.com.br &gt; controle &gt; autem mobile &gt; acessos
            </p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Acesso
        </Button>
      </div>

      {/* Barra de Ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4 mr-1" />
            Expandir
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="PROCURAR"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabela de Acessos */}
      <Card style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left text-sm font-medium text-foreground ${
                        column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                      }`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAcessos.map((acesso, index) => (
                  <tr
                    key={acesso.id}
                    className={`border-b hover:bg-muted/50/50 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/50'
                    }`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      {acesso.dataHora}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {acesso.usuario}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {acesso.fonte}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getAcaoBadge(acesso.acao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando de 1 até 25 de 25 resultado(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1}>
            &lt;
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-600 text-white">
            1
          </Button>
          <Button variant="outline" size="sm" disabled={filteredAcessos.length <= 25}>
            &gt;
          </Button>
        </div>
      </div>

      {/* Botões Flutuantes */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-2">
        <Button className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg">
          <Plus className="h-5 w-5" />
        </Button>
        <Button className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
          <Phone className="h-5 w-5" />
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-8">
        Copyright © 2025 AutEM v2.2.1 Todos os direitos reservados
      </div>
    </main>
  )
}
