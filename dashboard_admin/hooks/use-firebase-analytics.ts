"use client"

import { useState, useEffect, useCallback } from 'react'
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'

interface AnalyticsData {
  activeUsers: number
  pageViews: number
  userActions: number
  businessEvents: number
  financialActions: number
  orderActions: number
  providerActions: number
  reportsGenerated: number
  errors: number
}

interface TimeSeriesData {
  date: string
  value: number
  category: string
}

interface TopPages {
  page: string
  views: number
}

interface UserActivity {
  action: string
  count: number
  category: string
}

// Deriva analytics dos pedidos e prestadores reais do banco
export function useFirebaseAnalytics() {
  const { user, loading: authLoading } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    activeUsers: 0,
    pageViews: 0,
    userActions: 0,
    businessEvents: 0,
    financialActions: 0,
    orderActions: 0,
    providerActions: 0,
    reportsGenerated: 0,
    errors: 0,
  })
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [topPages, setTopPages] = useState<TopPages[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = useCallback(async () => {
    if (authLoading || !user || !db) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Buscar pedidos dos últimos 30 dias
      const [ordersSnap, providersSnap, usersSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('createdAt', 'desc'),
          limit(500)
        )),
        getDocs(query(collection(db, 'providers'), limit(200))),
        getDocs(query(collection(db, 'users'), limit(200))),
      ])

      const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      const totalProviders = providersSnap.size
      const totalUsers = usersSnap.size

      // Métricas derivadas
      const completed = orders.filter((o: any) => o.status === 'completed').length
      const cancelled = orders.filter((o: any) => o.status === 'cancelled').length
      const inProgress = orders.filter((o: any) => o.status === 'in_progress').length
      const pending = orders.filter((o: any) => o.status === 'pending').length

      setAnalyticsData({
        activeUsers: totalUsers,
        pageViews: orders.length,
        userActions: orders.length,
        businessEvents: completed,
        financialActions: completed,
        orderActions: orders.length,
        providerActions: totalProviders,
        reportsGenerated: 0,
        errors: 0,
      })

      // Série temporal: pedidos por dia nos últimos 30 dias
      const dayMap = new Map<string, { new_order: number; completed: number; cancelled: number }>()
      orders.forEach((o: any) => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0)
        const key = d.toISOString().split('T')[0]
        if (!dayMap.has(key)) dayMap.set(key, { new_order: 0, completed: 0, cancelled: 0 })
        const day = dayMap.get(key)!
        day.new_order++
        if (o.status === 'completed') day.completed++
        if (o.status === 'cancelled') day.cancelled++
      })

      const ts: TimeSeriesData[] = []
      dayMap.forEach((data, date) => {
        ts.push({ date, value: data.new_order, category: 'Novos Pedidos' })
        ts.push({ date, value: data.completed, category: 'Concluídos' })
        ts.push({ date, value: data.cancelled, category: 'Cancelados' })
      })
      ts.sort((a, b) => a.date.localeCompare(b.date))
      setTimeSeriesData(ts)

      // Tipo de serviço mais solicitado (substitui top pages)
      const serviceMap = new Map<string, number>()
      orders.forEach((o: any) => {
        const s = o.serviceType || o.tipoServico || 'Não especificado'
        serviceMap.set(s, (serviceMap.get(s) || 0) + 1)
      })
      setTopPages(
        Array.from(serviceMap.entries())
          .map(([page, views]) => ({ page, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10)
      )

      // Atividade por status
      setUserActivity([
        { action: 'Novos', count: pending, category: 'Pedidos' },
        { action: 'Em andamento', count: inProgress, category: 'Pedidos' },
        { action: 'Concluídos', count: completed, category: 'Pedidos' },
        { action: 'Cancelados', count: cancelled, category: 'Pedidos' },
        { action: 'Prestadores', count: totalProviders, category: 'Usuários' },
        { action: 'Clientes', count: totalUsers - totalProviders, category: 'Usuários' },
      ])
    } catch (err) {
      console.error('Erro ao buscar analytics:', err)
      setError('Erro ao carregar dados do analytics')
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  return { analyticsData, timeSeriesData, topPages, userActivity, loading, error, refetch: fetchAnalyticsData }
}
