"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Calculator, 
  X, 
  Filter, 
  RefreshCw, 
  Upload, 
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  Calendar,
  Clock,
  Hash,
  Package,
  User,
  Car,
  MapPin,
  Building,
  FileText,
  Eye,
  Edit,
  Trash2,
  Phone
} from "lucide-react"

interface Orcamento {
  id: string
  data: string
  intervalo: string
  numero: string
  produto: string
  cliente: string
  profissional: string
  placa: string
  veiculo: string
  servico: string
  origemCidade: string
  destinoCidade: string
  observacao: string
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise'
  total: number
}

export default function OrcamentoServicosPage() {
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const orcamentos: Orcamento[] = [
    {
      id: "1",
      data: "13/08/2025",
      intervalo: "08:00 - 12:00",
      numero: "ORC-001",
      produto: "Assistência 24h",
      cliente: "João Silva",
      profissional: "Carlos Santos",
      placa: "ABC-1234",
      veiculo: "Toyota Corolla",
      servico: "Guincho",
      origemCidade: "Vila Velha - ES",
      destinoCidade: "Vitória - ES",
      observacao: "Urgente",
      status: "aprovado",
      total: 150.00
    },
    {
      id: "2",
      data: "13/08/2025",
      intervalo: "14:00 - 16:00",
      numero: "ORC-002",
      produto: "Seguro Auto",
      cliente: "Maria Santos",
      profissional: "Ana Costa",
      placa: "XYZ-5678",
      veiculo: "Honda Civic",
      servico: "Assistência",
      origemCidade: "Serra - ES",
      destinoCidade: "Cariacica - ES",
      observacao: "Agendado",
      status: "pendente",
      total: 200.00
    }
  ]

  const columns = [
    { key: "data", label: "Data", sortable: true },
    { key: "intervalo", label: "Intervalo de Tempo", sortable: true },
    { key: "numero", label: "Numero", sortable: true },
    { key: "produto", label: "Produto", sortable: true },
    { key: "cliente", label: "Cliente", sortable: true },
    { key: "profissional", label: "Profissional", sortable: true },
    { key: "placa", label: "Placa", sortable: true },
    { key: "veiculo", label: "Veículo", sortable: true },
    { key: "servico", label: "Serviço", sortable: true },
    { key: "origemCidade", label: "O. Cidade", sortable: true },
    { key: "destinoCidade", label: "D. Cidade", sortable: true },
    { key: "observacao", label: "Observação", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "total", label: "Total", sortable: true }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Pendente</Badge>
      case 'aprovado':
        return <Badge variant="outline" className="text-green-600 border-green-200">Aprovado</Badge>
      case 'rejeitado':
        return <Badge variant="outline" className="text-red-600 border-red-200">Rejeitado</Badge>
      case 'em_analise':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Em Análise</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const filteredOrcamentos = orcamentos.filter(orcamento =>
    Object.values(orcamento).some(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <main className="flex-1 space-y-6 p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Calculator className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orçamento de Serviços</h1>
            <p className="text-sm text-muted-foreground">
              autem.com.br &gt; serviços &gt; orçamento
            </p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          + CADASTRAR
        </Button>
      </div>

      {/* Barra de Ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <X className="h-4 w-4 mr-1" />
            Limpar
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
            Importar
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

      {/* Tabela de Orçamentos */}
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrcamentos.length > 0 ? (
                  filteredOrcamentos.map((orcamento, index) => (
                    <tr
                      key={orcamento.id}
                      className={`border-b hover:bg-muted/50/50 ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/50'
                      }`}
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.data}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.intervalo}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.numero}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.produto}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.cliente}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.profissional}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.placa}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.veiculo}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.servico}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.origemCidade}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {orcamento.destinoCidade}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {orcamento.observacao}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(orcamento.status)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        R$ {orcamento.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-center">
                      <div className="text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhum registro encontrado...</p>
                        <p className="text-sm">Mostrando 0 até 0 de 0 resultado(s)</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando 0 até 0 de 0 resultado(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            &lt;
          </Button>
          <Button variant="outline" size="sm" disabled>
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
