"use client"

import { useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Navigation,
  Clock,
  Wifi,
  Battery,
  User,
  Phone,
  Mail,
  Star,
  Car
} from "lucide-react"
import { useProviders } from "@/hooks/use-providers"
import { toDateFromUnknown } from "@/lib/date-utils"

interface ProviderLocation {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  latitude: number
  longitude: number
  status: 'disponivel' | 'ocupado' | 'online' | 'offline'
  lastUpdate: Date
  batteryLevel: number
  signalStrength: number
  currentService?: {
    id: string
    title: string
    clientName: string
    estimatedTime: number
  }
  rating: number
  vehicle?: {
    model: string
    plate: string
    color: string
  }
}

export function ProviderMap() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderLocation | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const { providers: realtimeProviders } = useProviders({ autoRefresh: true })

  const providers = useMemo<ProviderLocation[]>(() => {
    return realtimeProviders.map((provider, index) => ({
      id: provider.id,
      name: provider.nome,
      email: provider.email,
      phone: provider.telefone,
      latitude: provider.localizacao?.lat ?? 0,
      longitude: provider.localizacao?.lng ?? 0,
      status: provider.status,
      lastUpdate: toDateFromUnknown(provider.ultimaAtualizacao, new Date()),
      batteryLevel: 60 + ((index * 13) % 40),
      signalStrength: 3 + (index % 3),
      currentService: provider.servicoAtual
        ? {
          id: `servico-${provider.id}`,
          title: provider.servicoAtual,
          clientName: "Cliente em andamento",
          estimatedTime: 35,
        }
        : undefined,
      rating: provider.avaliacao,
      vehicle: undefined,
    }))
  }, [realtimeProviders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return '#10b981'
      case 'ocupado': return '#f59e0b'
      case 'online': return '#3b82f6'
      case 'offline': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponivel'
      case 'ocupado': return 'Ocupado'
      case 'online': return 'Online'
      case 'offline': return 'Offline'
      default: return 'Desconhecido'
    }
  }

  return (
    <div className="relative h-full">
      {/* Mapa Simulado */}
      <div
        ref={mapRef}
        className="w-full h-full bg-muted relative overflow-hidden"
      >
        {/* Grid do mapa */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-20 grid-rows-20 h-full">
            {Array.from({ length: 400 }).map((_, i) => (
              <div key={i} className="border border-border"></div>
            ))}
          </div>
        </div>

        {/* Marcadores dos prestadores */}
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${((provider.longitude + 46.64) * 1000) % 100}%`,
              top: `${((provider.latitude + 23.55) * 1000) % 100}%`,
            }}
            onClick={() => setSelectedProvider(provider)}
          >
            <div className="relative">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                style={{ backgroundColor: getStatusColor(provider.status) }}
              >
                <User className="w-3 h-3 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-card rounded-full border-2 border-border flex items-center justify-center">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(provider.status) }}
                ></div>
              </div>
            </div>
          </div>
        ))}

        {/* Legenda */}
        <div className="absolute bottom-4 left-4 bg-card rounded-lg shadow-card p-3 border border-border">
          <div className="text-sm font-medium mb-2 text-foreground">Status dos Prestadores</div>
          <div className="space-y-1">
            {['disponivel', 'ocupado', 'online', 'offline'].map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) }}
                ></div>
                <span className="text-xs text-muted-foreground">
                  {getStatusText(status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel de detalhes do prestador */}
      {selectedProvider && (
        <div className="absolute top-4 right-4 w-80 bg-card rounded-lg shadow-card border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedProvider.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProvider(null)}
                className="text-muted-foreground"
              >
                ×
              </Button>
            </div>
            <Badge
              style={{
                backgroundColor: getStatusColor(selectedProvider.status),
                color: 'white'
              }}
            >
              {getStatusText(selectedProvider.status)}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Informações de contato */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {selectedProvider.phone}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {selectedProvider.email}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {selectedProvider.rating} ⭐
                </span>
              </div>
            </div>

            {/* Status do dispositivo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bateria</span>
                <div className="flex items-center space-x-1">
                  <Battery className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {Math.round(selectedProvider.batteryLevel)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sinal</span>
                <div className="flex items-center space-x-1">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {selectedProvider.signalStrength}/5
                  </span>
                </div>
              </div>
            </div>

            {/* Veículo */}
            {selectedProvider.vehicle && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Veículo
                  </span>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div>{selectedProvider.vehicle.model}</div>
                  <div>Placa: {selectedProvider.vehicle.plate}</div>
                  <div>Cor: {selectedProvider.vehicle.color}</div>
                </div>
              </div>
            )}

            {/* Serviço atual */}
            {selectedProvider.currentService && (
              <div className="space-y-2 p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Serviço Atual
                  </span>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div>{selectedProvider.currentService.title}</div>
                  <div>Cliente: {selectedProvider.currentService.clientName}</div>
                  <div>Tempo estimado: {selectedProvider.currentService.estimatedTime} min</div>
                </div>
              </div>
            )}

            {/* Última atualização */}
            <div className="text-xs text-muted-foreground">
              Última atualização: {selectedProvider.lastUpdate.toLocaleTimeString()}
            </div>

            {/* Ações */}
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1" style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}>
                <Navigation className="w-4 h-4 mr-2" />
                Rastrear
              </Button>
              <Button size="sm" variant="outline" className="flex-1" style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}>
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </Button>
            </div>
          </CardContent>
        </div>
      )}
    </div>
  )
}
