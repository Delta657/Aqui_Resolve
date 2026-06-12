"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  RefreshCw,
  Search,
  Navigation,
  Clock,
  Activity,
  Loader2,
} from "lucide-react"
import { useProviders } from "@/hooks/use-providers"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function RastreamentoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { providers, loading, error, refetch } = useProviders({ autoRefresh: true, ativo: true })

  const filteredProviders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return providers

    return providers.filter((provider) => {
      const lat = provider.localizacao?.lat ?? 0
      const lng = provider.localizacao?.lng ?? 0
      return (
        provider.nome.toLowerCase().includes(term) ||
        provider.email.toLowerCase().includes(term) ||
        provider.telefone.toLowerCase().includes(term) ||
        String(lat).includes(term) ||
        String(lng).includes(term)
      )
    })
  }, [providers, searchTerm])

  const formatLastUpdate = (isoDate: string) => {
    if (!isoDate) return "N/A"
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return "N/A"
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
  }

  const getStatusBadge = (status: string) => {
    const isOnline = status !== "offline"
    return isOnline ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">Inativo</Badge>
    )
  }

  return (
    <main className="flex-1 space-y-6 p-6" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <MapPin className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rastreamento</h1>
            <p className="text-sm text-muted-foreground">Localizacao em tempo real dos prestadores ativos</p>
          </div>
        </div>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredProviders.length} prestador(es) com localizacao disponivel
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar por nome, contato ou coordenadas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80"
          />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)", borderColor: "var(--border)" }}>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Profissional</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Latitude</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Longitude</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Ultima atualizacao</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((provider, index) => {
                    const lat = provider.localizacao?.lat ?? 0
                    const lng = provider.localizacao?.lng ?? 0
                    return (
                      <tr
                        key={provider.id}
                        className={`border-b hover:bg-muted/50 ${
                          index % 2 === 0 ? "bg-background" : "bg-muted/50"
                        }`}
                        style={{ borderColor: "var(--border)" }}
                      >
                        <td className="px-4 py-3 text-sm text-foreground">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="font-medium">{provider.nome}</p>
                              <p className="text-xs text-muted-foreground">{provider.telefone || provider.email || "Sem contato"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{lat.toFixed(6)}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{lng.toFixed(6)}</td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground/60" />
                            <span>{formatLastUpdate(provider.ultimaAtualizacao)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{getStatusBadge(provider.status)}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-1">
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Abrir localizacao de ${provider.nome} no mapa`}
                              >
                                <Navigation className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && filteredProviders.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={6}>
                        Nenhum prestador com localizacao encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {loading && (
            <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando localizacoes...
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
