"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useOrderDocumentRealtime(orderId: string | null, enabled: boolean) {
  const [order, setOrder] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(Boolean(orderId && enabled))

  useEffect(() => {
    if (!db || !orderId || !enabled) {
      setOrder(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const ref = doc(db, "orders", orderId)

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setOrder(null)
        } else {
          setOrder({ id: snap.id, ...snap.data() })
        }
        setLoading(false)
      },
      () => {
        setLoading(false)
      }
    )

    return () => unsub()
  }, [orderId, enabled])

  return { order, loading }
}
