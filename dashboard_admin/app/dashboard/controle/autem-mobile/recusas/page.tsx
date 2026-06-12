"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  XCircle, 
  Maximize2, 
  Filter, 
  RefreshCw, 
  Upload, 
  Search,
  ChevronUp,
  ChevronDown,
  Plus,
  Phone,
  AlertTriangle,
  Clock,
  MapPin
} from "lucide-react"

interface Recusa {
  id: string
  profissional: string
  servico: string
  motivo: string
  dataHora: string
  localizacao: string
  distancia: string
  observacao: string
  status: 'pendente' | 'analisado' | 'resolvido'
}

export default function RecusasPage() {
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const recusas: Recusa[] = [
    {
      id: "1",
      profissional: "JOCIMAR",
      servico: "Guincho - Pane Elétrica",
      motivo: "Distância muito longa",
      dataHora: "13/08/2025 14:30",
      localizacao: "Vila Velha - ES",
      distancia: "25km",
      observacao: "Cliente solicitou cancelamento",
      status: "pendente"
    },
    {
      id: "2",
      profissional: "ANTONIO",
      servico: "Assistência - Bateria",
      motivo: "Horário indisponível",
      dataHora: "13/08/2025 15:45",
      localizacao: "Vitória - ES",
      distancia: "12km",
      observacao: "Profissional em outro serviço",
      status: "analisado"
    },
    {
      id: "3",
      profissional: "JOYCE BARBOSA",
      servico: "Guincho - Acidente",
      motivo: "Local de difícil acesso",
      dataHora: "13/08/2025 16:20",
      localizacao: "Serra - ES",
      distancia: "18km",
      observacao: "Estrada em mau estado",
      status: "resolvido"
    }
  ]

  const columns = [
    { key: "profissional", label: "Profissional", sortable: true },
    { key: "servico", label: "Serviço", sortable: true },
    { key: "motivo", label: "Motivo", sortable: true },
    { key: "dataHora", label: "Data/Hora", sortable: true },
    { key: "localizacao", label: "Localização", sortable: true },
    { key: "distancia", label: "Distância", sortable: true },
    { key: "observacao", label: "Observação", sortable: true },
    { key: "status", label: "Status", sortable: true }
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
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
      case 'analisado':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Analisado</Badge>
      case 'resolvido':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Resolvido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredRecusas = recusas.filter(recusa =>
    Object.values(recusa).some(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <main className="flex-1 space-y-6 p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recusas</h1>
            <p className="text-sm text-muted-foreground">
              autem.com.br &gt; controle &gt; autem mobile &gt; recusas
            </p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova Recusa
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

      {/* Tabela de Recusas */}
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
                {filteredRecusas.map((recusa, index) => (
                  <tr
                    key={recusa.id}
                    className={`border-b hover:bg-muted/50/50 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/50'
                    }`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span>{recusa.profissional}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {recusa.servico}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {recusa.motivo}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground/60" />
                        <span>{recusa.dataHora}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground/60" />
                        <span>{recusa.localizacao}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {recusa.distancia}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {recusa.observacao}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(recusa.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <Button variant="outline" size="sm">
                          <AlertTriangle className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MapPin className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
