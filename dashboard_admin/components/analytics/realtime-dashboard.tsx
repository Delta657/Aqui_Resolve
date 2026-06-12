"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRealtimeAnalytics } from "@/hooks/use-realtime-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Users, Clock, TrendingUp, AlertCircle, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function RealtimeDashboard() {
  const { stats, loading, error } = useRealtimeAnalytics()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar dados em tempo real: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas em tempo real */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Totais</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos (1h)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.eventsLastHour}</div>
            <p className="text-xs text-muted-foreground">Última hora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividade</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.eventsLastHour > 0 ? '🔥' : '😴'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.eventsLastHour > 10 ? 'Alta' : stats.eventsLastHour > 0 ? 'Média' : 'Baixa'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top eventos e atividade recente */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Eventos</CardTitle>
            <CardDescription>Eventos mais frequentes nas últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topEvents.length > 0 ? (
                stats.topEvents.map((event, index) => (
                  <div key={event.eventName} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="text-sm font-medium">
                        {event.eventName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {event.count} vezes
                      </span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (event.count / stats.topEvents[0].count) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento registrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimos eventos em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recentEvents.length > 0 ? (
                stats.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-2 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.eventName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(event.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                      {event.userId && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Usuário: {event.userId.substring(0, 8)}...
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Resumo de Performance</span>
          </CardTitle>
          <CardDescription>
            Indicadores de atividade e engajamento do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.eventsLastHour > 0 ? '🟢' : '🔴'}
              </div>
              <p className="text-sm font-medium">Status do Sistema</p>
              <p className="text-xs text-muted-foreground">
                {stats.eventsLastHour > 0 ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round((stats.eventsLastHour / 24) * 100)}%
              </div>
              <p className="text-sm font-medium">Taxa de Atividade</p>
              <p className="text-xs text-muted-foreground">
                Eventos por hora vs média diária
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.activeUsers > 0 ? stats.activeUsers : '0'}
              </div>
              <p className="text-sm font-medium">Usuários Únicos</p>
              <p className="text-xs text-muted-foreground">
                Últimas 24 horas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
