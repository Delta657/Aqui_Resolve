import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Download, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  RefreshCw,
  Upload,
  ArrowLeft,
  Eye,
  Globe,
  Clock
} from "lucide-react"

const exportadores = [
  {
    id: "1",
    nome: "BRASIL ASSISTÊNCIA",
    cliente: "ALLIANZ SEGUROS SA",
    fusoHorario: "America/Sao_Paulo",
    status: "ativo",
    ultimaSincronizacao: "2025-01-15 14:30:00",
  },
  {
    id: "2",
    nome: "CDF",
    cliente: "CDF - CENTRAL DE FUNC. TECNOLOGIA E PARTICIPACOES S.A",
    fusoHorario: "America/Sao_Paulo",
    status: "ativo",
    ultimaSincronizacao: "2025-01-15 13:45:00",
  },
  {
    id: "3",
    nome: "EUROP",
    cliente: "EUROP ASSISTANCE BRASIL LTDA",
    fusoHorario: "America/Sao_Paulo",
    status: "ativo",
    ultimaSincronizacao: "2025-01-15 12:15:00",
  },
  {
    id: "4",
    nome: "FACIL ASSIST",
    cliente: "",
    fusoHorario: "America/Sao_Paulo",
    status: "inativo",
    ultimaSincronizacao: "2025-01-10 09:20:00",
  },
  {
    id: "5",
    nome: "MAPFRE ASSISTÊNCIA",
    cliente: "MAPFRE ASSISTENCIA S/A.",
    fusoHorario: "America/Sao_Paulo",
    status: "ativo",
    ultimaSincronizacao: "2025-01-15 11:30:00",
  },
  {
    id: "6",
    nome: "MCK",
    cliente: "",
    fusoHorario: "America/Sao_Paulo",
    status: "inativo",
    ultimaSincronizacao: "2025-01-08 16:45:00",
  },
  {
    id: "7",
    nome: "MONDIAL ASSISTANCE",
    cliente: "MONDIAL SERVICOS LTDA",
    fusoHorario: "America/Sao_Paulo",
    status: "ativo",
    ultimaSincronizacao: "2025-01-15 10:15:00",
  },
  {
    id: "8",
    nome: "PORTO SEGURO",
    cliente: "PORTO SEGURO ASSISTENCIA E SERVICOS S/A",
    fusoHorario: "America/Sao_Paulo",
    status: "ativo",
    ultimaSincronizacao: "2025-01-15 15:20:00",
  },
  {
    id: "9",
    nome: "TOKIO MARINE",
    cliente: "TOKIO MARINE SEGURADORA",
    fusoHorario: "America/Sao_Paulo",
    status: "ativo",
    ultimaSincronizacao: "2025-01-15 14:00:00",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "ativo":
      return "bg-green-100 text-green-800"
    case "inativo":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getFusoHorarioColor = (fuso: string) => {
  return "bg-blue-100 text-blue-800"
}

export default function ExportadorPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Exportador
            </h1>
          </div>
          <p className="text-muted-foreground">
            autem.com.br › configurações › exportador
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Exportador
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Total de Exportadores
            </CardTitle>
            <Download className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{exportadores.length}</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Ativos
            </CardTitle>
            <Download className="h-4 w-4" style={{ color: 'var(--success)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              {exportadores.filter(e => e.status === 'ativo').length}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Em operação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Inativos
            </CardTitle>
            <Download className="h-4 w-4" style={{ color: 'var(--warning)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
              {exportadores.filter(e => e.status === 'inativo').length}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Suspensos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Última Sincronização
            </CardTitle>
            <Clock className="h-4 w-4" style={{ color: 'var(--info)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--info)' }}>
              Hoje
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              15:20:00
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input 
              placeholder="PROCURAR" 
              className="pl-20 w-64" 
              aria-label="Buscar exportadores"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Exportador
          </Button>
        </div>
      </div>

      {/* Tabela de Exportadores */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--foreground)' }}>Exportadores Configurados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ color: 'var(--foreground)' }}>
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Exportador</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Cliente/Fornecedor</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Fuso Horário</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Status</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Última Sincronização</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--foreground)' }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportadores.map((exportador) => (
                <TableRow key={exportador.id}>
                  <TableCell>
                    <input type="checkbox" className="rounded" />
                  </TableCell>
                  <TableCell className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {exportador.nome}
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {exportador.cliente || "Não configurado"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getFusoHorarioColor(exportador.fusoHorario)}>
                      {exportador.fusoHorario}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(exportador.status)}>
                      {exportador.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {exportador.ultimaSincronizacao}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
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

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Mostrando de 1 até {exportadores.length} de {exportadores.length} resultado(s)
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            ←
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            →
          </Button>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Status dos Exportadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span style={{ color: 'var(--foreground)' }}>Ativos</span>
                </div>
                <Badge variant="secondary">
                  {exportadores.filter(e => e.status === 'ativo').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <span style={{ color: 'var(--foreground)' }}>Inativos</span>
                </div>
                <Badge variant="secondary">
                  {exportadores.filter(e => e.status === 'inativo').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Configurações de Fuso Horário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(new Set(exportadores.map(e => e.fusoHorario))).map((fuso) => (
                <div key={fuso} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ color: 'var(--foreground)' }}>{fuso}</span>
                  </div>
                  <Badge variant="secondary">
                    {exportadores.filter(e => e.fusoHorario === fuso).length}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--foreground)' }}>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Novo Exportador</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span>Importar Configurações</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6" />
              <span>Sincronizar Todos</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <span>Exportar Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
