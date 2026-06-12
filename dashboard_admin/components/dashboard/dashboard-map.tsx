"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { FirebaseOrdersService } from "@/lib/services/firebase-orders"

// Fix para ícones do Leaflet
const iconDefaultPrototype = L.Icon.Default.prototype as { _getIconUrl?: unknown }
delete iconDefaultPrototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface MapService {
  id: string
  title: string
  lat: number
  lng: number
  status: string
  profissional: string
}

const statusColors = {
  pendente: "#f59e0b",
  agendado: "#6b7280",
  aceito: "#16a34a",
  aguardando: "#f59e0b",
  nao_enviado: "#6b7280",
  em_andamento: "#3b82f6",
  concluido: "#059669",
  cancelado: "#ef4444",
}

export function DashboardMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<ReturnType<typeof L.map> | null>(null)
  const markersRef = useRef<Array<ReturnType<typeof L.marker>>>([])
  const [services, setServices] = useState<MapService[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Criar mapa
    const map = L.map(mapRef.current).setView([-23.5505, -46.6333], 12)

    // Adicionar tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    return FirebaseOrdersService.listenToOrders((orders) => {
      const mapped: MapService[] = []
      orders.forEach((order) => {
        const coordinates = order.endereco?.coordenadas
        if (!coordinates) {
          return
        }

        mapped.push({
          id: order.id,
          title: order.numero || "Pedido sem numero",
          lat: coordinates.lat,
          lng: coordinates.lng,
          status: order.status,
          profissional: order.prestador?.nome || "Nao atribuido",
        })
      })

      setServices(mapped)
    })
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) {
      return
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    services.forEach((service) => {
      const marker = L.marker([service.lat, service.lng])
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${service.title}</h3>
            <p class="text-xs text-muted-foreground">Profissional: ${service.profissional}</p>
            <p class="text-xs text-muted-foreground">Status: ${service.status}</p>
          </div>
        `)

      const statusColor = statusColors[service.status as keyof typeof statusColors] ?? "#6b7280"
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 12px;
          height: 12px;
          background-color: ${statusColor};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })

      marker.setIcon(customIcon)
      markersRef.current.push(marker)
    })
  }, [services])

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="h-64 w-full rounded-lg border" />

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
          <span>Agendado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span>Aceito</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Aguardando</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Em Andamento</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
          <span>Concluído</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Cancelado</span>
        </div>
      </div>
    </div>
  )
}
