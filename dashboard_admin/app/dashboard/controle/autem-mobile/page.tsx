"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  LogIn, 
  LogOut, 
  Route, 
  XCircle, 
  Users,
  Activity,
  Wifi,
  Battery,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useAutEMMobile } from "@/hooks/use-autem-mobile"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AutEMMobilePage() {
  const { stats, realtimeStatus, loading, error, refetch, lastUpdate } = useAutEMMobile({
    autoRefresh: true,
    refreshInterval: 30000 // 30 segundos
  })

  // Função para formatar tempo relativo
  const formatTimeAgo = (date?: Date) => {
    if (!date) return "N/A"
    try {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ptBR 
      })
    } catch {
      return "N/A"
    }
  }

  // Valores padrão enquanto carrega
  const displayStats = stats || {
    totalUsuarios: 0,
    conectados: 0,
    desconectados: 0,
    totalAcessos: 0,
    quilometragemTotal: 0,
    recusas: 0,
    rastreamentos: 0,
    taxaRecusa: 0,
    precisaoMedia: 0,
    profissionaisAtivos: 0
  }

  return (
    <main className="flex-1 space-y-6 p-4 sm:p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AutEM Mobile</h1>
          <p className="text-muted-foreground mt-1">
            Controle e monitoramento do aplicativo móvel
          </p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
              Última atualização: {formatTimeAgo(lastUpdate)}
            </p>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => refetch()} 
            disabled={loading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
            <Activity className="h-4 w-4 mr-2" />
            Status do Sistema
          </Button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">Erro ao carregar dados</p>
                <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {displayStats.conectados}/{displayStats.totalUsuarios}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <LogIn className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total de Acessos</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{displayStats.totalAcessos}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Route className="h-8 w-8 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Quilometragem</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{displayStats.quilometragemTotal}km</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Recusas</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{displayStats.recusas}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Módulos do AutEM Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Acessos */}
        <Link href="/dashboard/controle/autem-mobile/acessos">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <LogIn className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Acessos</CardTitle>
                  <p className="text-sm text-muted-foreground">Log de conexões</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conexões Hoje</span>
                  <Badge variant="secondary">{displayStats.totalAcessos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última Atividade</span>
                  <span className="text-xs text-muted-foreground">
                    {displayStats.ultimaAtividade ? formatTimeAgo(displayStats.ultimaAtividade) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Usuários Ativos</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">{displayStats.conectados}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quilometragem */}
        <Link href="/dashboard/controle/autem-mobile/quilometragem">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Route className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Quilometragem</CardTitle>
                  <p className="text-sm text-muted-foreground">Distância percorrida</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Hoje</span>
                  <Badge variant="secondary">{displayStats.quilometragemTotal}km</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profissionais</span>
                  <Badge variant="outline">{displayStats.profissionaisAtivos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Precisão Média</span>
                  <span className="text-xs text-muted-foreground">{displayStats.precisaoMedia}m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Rastreamento */}
        <Link href="/dashboard/controle/autem-mobile/rastreamento">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Rastreamento</CardTitle>
                  <p className="text-sm text-muted-foreground">Localização em tempo real</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ativos</span>
                  <Badge variant="secondary">{displayStats.rastreamentos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última Atualização</span>
                  <span className="text-xs text-muted-foreground">
                    {lastUpdate ? formatTimeAgo(lastUpdate) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sinal</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">LTE/WIFI</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Recusas */}
        <Link href="/dashboard/controle/autem-mobile/recusas">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Recusas</CardTitle>
                  <p className="text-sm text-muted-foreground">Serviços recusados</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Hoje</span>
                  <Badge variant="secondary">{displayStats.recusas}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Recusa</span>
                  <span className="text-xs text-muted-foreground">{displayStats.taxaRecusa.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Motivo Principal</span>
                  <span className="text-xs text-muted-foreground">Distância</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Usuários */}
        <Link href="/dashboard/controle/autem-mobile/usuarios">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Usuários</CardTitle>
                  <p className="text-sm text-muted-foreground">Profissionais conectados</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <Badge variant="secondary">{displayStats.totalUsuarios}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Online</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">{displayStats.conectados}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Offline</span>
                  <Badge variant="outline" className="text-red-600 border-red-200">{displayStats.desconectados}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Status do Sistema */}
        <Card className="hover:shadow-lg transition-all duration-200" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Activity className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Status do Sistema</CardTitle>
                <p className="text-sm text-muted-foreground">Monitoramento geral</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Status</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Firebase</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status em Tempo Real */}
      <Card style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Status em Tempo Real</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && realtimeStatus.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
            </div>
          ) : realtimeStatus.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground dark:text-muted-foreground/60">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum profissional conectado no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {realtimeStatus.map((provider) => (
                <div
                  key={provider.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    provider.status === 'online'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      provider.status === 'online'
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-red-500'
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {provider.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {provider.status === 'online' ? 'Online' : 'Offline'}
                      {provider.versao && provider.versao !== 'N/A' && ` - ${provider.versao}`}
                    </p>
                    {provider.ultimaAtualizacao && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(provider.ultimaAtualizacao)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
