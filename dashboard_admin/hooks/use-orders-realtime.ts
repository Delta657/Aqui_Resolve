"use client"

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, where, limit as firestoreLimit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'
import type { OrderData } from '@/lib/services/firestore-analytics'

export interface OrdersStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  cancelled: number
  emergency: number
}

export function useOrdersRealtime() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [stats, setStats] = useState<OrdersStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    emergency: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(ordersQuery, 
        (snapshot) => {
          const ordersData: OrderData[] = []
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            ordersData.push({
              id: doc.id,
              ...data
            } as OrderData)
          })

          setOrders(ordersData)

          // Calcular estatísticas
          const newStats: OrdersStats = {
            total: ordersData.length,
            pending: ordersData.filter(order => !order.status || order.status === 'pending').length,
            inProgress: ordersData.filter(order => order.status === 'in_progress').length,
            completed: ordersData.filter(order => order.status === 'completed').length,
            cancelled: ordersData.filter(order => order.status === 'cancelled').length,
            emergency: ordersData.filter(order => order.isEmergency).length
          }

          setStats(newStats)
          setLoading(false)
        },
        (err) => {
          console.error('Erro ao escutar orders:', err)
          setError('Erro ao carregar pedidos')
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Erro ao configurar listener de orders:', err)
      setError('Erro ao configurar monitoramento')
      setLoading(false)
    }
  }, [user, authLoading])

  return {
    orders,
    stats,
    loading,
    error
  }
}

export function useActiveOrders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    try {
      const activeOrdersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(activeOrdersQuery, 
        (snapshot) => {
          const ordersData: OrderData[] = []
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            const order = {
              id: doc.id,
              ...data
            } as OrderData
            
            // Filtrar apenas orders ativos
            if (!order.status || order.status === 'pending' || order.status === 'in_progress') {
              ordersData.push(order)
            }
          })

          setOrders(ordersData)
          setLoading(false)
        },
        (err) => {
          console.error('Erro ao escutar orders ativos:', err)
          setError('Erro ao carregar pedidos ativos')
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Erro ao configurar listener de orders ativos:', err)
      setError('Erro ao configurar monitoramento')
      setLoading(false)
    }
  }, [user, authLoading])

  return {
    orders,
    loading,
    error
  }
}

export function useOrdersByStatus(status: string) {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(ordersQuery, 
        (snapshot) => {
          const ordersData: OrderData[] = []
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            ordersData.push({
              id: doc.id,
              ...data
            } as OrderData)
          })

          setOrders(ordersData)
          setLoading(false)
        },
        (err) => {
          console.error(`Erro ao escutar orders com status ${status}:`, err)
          setError(`Erro ao carregar pedidos com status ${status}`)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Erro ao configurar listener de orders por status:', err)
      setError('Erro ao configurar monitoramento')
      setLoading(false)
    }
  }, [user, authLoading, status])

  return {
    orders,
    loading,
    error
  }
}
