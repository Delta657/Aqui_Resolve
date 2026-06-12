import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  RefreshCw,
  Upload,
  Download,
  Settings,
  Maximize2,
  Eye,
  Phone,
  Mail,
  MapPin
} from "lucide-react"

const clientes = [
  {
    id: "1",
    nome: "ALLIANZ SEGURO DE VIDA",
    tipo: "Cliente",
    cnpj: "12.345.678/0001-90",
    email: "contato@allianz.com.br",
    telefone: "(11) 3000-0000",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
  },
  {
    id: "2",
    nome: "AUTOMAC VEICULOS",
    tipo: "Fornecedor",
    cnpj: "98.765.432/0001-10",
    email: "vendas@automac.com.br",
    telefone: "(11) 4000-0000",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
  },
  {
    id: "3",
    nome: "AZUL SEGUROS",
    tipo: "Cliente",
    cnpj: "11.222.333/0001-44",
    email: "atendimento@azulseguros.com.br",
    telefone: "(11) 5000-0000",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
  },
  {
    id: "4",
    nome: "CARE ASSISTENCIA",
    tipo: "Cliente",
    cnpj: "44.555.666/0001-77",
    email: "suporte@care.com.br",
    telefone: "(11) 6000-0000",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    status: "ativo",
  },
  {
    id: "5",
    nome: "CDF",
    tipo: "Cliente",
    cnpj: "77.888.999/0001-22",
    email: "contato@cdf.com.br",
    telefone: "(11) 7000-0000",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
  },
  {
    id: "6",
    nome: "DELTA GLOBAL",
    tipo: "Fornecedor",
    cnpj: "22.333.444/0001-55",
    email: "vendas@deltaglobal.com.br",
    telefone: "(11) 8000-0000",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
  },
  {
    id: "7",
    nome: "EUROP ASSISTANCE",
    tipo: "Cliente",
    cnpj: "55.666.777/0001-88",
    email: "atendimento@europ.com.br",
    telefone: "(11) 9000-0000",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
  },
  {
    id: "8",
    nome: "FIDELITY - ASSISTENCIA, SERVICOS E RASTREAMENTO LTDA",
    tipo: "Cliente",
    cnpj: "88.999.000/0001-33",
    email: "contato@fidelity.com.br",
    telefone: "(11) 1000-0000",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
  },
  {
    id: "9",
    nome: "IKE ASSISTENCIA BRASIL SA",
    tipo: "Cliente",
    cnpj: "33.444.555/0001-66",
    email: "atendimento@ike.com.br",
    telefone: "(11) 2000-0000",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
  },
]

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case "Cliente":
      return "bg-blue-100 text-blue-800"
    case "Fornecedor":
      return "bg-green-100 text-green-800"
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

export default function ClientesFornecedoresPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Clientes e Fornecedores
          </h1>
          <p className="text-muted-foreground">
            autem.com.br › configurações › clientes e fornecedores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            PRÉ CAD
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Total de Registros
            </CardTitle>
            <Users className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{clientes.length}</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              +5 este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Clientes
            </CardTitle>
            <Users className="h-4 w-4" style={{ color: 'var(--success)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              {clientes.filter(c => c.tipo === 'Cliente').length}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Fornecedores
            </CardTitle>
            <Users className="h-4 w-4" style={{ color: 'var(--warning)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
              {clientes.filter(c => c.tipo === 'Fornecedor').length}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Estados
            </CardTitle>
            <MapPin className="h-4 w-4" style={{ color: 'var(--info)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--info)' }}>
              {new Set(clientes.map(c => c.estado)).size}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Diferentes estados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
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
              aria-label="Buscar clientes e fornecedores"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            PRÉ-CADASTROS
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            CADASTRAR
          </Button>
        </div>
      </div>

      {/* Tabela de Clientes e Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--foreground)' }}>Lista de Clientes e Fornecedores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ color: 'var(--foreground)' }}>
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Nome</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Tipo</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>CNPJ</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Contato</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Localização</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--foreground)' }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <input type="checkbox" className="rounded" />
                  </TableCell>
                  <TableCell className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {cliente.nome}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoColor(cliente.tipo)}>
                      {cliente.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {cliente.cnpj}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {cliente.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {cliente.telefone}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {cliente.cidade} - {cliente.estado}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(cliente.status)}>
                      {cliente.status}
                    </Badge>
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
          Mostrando de 1 até {clientes.length} de {clientes.length} resultado(s)
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
            <CardTitle style={{ color: 'var(--foreground)' }}>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span style={{ color: 'var(--foreground)' }}>Clientes</span>
                </div>
                <Badge variant="secondary">
                  {clientes.filter(c => c.tipo === 'Cliente').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span style={{ color: 'var(--foreground)' }}>Fornecedores</span>
                </div>
                <Badge variant="secondary">
                  {clientes.filter(c => c.tipo === 'Fornecedor').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Distribuição por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(new Set(clientes.map(c => c.estado))).map((estado) => (
                <div key={estado} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span style={{ color: 'var(--foreground)' }}>{estado}</span>
                  <Badge variant="secondary">
                    {clientes.filter(c => c.estado === estado).length}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
