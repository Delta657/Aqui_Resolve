import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Truck, 
  Search, 
  Plus, 
  Filter,
  RefreshCw,
  Upload,
  AlertTriangle,
  ExternalLink,
  Calendar,
  FileText,
  Building
} from "lucide-react"

export default function ChecklistViaturaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Checklist Viatura
          </h1>
          <p className="text-muted-foreground">
            autem.com.br › configurações › checklist viatura
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

      {/* Notificação Beta */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-blue-600 mt-1 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">
                Funcionalidade em modo BETA.
              </h3>
              <p className="text-blue-800 text-sm">
                Para utilizar essa funcionalidade, você deverá utilizar o AutEM Mobile versão de teste, utilize as instruções no link:
              </p>
              <Button variant="link" className="p-0 h-auto text-blue-600 underline">
                <ExternalLink className="h-4 w-4 mr-1" />
                Clique aqui para visualizar as instruções em detalhe.
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Total de Checklists
            </CardTitle>
            <Truck className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>0</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Nenhum checklist cadastrado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Veículos Ativos
            </CardTitle>
            <Truck className="h-4 w-4" style={{ color: 'var(--success)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>0</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Aguardando configuração
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Tipos de Viatura
            </CardTitle>
            <Truck className="h-4 w-4" style={{ color: 'var(--warning)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>0</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Categorias não definidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Filiais
            </CardTitle>
            <Building className="h-4 w-4" style={{ color: 'var(--info)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--info)' }}>0</div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Filiais não configuradas
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
              aria-label="Buscar checklists de viatura"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            MODELOS
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            CADASTRAR
          </Button>
        </div>
      </div>

      {/* Tabela de Checklists Viatura */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--foreground)' }}>Checklists de Viatura</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ color: 'var(--foreground)' }}>Data</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Título</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Tipo</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Filial</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Status</TableHead>
                <TableHead style={{ color: 'var(--foreground)' }}>Veículo</TableHead>
                <TableHead className="text-right" style={{ color: 'var(--foreground)' }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12" style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                      Nenhum registro encontrado...
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Comece criando seu primeiro checklist de viatura
                    </p>
                    <Button className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Checklist
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Mostrando 0 até 0 de 0 resultado(s)
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            ←
          </Button>
          <Button variant="outline" size="sm" disabled>
            →
          </Button>
        </div>
      </div>

      {/* Informações de Configuração */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Configuração Necessária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    AutEM Mobile Beta
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Instale a versão de teste do aplicativo
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    Configurar Veículos
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Cadastre os veículos da frota
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Building className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    Definir Filiais
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Configure as filiais operacionais
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    Baixar AutEM Mobile Beta
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Instale a versão de teste no dispositivo
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">2</span>
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    Configurar Veículos
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Cadastre a frota de veículos
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">3</span>
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    Criar Checklists
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Defina os checklists por tipo de viatura
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">4</span>
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    Testar Funcionalidade
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Execute testes com o aplicativo
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
