import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Building, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  RefreshCw,
  Upload,
  X,
  Eye,
  MapPin,
  Phone,
  Mail,
  Users
} from "lucide-react"

const filiais = [
  {
    id: "1",
    nome: "Matriz São Paulo",
    cnpj: "12.345.678/0001-90",
    cidade: "São Paulo",
    bairro: "Centro",
    estado: "SP",
    telefone: "(11) 3000-0000",
    email: "matriz@autem.com.br",
    responsavel: "João Silva",
    funcionarios: 45,
    status: "ativo",
  },
  {
    id: "2",
    nome: "Filial Rio de Janeiro",
    cnpj: "98.765.432/0001-10",
    cidade: "Rio de Janeiro",
    bairro: "Copacabana",
    estado: "RJ",
    telefone: "(21) 4000-0000",
    email: "rj@autem.com.br",
    responsavel: "Maria Santos",
    funcionarios: 32,
    status: "ativo",
  },
  {
    id: "3",
    nome: "Filial Belo Horizonte",
    cnpj: "11.222.333/0001-44",
    cidade: "Belo Horizonte",
    bairro: "Savassi",
    estado: "MG",
    telefone: "(31) 5000-0000",
    email: "bh@autem.com.br",
    responsavel: "Pedro Costa",
    funcionarios: 28,
    status: "ativo",
  },
  {
    id: "4",
    nome: "Filial Brasília",
    cnpj: "44.555.666/0001-77",
    cidade: "Brasília",
    bairro: "Asa Sul",
    estado: "DF",
    telefone: "(61) 6000-0000",
    email: "bsb@autem.com.br",
    responsavel: "Ana Oliveira",
    funcionarios: 25,
    status: "ativo",
  },
  {
    id: "5",
    nome: "Filial Salvador",
    cnpj: "77.888.999/0001-22",
    cidade: "Salvador",
    bairro: "Barra",
    estado: "BA",
    telefone: "(71) 7000-0000",
    email: "salvador@autem.com.br",
    responsavel: "Carlos Lima",
    funcionarios: 22,
    status: "ativo",
  },
  {
    id: "6",
    nome: "Filial Recife",
    cnpj: "22.333.444/0001-55",
    cidade: "Recife",
    bairro: "Boa Viagem",
    estado: "PE",
    telefone: "(81) 8000-0000",
    email: "recife@autem.com.br",
    responsavel: "Fernanda Rocha",
    funcionarios: 20,
    status: "ativo",
  },
  {
    id: "7",
    nome: "Filial Fortaleza",
    cnpj: "55.666.777/0001-88",
    cidade: "Fortaleza",
    bairro: "Meireles",
    estado: "CE",
    telefone: "(85) 9000-0000",
    email: "fortaleza@autem.com.br",
    responsavel: "Roberto Alves",
    funcionarios: 18,
    status: "ativo",
  },
  {
    id: "8",
    nome: "Filial Curitiba",
    cnpj: "88.999.000/0001-33",
    cidade: "Curitiba",
    bairro: "Batel",
    estado: "PR",
    telefone: "(41) 1000-0000",
    email: "curitiba@autem.com.br",
    responsavel: "Lucia Ferreira",
    funcionarios: 30,
    status: "ativo",
  },
  {
    id: "9",
    nome: "Filial Porto Alegre",
    cnpj: "33.444.555/0001-66",
    cidade: "Porto Alegre",
    bairro: "Moinhos de Vento",
    estado: "RS",
    telefone: "(51) 2000-0000",
    email: "poa@autem.com.br",
    responsavel: "Marcos Pereira",
    funcionarios: 26,
    status: "ativo",
  },
  {
    id: "10",
    nome: "Filial Goiânia",
    cnpj: "66.777.888/0001-99",
    cidade: "Goiânia",
    bairro: "Setor Bueno",
    estado: "GO",
    telefone: "(62) 3000-0000",
    email: "goiania@autem.com.br",
    responsavel: "Patricia Souza",
    funcionarios: 24,
    status: "ativo",
  },
  {
    id: "11",
    nome: "Filial Manaus",
    cnpj: "99.000.111/0001-12",
    cidade: "Manaus",
    bairro: "Centro",
    estado: "AM",
    telefone: "(92) 4000-0000",
    email: "manaus@autem.com.br",
    responsavel: "Ricardo Mendes",
    funcionarios: 15,
    status: "ativo",
  },
  {
    id: "12",
    nome: "Filial Belém",
    cnpj: "00.111.222/0001-34",
    cidade: "Belém",
    bairro: "Nazaré",
    estado: "PA",
    telefone: "(91) 5000-0000",
    email: "belem@autem.com.br",
    responsavel: "Sandra Costa",
    funcionarios: 16,
    status: "ativo",
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

export default function FiliaisPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Filiais
          </h1>
          <p className="text-muted-foreground">
            autem.com.br › configurações › filiais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            CADASTRAR
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Total de Filiais
            </CardTitle>
            <Building className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{filiais.length}</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Filiais operacionais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Total de Funcionários
            </CardTitle>
            <Users className="h-4 w-4" style={{ color: 'var(--success)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              {filiais.reduce((total, filial) => total + filial.funcionarios, 0)}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Colaboradores ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Estados
            </CardTitle>
            <MapPin className="h-4 w-4" style={{ color: 'var(--warning)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
              {new Set(filiais.map(f => f.estado)).size}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Estados atendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Média por Filial
            </CardTitle>
            <Users className="h-4 w-4" style={{ color: 'var(--info)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--info)' }}>
              {Math.round(filiais.reduce((total, filial) => total + filial.funcionarios, 0) / filiais.length)}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Funcionários por filial
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <X className="h-4 w-4" />
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="PROCURAR" 
              className="pl-20 w-64" 
              aria-label="Buscar filiais"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            CADASTRAR
          </Button>
        </div>
      </div>

      {/* Tabela de Filiais */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--foreground)' }}>Filiais Cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ color: 'var(--foreground)' }}>
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Nome</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>CNPJ</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Cidade</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Bairro</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Estado</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Contato</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Responsável</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Funcionários</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Status</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--foreground)' }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filiais.map((filial) => (
                <TableRow key={filial.id}>
                  <TableCell>
                    <input type="checkbox" className="rounded" />
                  </TableCell>
                  <TableCell className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {filial.nome}
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {filial.cnpj}
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {filial.cidade}
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {filial.bairro}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {filial.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {filial.telefone}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {filial.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell style={{ color: 'var(--foreground)' }}>
                    {filial.responsavel}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {filial.funcionarios}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(filial.status)}>
                      {filial.status}
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
          Mostrando de 1 até {filiais.length} de {filiais.length} resultado(s)
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
            <CardTitle style={{ color: 'var(--foreground)' }}>Distribuição por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(new Set(filiais.map(f => f.estado))).map((estado) => (
                <div key={estado} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span style={{ color: 'var(--foreground)' }}>{estado}</span>
                  <Badge variant="secondary">
                    {filiais.filter(f => f.estado === estado).length}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Maiores Filiais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filiais
                .sort((a, b) => b.funcionarios - a.funcionarios)
                .slice(0, 5)
                .map((filial, index) => (
                  <div key={filial.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {filial.nome}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          {filial.cidade} - {filial.estado}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {filial.funcionarios} funcionários
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
