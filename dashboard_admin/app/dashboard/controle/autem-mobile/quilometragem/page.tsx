"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Route, 
  Maximize2, 
  Filter, 
  RefreshCw, 
  Upload, 
  Search,
  ChevronUp,
  ChevronDown,
  Info,
  Wifi,
  Battery,
  MapPin,
  Plus,
  Phone
} from "lucide-react"

interface Quilometragem {
  id: string
  data: string
  profissional: string
  sinal: string
  bateria: string
  distancia: string
  precisao: string
  velocidade: string
  pontos: number
  servicos: number
}

export default function QuilometragemPage() {
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const quilometragens: Quilometragem[] = [
    {
      id: "1",
      data: "13/08/2025",
      profissional: "ANTONIO",
      sinal: "WIFI",
      bateria: "63%",
      distancia: "9km",
      precisao: "13m",
      velocidade: "0km/h",
      pontos: 198,
      servicos: 2
    },
    {
      id: "2",
      data: "13/08/2025",
      profissional: "JOCIMAR",
      sinal: "LTE",
      bateria: "71%",
      distancia: "13km",
      precisao: "0m",
      velocidade: "0km/h",
      pontos: 360,
      servicos: 2
    }
  ]

  const columns = [
    { key: "data", label: "Data", sortable: true },
    { key: "profissional", label: "Profissional", sortable: true },
    { key: "sinal", label: "Sinal", sortable: true },
    { key: "bateria", label: "Bateria", sortable: true },
    { key: "distancia", label: "Distancia", sortable: true },
    { key: "precisao", label: "Precisão", sortable: true },
    { key: "velocidade", label: "Velocidade", sortable: true },
    { key: "pontos", label: "Pontos", sortable: true },
    { key: "servicos", label: "Serviços", sortable: true }
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

  const getSinalIcon = (sinal: string) => {
    switch (sinal.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-4 w-4 text-blue-600" />
      case 'lte':
        return <div className="w-4 h-4 bg-green-500 rounded-full"></div>
      default:
        return <div className="w-4 h-4 bg-muted-foreground rounded-full"></div>
    }
  }

  const getBateriaColor = (bateria: string) => {
    const level = parseInt(bateria.replace('%', ''))
    if (level > 50) return 'text-green-600'
    if (level > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredQuilometragens = quilometragens.filter(quilometragem =>
    Object.values(quilometragem).some(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Cálculos para a linha de totais
  const totalDistancia = quilometragens.reduce((sum, item) => sum + parseInt(item.distancia.replace('km', '')), 0)
  const mediaPrecisao = quilometragens.reduce((sum, item) => sum + parseInt(item.precisao.replace('m', '')), 0) / quilometragens.length
  const mediaVelocidade = quilometragens.reduce((sum, item) => sum + parseInt(item.velocidade.replace('km/h', '')), 0) / quilometragens.length
  const mediaPontos = quilometragens.reduce((sum, item) => sum + item.pontos, 0) / quilometragens.length
  const totalServicos = quilometragens.reduce((sum, item) => sum + item.servicos, 0)

  return (
    <main className="flex-1 space-y-6 p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Route className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quilometragem</h1>
            <p className="text-sm text-muted-foreground">
              autem.com.br &gt; controle &gt; autem mobile &gt; quilometragem
            </p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrada
        </Button>
      </div>

      {/* Informação */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Exibe a quilometragem percorrida pelos profissionais de acordo com os dados enviados automaticamente do aplicativo. Oscilação de sinal, falta de internet, economia de bateria e configurações incompletas podem comprometer esses dados.
          </p>
        </CardContent>
      </Card>

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

      {/* Tabela de Quilometragem */}
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
                        {column.key === 'profissional' && <Info className="h-4 w-4 text-muted-foreground/60" />}
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredQuilometragens.map((quilometragem, index) => (
                  <tr
                    key={quilometragem.id}
                    className={`border-b hover:bg-muted/50/50 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/50'
                    }`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      {quilometragem.data}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {quilometragem.profissional}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center space-x-2">
                        {getSinalIcon(quilometragem.sinal)}
                        <span>{quilometragem.sinal}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Battery className={`h-4 w-4 ${getBateriaColor(quilometragem.bateria)}`} />
                        <span className={getBateriaColor(quilometragem.bateria)}>{quilometragem.bateria}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {quilometragem.distancia}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {quilometragem.precisao}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {quilometragem.velocidade}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {quilometragem.pontos}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {quilometragem.servicos}
                    </td>
                  </tr>
                ))}
                {/* Linha de Totais */}
                <tr className="bg-muted font-medium" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 text-sm text-foreground">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    -
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    -
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    -
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {totalDistancia}km
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {Math.round(mediaPrecisao)}m
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {Math.round(mediaVelocidade)}km/h
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {Math.round(mediaPontos)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {totalServicos}
                  </td>
                </tr>
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
