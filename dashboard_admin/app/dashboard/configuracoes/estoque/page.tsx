import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  RefreshCw,
  Upload,
  ArrowLeft,
  Info,
  Eye
} from "lucide-react"

const tiposSaida = [
  {
    id: "1",
    nome: "ADAPTADOR",
    descricao: "Adaptadores para equipamentos",
    categoria: "Equipamentos",
    status: "ativo",
    criadoEm: "2025-01-15",
  },
  {
    id: "2",
    nome: "BORRACHA DE REPAROS",
    descricao: "Borrachas para reparos diversos",
    categoria: "Material de Reparo",
    status: "ativo",
    criadoEm: "2025-01-14",
  },
  {
    id: "3",
    nome: "BORRACHA DE VEDACAO",
    descricao: "Borrachas de vedação",
    categoria: "Material de Reparo",
    status: "ativo",
    criadoEm: "2025-01-13",
  },
  {
    id: "4",
    nome: "CHUVEIRO",
    descricao: "Chuveiros e acessórios",
    categoria: "Hidráulica",
    status: "ativo",
    criadoEm: "2025-01-12",
  },
  {
    id: "5",
    nome: "DISJUTORES",
    descricao: "Disjuntores elétricos",
    categoria: "Elétrica",
    status: "ativo",
    criadoEm: "2025-01-11",
  },
  {
    id: "6",
    nome: "ESQUICHO DUCHA HIGIENICA",
    descricao: "Esquichos para duchas higiênicas",
    categoria: "Hidráulica",
    status: "ativo",
    criadoEm: "2025-01-10",
  },
  {
    id: "7",
    nome: "INTERRUPTOR",
    descricao: "Interruptores elétricos",
    categoria: "Elétrica",
    status: "ativo",
    criadoEm: "2025-01-09",
  },
]

const getCategoriaColor = (categoria: string) => {
  switch (categoria) {
    case "Elétrica":
      return "bg-yellow-100 text-yellow-800"
    case "Hidráulica":
      return "bg-blue-100 text-blue-800"
    case "Material de Reparo":
      return "bg-green-100 text-green-800"
    case "Equipamentos":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

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

export default function EstoquePage() {
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
              Tipos de Saída
            </h1>
          </div>
          <p className="text-muted-foreground">
            autem.com.br › configurações › estoque › tipos de saída
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            + CADASTRAR
          </Button>
        </div>
      </div>

      {/* Notificação Informativa */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-blue-800 text-sm">
              Nesta página você deve configurar os tipos de saída para retirada dos itens do estoque.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Total de Tipos
            </CardTitle>
            <Package className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{tiposSaida.length}</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Tipos configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Categorias
            </CardTitle>
            <Package className="h-4 w-4" style={{ color: 'var(--success)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              {new Set(tiposSaida.map(t => t.categoria)).size}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Diferentes categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Ativos
            </CardTitle>
            <Package className="h-4 w-4" style={{ color: 'var(--warning)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
              {tiposSaida.filter(t => t.status === 'ativo').length}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Em uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Última Atualização
            </CardTitle>
            <Package className="h-4 w-4" style={{ color: 'var(--info)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--info)' }}>
              Hoje
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Sistema atualizado
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
              aria-label="Buscar tipos de saída"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            + CADASTRAR
          </Button>
        </div>
      </div>

      {/* Tabela de Tipos de Saída */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--foreground)' }}>Tipos de Saída Configurados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ color: 'var(--foreground)' }}>
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Nome</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Descrição</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Categoria</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Status</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Criado em</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--foreground)' }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiposSaida.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell>
                    <input type="checkbox" className="rounded" />
                  </TableCell>
                  <TableCell className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {tipo.nome}
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {tipo.descricao}
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoriaColor(tipo.categoria)}>
                      {tipo.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tipo.status)}>
                      {tipo.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {tipo.criadoEm}
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
          Mostrando de 1 até {tiposSaida.length} de {tiposSaida.length} resultado(s)
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
            <CardTitle style={{ color: 'var(--foreground)' }}>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(new Set(tiposSaida.map(t => t.categoria))).map((categoria) => (
                <div key={categoria} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span style={{ color: 'var(--foreground)' }}>{categoria}</span>
                  <Badge variant="secondary">
                    {tiposSaida.filter(t => t.categoria === categoria).length}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Tipo
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Importar Tipos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Gerenciar Categorias
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar por Categoria
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
