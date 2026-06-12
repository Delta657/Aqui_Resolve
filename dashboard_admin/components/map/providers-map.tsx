"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, User, Clock, Phone, RefreshCw, Navigation, Star, AlertCircle } from "lucide-react"
import { useProviders } from "@/hooks/use-providers"
import type { Provider } from "@/hooks/use-providers"

const STATUS_CONFIG: Record<string, { dot: string; label: string; hex: string }> = {
  disponivel: { dot: "bg-emerald-500", label: "Disponível", hex: "#10b981" },
  ocupado:    { dot: "bg-amber-500",   label: "Ocupado",    hex: "#f59e0b" },
  online:     { dot: "bg-blue-500",    label: "Online",     hex: "#3b82f6" },
  offline:    { dot: "bg-muted-foreground",   label: "Offline",    hex: "#94a3b8" },
}

function ProviderListItem({
  provider,
  selected,
  onClick,
}: {
  provider: Provider
  selected: boolean
  onClick: () => void
}) {
  const cfg = STATUS_CONFIG[provider.status] ?? STATUS_CONFIG.offline
  const hasGps = provider.localizacao.lat !== 0 || provider.localizacao.lng !== 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-150",
        selected
          ? "border-primary bg-primary/5 shadow-card"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
          {provider.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
            <p className="text-xs font-medium text-foreground truncate">{provider.nome}</p>
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {cfg.label}{hasGps ? " · GPS ativo" : ""}
          </p>
        </div>
      </div>
    </button>
  )
}

function ProviderDetail({ provider, onClose }: { provider: Provider; onClose: () => void }) {
  const cfg = STATUS_CONFIG[provider.status] ?? STATUS_CONFIG.offline
  const hasGps = provider.localizacao.lat !== 0 || provider.localizacao.lng !== 0

  return (
    <div className="border-t border-border p-4 bg-muted/20">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {provider.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{provider.nome}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-muted-foreground">
          ×
        </Button>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground">
        {provider.telefone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{provider.telefone}</span>
          </div>
        )}
        {hasGps && (
          <div className="flex items-center gap-2">
            <Navigation className="h-3 w-3 shrink-0 text-primary" />
            <span className="font-mono">
              {provider.localizacao.lat.toFixed(5)}, {provider.localizacao.lng.toFixed(5)}
            </span>
          </div>
        )}
        {!hasGps && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>Localização não disponível</span>
          </div>
        )}
        {provider.servicoAtual && (
          <div className="flex items-start gap-2">
            <User className="h-3 w-3 shrink-0 mt-0.5" />
            <span>{provider.servicoAtual}</span>
          </div>
        )}
        {provider.avaliacao > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  i < Math.round(provider.avaliacao) ? "bg-amber-400" : "bg-muted"
                )}
              />
            ))}
            <span className="ml-1 font-medium text-foreground">{provider.avaliacao.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center gap-2 pt-1 border-t border-border mt-2">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{new Date(provider.ultimaAtualizacao).toLocaleString("pt-BR")}</span>
        </div>
      </div>
    </div>
  )
}

// Google Maps map view (when API is available)
function GoogleMapView({
  providers,
  onSelect,
}: {
  providers: Provider[]
  onSelect: (p: Provider) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || ready) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    // Aguarda o script do Google Maps. Com loading=async é preciso importLibrary.
    const tryInit = () => {
      if (cancelled) return
      const g = typeof window !== "undefined" ? (window.google as any) : undefined
      // Espera o construtor real (Map), não só o objeto google.maps.
      if (typeof g?.maps?.Map !== "function" || !mapRef.current) {
        timer = setTimeout(tryInit, 400) // poll até a API estar disponível
        return
      }
      try {
        const map = new g.maps.Map(mapRef.current, {
          center: { lat: -20.3155, lng: -40.3128 },
          zoom: 12,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        })
        mapInstance.current = map
        setReady(true)
      } catch {
        timer = setTimeout(tryInit, 400)
      }
    }

    tryInit()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [ready])

  useEffect(() => {
    if (!ready || !mapInstance.current || !window.google?.maps) return

    providers.forEach((provider) => {
      if (provider.localizacao.lat === 0 && provider.localizacao.lng === 0) return
      const cfg = STATUS_CONFIG[provider.status] ?? STATUS_CONFIG.offline
      const marker = new window.google.maps.Marker({
        position: provider.localizacao,
        map: mapInstance.current,
        title: provider.nome,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: cfg.hex,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })
      marker.addListener("click", () => onSelect(provider))
    })
  }, [ready, providers, onSelect])

  // O div precisa estar SEMPRE no DOM para o ref existir e o mapa inicializar.
  // (Antes havia `if (!ready) return null`, criando um deadlock: sem div, sem ref,
  //  o mapa nunca era criado e `ready` nunca virava true.)
  return (
    <div className="relative h-full w-full">
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/30 text-sm text-muted-foreground">
          Carregando mapa…
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}

// Visual fallback map (no Google Maps needed)
function VisualMapFallback({
  providers,
  selected,
  onSelect,
}: {
  providers: Provider[]
  selected: Provider | null
  onSelect: (p: Provider) => void
}) {
  // Only providers with GPS
  const withGps = providers.filter(
    (p) => p.localizacao.lat !== 0 || p.localizacao.lng !== 0
  )

  // Compute bounds to normalize positions
  const lats = withGps.map((p) => p.localizacao.lat)
  const lngs = withGps.map((p) => p.localizacao.lng)
  const minLat = Math.min(...lats, -20.5)
  const maxLat = Math.max(...lats, -20.1)
  const minLng = Math.min(...lngs, -40.5)
  const maxLng = Math.max(...lngs, -40.1)

  const normalize = (val: number, min: number, max: number) =>
    max === min ? 50 : ((val - min) / (max - min)) * 80 + 10

  return (
    <div className="relative w-full h-full bg-linear-to-br from-sky-50 via-blue-50 to-teal-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Region label */}
      <div className="absolute top-3 left-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-card">
        Vitória, ES
      </div>

      {/* Status badge */}
      <div className="absolute top-3 right-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-md px-2 py-1 text-[11px] text-muted-foreground flex items-center gap-1.5 shadow-card">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Tempo real
      </div>

      {/* Provider dots */}
      {withGps.map((provider) => {
        const cfg = STATUS_CONFIG[provider.status] ?? STATUS_CONFIG.offline
        const x = normalize(provider.localizacao.lng, minLng, maxLng)
        const y = 100 - normalize(provider.localizacao.lat, minLat, maxLat)
        const isSelected = selected?.id === provider.id

        return (
          <button
            key={provider.id}
            onClick={() => onSelect(provider)}
            title={provider.nome}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 border-white shadow-md transition-all duration-150 hover:scale-125 z-10",
              cfg.dot,
              isSelected && "scale-125 ring-2 ring-primary ring-offset-1"
            )}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: isSelected ? 20 : 14,
              height: isSelected ? 20 : 14,
            }}
          >
            {isSelected && <MapPin className="h-3 w-3 text-white" />}
          </button>
        )
      })}

      {/* No GPS providers message */}
      {withGps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum prestador com localização ativa</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Os prestadores precisam compartilhar sua localização</p>
          </div>
        </div>
      )}

      {/* Bottom info */}
      {withGps.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-md px-2 py-1 text-[11px] text-muted-foreground shadow-card">
          {withGps.length} prestador{withGps.length !== 1 ? "es" : ""} com GPS
        </div>
      )}
    </div>
  )
}

export function ProvidersMap() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [useGoogleMaps, setUseGoogleMaps] = useState(false)

  const { providers, stats, loading, error, refetch } = useProviders({
    ativo: true,
    autoRefresh: true,
    refreshInterval: 30000,
  })

  // Detecta o Google Maps por polling (o construtor pode demorar a aparecer).
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const check = () => {
      if (cancelled) return
      if (typeof window !== "undefined" && typeof (window.google as any)?.maps?.Map === "function") {
        setUseGoogleMaps(true)
        return
      }
      timer = setTimeout(check, 400)
    }
    check()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  const handleSelect = useCallback((p: Provider) => {
    setSelectedProvider((prev) => (prev?.id === p.id ? null : p))
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-4 gap-px bg-border border-b border-border shrink-0">
          {(
            [
              { key: "disponivel", label: "Disponíveis", value: stats.disponivel, color: "text-emerald-600" },
              { key: "ocupado",    label: "Ocupados",    value: stats.ocupado,    color: "text-amber-600"   },
              { key: "online",     label: "Online",      value: stats.online,     color: "text-blue-600"    },
              { key: "total",      label: "Total",       value: stats.total,      color: "text-foreground"  },
            ] as const
          ).map(({ key, label, value, color }) => (
            <div key={key} className="bg-card p-3 text-center">
              <p className={cn("text-lg font-bold tabular-nums", color)}>{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main area: map + list */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative min-h-[280px]">
          {loading && (
            <div className="absolute inset-0 z-20 bg-background/70 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Carregando...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-20 bg-destructive/5 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={refetch} className="mt-2 h-7 text-xs">
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {useGoogleMaps ? (
            <GoogleMapView providers={providers} onSelect={handleSelect} />
          ) : (
            <VisualMapFallback
              providers={providers}
              selected={selectedProvider}
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* Provider list sidebar */}
        {providers.length > 0 && (
          <div className="w-52 shrink-0 border-l border-border flex-col bg-card hidden lg:flex">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prestadores
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                className="h-6 w-6 p-0 text-muted-foreground"
                disabled={loading}
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {providers.map((p) => (
                <ProviderListItem
                  key={p.id}
                  provider={p}
                  selected={selectedProvider?.id === p.id}
                  onClick={() => handleSelect(p)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected provider detail */}
      {selectedProvider && (
        <ProviderDetail
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  )
}
