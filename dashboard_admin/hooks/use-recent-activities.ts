"use client"

import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface RecentActivity {
  id: string
  type: 'order_completed' | 'new_provider' | 'order_cancelled' | 'payment_received' | 'new_order' | 'new_client' | 'rating_received' | 'message_received' | 'provider_verified'
  title: string
  description: string
  timestamp: Timestamp
  time: string
  metadata?: {
    orderId?: string
    providerId?: string
    clientId?: string
    amount?: number
    rating?: number
    messageId?: string
  }
}

const toTimestamp = (v: any): Timestamp => {
  if (v instanceof Timestamp) return v
  if (v?.toDate) return v as Timestamp
  return Timestamp.now()
}

const timeAgo = (ts: Timestamp) =>
  formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ptBR })

// Deriva atividades recentes diretamente dos pedidos existentes no banco
export const useRecentActivities = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setActivities([])
      setLoading(false)
      return
    }
    if (!db) {
      setLoading(false)
      return
    }

    // Escuta os 20 pedidos mais recentes em tempo real
    const ordersQ = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsub = onSnapshot(
      ordersQ,
      (snap) => {
        const derived: RecentActivity[] = snap.docs.map((doc) => {
          const d = doc.data()
          const ts = toTimestamp(d.createdAt)
          const status: string = d.status || 'pending'
          const client: string = d.clientName || d.cliente?.nome || 'Cliente'
          const service: string = d.serviceType || d.tipoServico || 'serviço'

          let type: RecentActivity['type'] = 'new_order'
          let title = `Novo pedido — ${service}`
          let description = `${client} abriu um pedido de ${service}`

          if (status === 'completed') {
            type = 'order_completed'
            title = `Pedido concluído — ${service}`
            description = `${client} concluiu o serviço de ${service}`
          } else if (status === 'cancelled') {
            type = 'order_cancelled'
            title = `Pedido cancelado — ${service}`
            description = `Pedido de ${service} para ${client} foi cancelado`
          } else if (status === 'in_progress') {
            type = 'new_order'
            title = `Em andamento — ${service}`
            description = `${client} está sendo atendido em ${service}`
          }

          return {
            id: doc.id,
            type,
            title,
            description,
            timestamp: ts,
            time: timeAgo(ts),
            metadata: { orderId: doc.id, clientId: d.clientId },
          }
        })

        setActivities(derived)
        setLoading(false)
        setError(null)
      },
      (err: unknown) => {
        const code = (err as { code?: string })?.code
        if (code === 'permission-denied') {
          setActivities([])
          setLoading(false)
          return
        }
        setError('Erro ao carregar atividades')
        setLoading(false)
      }
    )

    return () => unsub()
  }, [user, authLoading])

  // Mantém compatibilidade com código que chama addActivity (no-op: atividades são derivadas)
  const addActivity = async (_activity: Omit<RecentActivity, 'id' | 'time'>) => {}

  return { activities, loading, error, addActivity }
}
