"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { GoogleMapsLoader } from "@/components/map/google-maps-loader"
import { MapPin, Navigation, Loader2 } from "lucide-react"

interface LatLng {
  lat: number
  lng: number
}

function readNum(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** Coordenada do destino (local do serviço) a partir do pedido. */
function readServiceLatLng(order: Record<string, unknown>): LatLng | null {
  const c = order.coordinates as Record<string, unknown> | undefined
  const lat = readNum(c?._latitude) ?? readNum(c?.latitude) ?? readNum(order.latitude)
  const lng = readNum(c?._longitude) ?? readNum(c?.longitude) ?? readNum(order.longitude)
  return lat != null && lng != null ? { lat, lng } : null
}

/** Coordenada do prestador (ao vivo), se o app já gravar isso. Hoje normalmente ausente. */
function readProviderLatLng(order: Record<string, unknown>): LatLng | null {
  const p =
    (order.providerLocation as Record<string, unknown> | undefined) ??
    ((order.assignedTechnician as Record<string, unknown> | undefined)?.location as
      | Record<string, unknown>
      | undefined)
  const lat = readNum(p?.lat) ?? readNum(p?._latitude) ?? readNum(order.providerLat)
  const lng = readNum(p?.lng) ?? readNum(p?._longitude) ?? readNum(order.providerLng)
  return lat != null && lng != null ? { lat, lng } : null
}

interface Props {
  order: Record<string, unknown>
}

/**
 * Mapa sob demanda da demanda (pedido): carrega o Google Maps SÓ quando o usuário
 * clica em "Ver no mapa", mostrando o local do serviço (destino) e, quando houver,
 * a posição do prestador + rota. Mantém o ganho de performance (Maps não global).
 */
export function OrderLocationMap({ order }: Props) {
  const [open, setOpen] = useState(false)
  const service = readServiceLatLng(order)

  if (!service) {
    return (
      <div className="rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
        <MapPin className="mr-1 inline h-4 w-4" />
        Sem coordenadas registradas para este pedido.
      </div>
    )
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Navigation className="mr-2 h-4 w-4" />
        Ver no mapa (local e rota do prestador)
      </Button>
    )
  }

  return <MapCanvas service={service} provider={readProviderLatLng(order)} />
}

function MapCanvas({ service, provider }: { service: LatLng; provider: LatLng | null }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const init = () => {
      if (cancelled) return
      const g = (typeof window !== "undefined" ? window.google : undefined) as any
      // Espera o construtor real (Map) estar disponível, não só o objeto google.maps.
      if (typeof g?.maps?.Map !== "function" || !mapRef.current) {
        timer = setTimeout(init, 400)
        return
      }
      try {
        const map = new g.maps.Map(mapRef.current, {
          center: service,
          zoom: 14,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        })

        new g.maps.Marker({
          position: service,
          map,
          title: "Local do serviço",
          label: { text: "S", color: "#fff", fontWeight: "bold" },
        })

        if (provider) {
          new g.maps.Marker({
            position: provider,
            map,
            title: "Prestador",
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#ea580c",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          })
          // Rota prestador → serviço
          const ds = new g.maps.DirectionsService()
          const dr = new g.maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: "#1e3a8a", strokeWeight: 4 } })
          ds.route(
            { origin: provider, destination: service, travelMode: g.maps.TravelMode.DRIVING },
            (res: any, status: string) => {
              if (status === "OK") dr.setDirections(res)
            }
          )
          const bounds = new g.maps.LatLngBounds()
          bounds.extend(service)
          bounds.extend(provider)
          map.fitBounds(bounds)
        }

        setReady(true)
      } catch {
        timer = setTimeout(init, 400)
      }
    }

    init()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [service, provider])

  return (
    <div className="space-y-2">
      <GoogleMapsLoader />
      <div className="relative h-[280px] w-full overflow-hidden rounded-lg border">
        {!ready && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando mapa…
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </div>
      {!provider && (
        <p className="text-xs text-muted-foreground">
          Marcador <strong>S</strong> = local do serviço. A posição do prestador aparecerá aqui quando o app mobile
          enviar a localização ao vivo.
        </p>
      )}
    </div>
  )
}
