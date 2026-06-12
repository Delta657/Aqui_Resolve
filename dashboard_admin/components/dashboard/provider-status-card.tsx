"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  MapPin,
  Wifi,
  User,
  Phone,
  Star,
  Activity,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react"
import { useProviders, type Provider } from "@/hooks/use-providers"
import { getProviderStatusLabel } from "@/lib/providers/status"
import { toDateFromUnknown } from "@/lib/date-utils"

export function ProviderStatusCard() {
  const { providers: rawProviders, stats, loading, error } = useProviders({ autoRefresh: true })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return '#10b981'
      case 'ocupado': return '#f59e0b'
      case 'online': return '#3b82f6'
      case 'offline': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: Provider["status"]) => {
    return getProviderStatusLabel(status)
  }

  const getTimeAgo = (dateValue: unknown) => {
    const date = toDateFromUnknown(dateValue, new Date())
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d atrás`
    if (hours > 0) return `${hours}h atrás`
    if (minutes > 0) return `${minutes}m atrás`
    return 'Agora'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-muted-foreground">Carregando prestadores...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  const providerStats = stats || {
    total: rawProviders.length,
    disponivel: rawProviders.filter(p => p.status === 'disponivel').length,
    ocupado: rawProviders.filter(p => p.status === 'ocupado').length,
    online: rawProviders.filter(p => p.status === 'online').length,
    offline: rawProviders.filter(p => p.status === 'offline').length,
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
          borderColor: 'var(--border)'
        }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {providerStats.total}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
          borderColor: 'var(--border)'
        }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {providerStats.disponivel}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Disponíveis
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
          borderColor: 'var(--border)'
        }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {providerStats.ocupado}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Ocupados
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
          borderColor: 'var(--border)'
        }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wifi className="w-5 h-5" style={{ color: '#3b82f6' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {providerStats.online}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Online
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
          borderColor: 'var(--border)'
        }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5" style={{ color: '#6b7280' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {providerStats.offline}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Offline
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Prestadores */}
      <Card style={{
        backgroundColor: 'var(--card)',
        color: 'var(--card-foreground)',
        borderColor: 'var(--border)'
      }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            <span>Status dos Prestadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rawProviders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum prestador encontrado</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Os prestadores aparecerão aqui conforme forem cadastrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rawProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-6 h-6" style={{ color: 'var(--muted-foreground)' }} />
                    </div>

                    {/* Informações básicas */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {provider.nome}
                        </h3>
                        <Badge
                          style={{
                            backgroundColor: getStatusColor(provider.status),
                            color: 'white'
                          }}
                        >
                          {getStatusText(provider.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {provider.telefone}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {provider.avaliacao}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status detalhado */}
                  <div className="flex items-center space-x-4">
                    {/* Última atualização */}
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {getTimeAgo(provider.ultimaAtualizacao)}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" style={{
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)'
                      }}>
                        <MapPin className="w-4 h-4 mr-1" />
                        Localizar
                      </Button>
                      <Button size="sm" style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)'
                      }}>
                        <Phone className="w-4 h-4 mr-1" />
                        Ligar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
