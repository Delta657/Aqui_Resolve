import { useState, useEffect, useRef } from 'react'
import { FirebaseProvidersService, FirebaseProvider } from '@/lib/services/firebase-providers'
import { toIsoStringFromUnknown } from '@/lib/date-utils'
import { isProviderRealtimeStatus } from '@/lib/providers/status'
import { geocodeProviders } from '@/lib/geocoding'

export interface Provider {
  id: string
  nome: string
  telefone: string
  email: string
  status: 'disponivel' | 'ocupado' | 'online' | 'offline'
  localizacao: {
    lat: number
    lng: number
  }
  ultimaAtualizacao: string
  servicoAtual?: string | null
  especialidades: string[]
  avaliacao: number
  totalServicos: number
}

export interface ProvidersStats {
  total: number
  disponivel: number
  ocupado: number
  online: number
  offline: number
}

export interface UseProvidersReturn {
  providers: Provider[]
  stats: ProvidersStats | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useProviders(options?: {
  status?: string
  ativo?: boolean
  lat?: number
  lng?: number
  raio?: number
  autoRefresh?: boolean
  refreshInterval?: number
}): UseProvidersReturn {
  const [providers, setProviders] = useState<Provider[]>([])
  const [stats, setStats] = useState<ProvidersStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const geocodingRef = useRef(false)

  // Converter FirebaseProvider para Provider
  const convertFirebaseProvider = (fbProvider: FirebaseProvider): Provider => {
    const status = isProviderRealtimeStatus(fbProvider.status) ? fbProvider.status : 'offline'

    return {
      id: fbProvider.id,
      nome: fbProvider.nome || 'Prestador sem nome',
      telefone: fbProvider.telefone || '',
      email: fbProvider.email || '',
      status,
      localizacao: fbProvider.localizacao || { lat: 0, lng: 0 },
      ultimaAtualizacao: toIsoStringFromUnknown(fbProvider.ultimaAtualizacao),
      servicoAtual: fbProvider.servicoAtual ?? null,
      especialidades: Array.isArray(fbProvider.especialidades) ? fbProvider.especialidades : [],
      avaliacao: Number(fbProvider.avaliacao || 0),
      totalServicos: Number(fbProvider.totalServicos || 0)
    }
  }

  // Enriquece lista com coordenadas geocodificadas (background, sem bloquear render)
  // Recebe FirebaseProvider[] porque só eles têm cep/cidade/logradouro
  const enrichWithGeocode = async (fbList: FirebaseProvider[]) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || geocodingRef.current) return
    const needsGeocode = fbList.some(p => p.localizacao.lat === 0 && p.localizacao.lng === 0)
    if (!needsGeocode) return

    geocodingRef.current = true
    try {
      const coords = await geocodeProviders(fbList, apiKey)
      if (coords.size === 0) return
      setProviders(prev => {
        return prev.map(p => {
          const c = coords.get(p.id)
          return c ? { ...p, localizacao: c } : p
        })
      })
    } finally {
      geocodingRef.current = false
    }
  }

  // Calcular estatísticas
  const calculateStats = (providersList: Provider[]): ProvidersStats => {
    return {
      total: providersList.length,
      disponivel: providersList.filter(p => p.status === 'disponivel').length,
      ocupado: providersList.filter(p => p.status === 'ocupado').length,
      online: providersList.filter(p => p.status === 'online').length,
      offline: providersList.filter(p => p.status === 'offline').length
    }
  }

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError(null)

      let firebaseProviders: FirebaseProvider[]
      
      if (options?.ativo) {
        firebaseProviders = await FirebaseProvidersService.getActiveProviders()
      } else {
        firebaseProviders = await FirebaseProvidersService.getProviders()
      }

      // Filtrar por status se especificado
      if (options?.status) {
        firebaseProviders = firebaseProviders.filter(p => p.status === options.status)
      }

      const convertedProviders = firebaseProviders.map(convertFirebaseProvider)
      setProviders(convertedProviders)
      setStats(calculateStats(convertedProviders))
      enrichWithGeocode(firebaseProviders)
    } catch (err) {
      setError('Erro ao carregar prestadores')
      console.error('Erro ao buscar prestadores:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (options?.autoRefresh) {
      // Usar listener em tempo real do Firebase
      const unsubscribe = FirebaseProvidersService.listenToActiveProviders((firebaseProviders) => {
        try {
          let filteredProviders = firebaseProviders
          
          if (options?.status) {
            filteredProviders = filteredProviders.filter(p => p.status === options.status)
          }

          const convertedProviders = filteredProviders.map(convertFirebaseProvider)
          setProviders(convertedProviders)
          setStats(calculateStats(convertedProviders))
          setLoading(false)
          setError(null)
          enrichWithGeocode(filteredProviders)
        } catch (err) {
          setError('Erro ao carregar prestadores')
          console.error('Erro ao processar prestadores:', err)
        }
      })

      return unsubscribe
    } else {
      // Buscar uma vez
      fetchProviders()
    }
  }, [options?.status, options?.ativo, options?.autoRefresh])

  return {
    providers,
    stats,
    loading,
    error,
    refetch: fetchProviders
  }
}
