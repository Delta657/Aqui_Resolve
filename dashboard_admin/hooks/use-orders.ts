"use client"

import { useState, useEffect } from 'react'
import { OrdersService, type OrderFilters, type OrderStats } from '@/lib/services/orders-service'
import type { OrderData } from '@/lib/services/firestore-analytics'

export function useOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await OrdersService.getOrders(filters)
      setOrders(data)
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err)
      setError('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [JSON.stringify(filters)])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  }
}

export function useOrderStats(filters?: OrderFilters) {
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await OrdersService.getOrderStats(filters)
      setStats(data)
    } catch (err) {
      console.error('Erro ao buscar estatísticas dos pedidos:', err)
      setError('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [JSON.stringify(filters)])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

export function useRecentOrders(limitCount: number = 10) {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await OrdersService.getRecentOrders(limitCount)
      setOrders(data)
    } catch (err) {
      console.error('Erro ao buscar pedidos recentes:', err)
      setError('Erro ao carregar pedidos recentes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentOrders()
  }, [limitCount])

  return {
    orders,
    loading,
    error,
    refetch: fetchRecentOrders
  }
}

export function useEmergencyOrders() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmergencyOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await OrdersService.getEmergencyOrders()
      setOrders(data)
    } catch (err) {
      console.error('Erro ao buscar pedidos de emergência:', err)
      setError('Erro ao carregar pedidos de emergência')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmergencyOrders()
  }, [])

  return {
    orders,
    loading,
    error,
    refetch: fetchEmergencyOrders
  }
}