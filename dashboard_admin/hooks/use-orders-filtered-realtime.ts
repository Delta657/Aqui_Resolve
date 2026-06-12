"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { resolveOperationalStatus } from "@/lib/orders/operational"
import type { OrderFilters } from "@/lib/services/orders-service"
import type { OrderData } from "@/lib/services/firestore-analytics"

export function useOrdersFilteredRealtime(filters?: OrderFilters) {
  const { user, loading: authLoading } = useAuth()
  const [snapshotOrders, setSnapshotOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resubscribeKey, setResubscribeKey] = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    if (!db) {
      setError("Firebase não inicializado")
      setLoading(false)
      return
    }

    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(300))

    const unsub = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const rows: OrderData[] = []
        snapshot.forEach((docSnap) => {
          rows.push({ id: docSnap.id, ...docSnap.data() } as OrderData)
        })
        setSnapshotOrders(rows)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Erro ao escutar pedidos:", err)
        setError("Erro ao carregar pedidos")
        setLoading(false)
      }
    )

    return () => unsub()
  }, [user, authLoading, resubscribeKey])

  const filtered = useMemo(() => {
    let list = snapshotOrders

    if (filters?.status) {
      list = list.filter((order) => {
        const rec = order as unknown as Record<string, unknown>
        const legacy = String(rec.status || "")
        const op = resolveOperationalStatus(rec)
        return legacy === filters.status || op === filters.status
      })
    }

    if (filters?.isEmergency !== undefined) {
      list = list.filter((order) => Boolean((order as { isEmergency?: boolean }).isEmergency) === filters.isEmergency)
    }

    if (filters?.clientId) {
      list = list.filter((order) => (order as { clientId?: string }).clientId === filters.clientId)
    }

    if (filters?.dateFrom) {
      list = list.filter((order) => order.createdAt?.toDate()?.getTime() >= filters.dateFrom!.getTime())
    }

    if (filters?.dateTo) {
      list = list.filter((order) => order.createdAt?.toDate()?.getTime() <= filters.dateTo!.getTime())
    }

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      list = list.filter(
        (order) =>
          order.clientName?.toLowerCase().includes(searchLower) ||
          order.clientEmail?.toLowerCase().includes(searchLower) ||
          order.address?.toLowerCase().includes(searchLower) ||
          order.description?.toLowerCase().includes(searchLower)
      )
    }

    return list
  }, [filters, snapshotOrders])

  return {
    orders: filtered,
    allOrders: snapshotOrders,
    loading,
    error,
    reconnect: () => setResubscribeKey((k) => k + 1),
  }
}
