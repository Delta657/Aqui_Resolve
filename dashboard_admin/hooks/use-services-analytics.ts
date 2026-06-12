"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, query, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'

interface OrderDoc {
  id: string
  status?: string
  totalAmount?: number
  completedAt?: Timestamp
  createdAt?: Timestamp
  isEmergency?: boolean
  rating?: number
  serviceType?: string
  cancelledAt?: unknown
}

export interface ServiceAnalytics {
  totalServices: number
  activeServices: number
  completedServices: number
  pendingServices: number
  cancelledServices: number
  emergencyServices: number
  averageRating: number
  totalRevenue: number
  monthlyRevenue: number
  topServices: Array<{
    serviceType: string
    count: number
    revenue: number
  }>
  servicesByStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  servicesByMonth: Array<{
    month: string
    count: number
    revenue: number
  }>
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos

export const useServicesAnalytics = () => {
  const { user, loading: authLoading } = useAuth()
  const [analytics, setAnalytics] = useState<ServiceAnalytics>({
    totalServices: 0,
    activeServices: 0,
    completedServices: 0,
    pendingServices: 0,
    cancelledServices: 0,
    emergencyServices: 0,
    averageRating: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    topServices: [],
    servicesByStatus: [],
    servicesByMonth: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const fetchAnalytics = useCallback(async () => {
    if (!db || !user) return

    try {
      const ordersRef = collection(db, 'orders')
      const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(500))
      const snapshot = await getDocs(q)
      const orders: OrderDoc[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<OrderDoc, 'id'>)
      }))

        // Calcular estatísticas
        const totalServices = orders.length
        const activeServices = orders.filter(order => 
          order.status === 'in_progress' || order.status === 'accepted'
        ).length
        const completedServices = orders.filter(order => 
          order.status === 'completed'
        ).length
        const pendingServices = orders.filter(order => 
          order.status === 'pending' || order.status === 'waiting'
        ).length
        const cancelledServices = orders.filter(order => 
          order.status === 'cancelled' || order.cancelledAt
        ).length
        const emergencyServices = orders.filter(order => 
          order.isEmergency
        ).length

        // Calcular receita
        const totalRevenue = orders
          .filter(order => order.status === 'completed' && order.totalAmount)
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0)

        // Receita do mês atual
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyRevenue = orders
          .filter(order => {
            if (!order.completedAt) return false
            const orderDate = order.completedAt.toDate()
            return orderDate.getMonth() === currentMonth && 
                   orderDate.getFullYear() === currentYear &&
                   order.status === 'completed' &&
                   order.totalAmount
          })
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0)

        // Avaliação média
        const ratings = orders
          .filter(order => order.rating && order.status === 'completed')
          .map(order => order.rating as number)
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : 0

        // Top serviços
        const serviceTypeCount: Record<string, { count: number, revenue: number }> = {}
        orders.forEach(order => {
          if (order.serviceType) {
            if (!serviceTypeCount[order.serviceType]) {
              serviceTypeCount[order.serviceType] = { count: 0, revenue: 0 }
            }
            serviceTypeCount[order.serviceType].count++
            if (order.status === 'completed' && order.totalAmount) {
              serviceTypeCount[order.serviceType].revenue += order.totalAmount
            }
          }
        })
        const topServices = Object.entries(serviceTypeCount)
          .map(([serviceType, data]) => ({
            serviceType,
            count: data.count,
            revenue: data.revenue
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Serviços por status
        const statusCount: Record<string, number> = {}
        orders.forEach(order => {
          const status = order.cancelledAt ? 'cancelled' : (order.status ?? 'unknown')
          statusCount[status] = (statusCount[status] || 0) + 1
        })
        const servicesByStatus = Object.entries(statusCount)
          .map(([status, count]) => ({
            status,
            count,
            percentage: totalServices > 0 ? (count / totalServices) * 100 : 0
          }))

        // Serviços por mês (últimos 12 meses)
        const monthlyCount: Record<string, { count: number, revenue: number }> = {}
        const now = new Date()
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
          monthlyCount[monthKey] = { count: 0, revenue: 0 }
        }

        orders.forEach(order => {
          if (order.createdAt) {
            const orderDate = order.createdAt.toDate()
            const monthKey = orderDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
            if (monthlyCount[monthKey]) {
              monthlyCount[monthKey].count++
              if (order.status === 'completed' && order.totalAmount) {
                monthlyCount[monthKey].revenue += order.totalAmount
              }
            }
          }
        })

        const servicesByMonth = Object.entries(monthlyCount)
          .map(([month, data]) => ({
            month,
            count: data.count,
            revenue: data.revenue
          }))

      if (!isMounted.current) return
      setAnalytics({
        totalServices,
        activeServices,
        completedServices,
        pendingServices,
        cancelledServices,
        emergencyServices,
        averageRating,
        totalRevenue,
        monthlyRevenue,
        topServices,
        servicesByStatus,
        servicesByMonth
      })
      setLoading(false)
      setError(null)
    } catch (err) {
      if (!isMounted.current) return
      console.error('Erro ao buscar analytics de serviços:', err)
      setError('Erro ao carregar analytics')
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    isMounted.current = true
    if (authLoading) return
    if (!user) { setLoading(false); return }
    if (!db) { setLoading(false); return }

    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, REFRESH_INTERVAL_MS)
    return () => {
      isMounted.current = false
      clearInterval(interval)
    }
  }, [user, authLoading, fetchAnalytics])

  return { analytics, loading, error, refetch: fetchAnalytics }
}
