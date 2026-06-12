"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"

export type OperationalAlertStatus = "open" | "acknowledged" | "closed"

export interface OperationalAlertRow {
  id: string
  orderId: string
  protocol?: string
  clientName?: string
  kind: string
  severity: "low" | "medium" | "high" | "critical"
  title: string
  detail: string
  status: OperationalAlertStatus
  createdAt: Date
  sourceMessageId?: string
  createdBy?: string
}

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate()
  }
  if (value instanceof Date) return value
  return new Date()
}

export function useOperationalAlerts(maxDocs = 100) {
  const { user, loading: authLoading } = useAuth()
  const [alerts, setAlerts] = useState<OperationalAlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user || !db) {
      setAlerts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const alertsQuery = query(
      collection(db, "operationalAlerts"),
      orderBy("createdAt", "desc"),
      limit(maxDocs)
    )

    const unsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {
        const nextAlerts = snapshot.docs.map((alertDoc) => {
          const data = alertDoc.data()
          return {
            id: alertDoc.id,
            orderId: String(data.orderId || ""),
            protocol: typeof data.protocol === "string" ? data.protocol : undefined,
            clientName: typeof data.clientName === "string" ? data.clientName : undefined,
            kind: typeof data.kind === "string" ? data.kind : "manual",
            severity:
              data.severity === "low" || data.severity === "medium" || data.severity === "high" || data.severity === "critical"
                ? data.severity
                : "medium",
            title: typeof data.title === "string" ? data.title : "Alerta operacional",
            detail: typeof data.detail === "string" ? data.detail : "",
            status: data.status === "acknowledged" || data.status === "closed" ? data.status : "open",
            createdAt: toDate(data.createdAt),
            sourceMessageId: typeof data.sourceMessageId === "string" ? data.sourceMessageId : undefined,
            createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
          } satisfies OperationalAlertRow
        })

        setAlerts(nextAlerts)
        setLoading(false)
        setError(null)
      },
      () => {
        setError("Erro ao carregar alertas operacionais")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [authLoading, maxDocs, user])

  const { openCount, criticalOpen } = useMemo(() => {
    const open = alerts.filter((a) => a.status === "open")
    return {
      openCount: open.length,
      criticalOpen: open.filter((a) => a.severity === "critical").length,
    }
  }, [alerts])

  return { alerts, loading, error, openCount, criticalOpen }
}
