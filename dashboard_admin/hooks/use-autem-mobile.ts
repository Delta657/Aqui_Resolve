import { useState, useEffect, useCallback } from 'react'
import { MobileStatsService, MobileStats, ProviderRealtimeStatus } from '@/lib/services/mobile-stats-service'

export interface UseAutEMMobileReturn {
  stats: MobileStats | null
  realtimeStatus: ProviderRealtimeStatus[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastUpdate: Date | null
}

export function useAutEMMobile(options?: {
  autoRefresh?: boolean
  refreshInterval?: number
}): UseAutEMMobileReturn {
  const [stats, setStats] = useState<MobileStats | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<ProviderRealtimeStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar estatísticas e status em paralelo
      const [statsData, statusData] = await Promise.all([
        MobileStatsService.getMobileStats(),
        MobileStatsService.getRealtimeStatus()
      ])

      setStats(statsData)
      setRealtimeStatus(statusData)
      setLastUpdate(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do AutEM Mobile'
      setError(errorMessage)
      console.error('Erro ao buscar dados do AutEM Mobile:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Buscar dados iniciais
    fetchData()

    // Configurar auto-refresh se habilitado
    if (options?.autoRefresh) {
      const interval = setInterval(() => {
        fetchData()
      }, options?.refreshInterval || 30000) // Default: 30 segundos

      return () => clearInterval(interval)
    }
  }, [fetchData, options?.autoRefresh, options?.refreshInterval])

  return {
    stats,
    realtimeStatus,
    loading,
    error,
    refetch: fetchData,
    lastUpdate
  }
}

