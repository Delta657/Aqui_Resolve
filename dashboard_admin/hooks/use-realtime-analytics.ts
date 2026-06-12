"use client"

import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'

interface RealtimeMetric {
  id: string
  timestamp: Date
  eventName: string
  parameters: Record<string, any>
  userId?: string
  sessionId?: string
}

interface RealtimeStats {
  totalEvents: number
  eventsLastHour: number
  activeUsers: number
  topEvents: Array<{ eventName: string; count: number }>
  recentEvents: RealtimeMetric[]
}

// Deriva métricas em tempo real diretamente dos pedidos do banco
export function useRealtimeAnalytics() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<RealtimeStats>({
    totalEvents: 0,
    eventsLastHour: 0,
    activeUsers: 0,
    topEvents: [],
    recentEvents: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    if (!db) { setError('Firebase não inicializado'); setLoading(false); return }

    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(oneDayAgo)),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

        const events: RealtimeMetric[] = snap.docs.map((doc) => {
          const d = doc.data()
          const ts = d.createdAt?.toDate ? d.createdAt.toDate() : new Date()
          return {
            id: doc.id,
            timestamp: ts,
            eventName: d.status === 'completed' ? 'order_completed'
              : d.status === 'cancelled' ? 'order_cancelled'
              : d.status === 'in_progress' ? 'order_in_progress'
              : 'new_order',
            parameters: { serviceType: d.serviceType, clientName: d.clientName },
            userId: d.clientId,
          }
        })

        const eventsLastHour = events.filter(e => e.timestamp >= oneHourAgo).length
        const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean))

        const eventCounts = new Map<string, number>()
        events.forEach(e => eventCounts.set(e.eventName, (eventCounts.get(e.eventName) || 0) + 1))
        const topEvents = Array.from(eventCounts.entries())
          .map(([eventName, count]) => ({ eventName, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        setStats({
          totalEvents: events.length,
          eventsLastHour,
          activeUsers: uniqueUsers.size,
          topEvents,
          recentEvents: events.slice(0, 10),
        })
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Erro ao escutar pedidos em tempo real:', err)
        setError('Erro ao carregar dados em tempo real')
        setLoading(false)
      }
    )

    return () => unsub()
  }, [user, authLoading])

  return { stats, loading, error }
}
