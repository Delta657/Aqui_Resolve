"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, orderBy, query, limit as limitFn } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface OperationalEventRow extends Record<string, unknown> {
  id: string
  type?: string
  at?: unknown
  fromStatus?: string | null
  toStatus?: string | null
  actorName?: string
  actorEmail?: string
  note?: string
  mutationId?: string
  previousOperationalStatus?: string
  newOperationalStatus?: string
}

export function useOrderOperationalEvents(orderId: string | null, enabled: boolean, maxRows = 80) {
  const [events, setEvents] = useState<OperationalEventRow[]>([])
  const [loading, setLoading] = useState(Boolean(orderId && enabled))

  useEffect(() => {
    if (!db || !orderId || !enabled) {
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, "orders", orderId, "operational_events"),
      orderBy("createdAt", "desc"),
      limitFn(maxRows)
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: OperationalEventRow[] = []
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() } as OperationalEventRow))
        setEvents(rows)
        setLoading(false)
      },
      (err) => {
        console.warn("operational_events listener:", err)
        setEvents([])
        setLoading(false)
      }
    )

    return () => unsub()
  }, [orderId, enabled, maxRows])

  return { events, loading }
}
