"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  OPERATIONAL_STATUS_LABELS,
  previewOperationalMetrics,
  resolveOperationalStatus,
  type ServiceOperationalStatus,
} from "@/lib/orders/operational"

export interface UseOperationalOrdersNotificationsOptions {
  enabled?: boolean
}

/**
 * Observa mudanças nos documentos de pedidos (ex.: listener em tempo real) e dispara toasts
 * para marcos operacionais e estouro de SLA. Integração explícita para push/SMS no backend.
 */
export function useOperationalOrdersNotifications(
  orders: ReadonlyArray<Record<string, unknown>>,
  options?: UseOperationalOrdersNotificationsOptions
) {
  const enabled = options?.enabled !== false
  const prev = useRef<Map<string, string>>(new Map())
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const next = new Map<string, string>()
    for (const row of orders) {
      const id = String(row.id ?? "")
      if (!id) continue
      const op = resolveOperationalStatus(row)
      const metrics = previewOperationalMetrics(row)
      const late = metrics.delayMs != null && metrics.delayMs > 0 ? "1" : "0"
      next.set(id, `${op}:${late}`)
    }

    if (!bootstrapped.current) {
      bootstrapped.current = true
      prev.current = next
      return
    }

    const shortId = (id: string) => id.slice(-6)

    for (const [id, signature] of next) {
      const before = prev.current.get(id)
      if (!before || before === signature) {
        continue
      }

      const [prevOp, prevLate] = before.split(":") as [string, string]
      const [nextOp, nextLate] = signature.split(":") as [string, string]

      if (nextLate === "1" && prevLate !== "1") {
        toast.warning(`SLA em atraso · #${shortId(id)}`, {
          description: OPERATIONAL_STATUS_LABELS[nextOp as ServiceOperationalStatus] || nextOp,
        })
      }

      if (prevOp !== nextOp) {
        const label = OPERATIONAL_STATUS_LABELS[nextOp as ServiceOperationalStatus] || nextOp
        if (nextOp === "finalizado") {
          toast.success(`Serviço finalizado · #${shortId(id)}`, { description: label })
        } else if (nextOp === "cancelado") {
          toast.message(`Serviço cancelado · #${shortId(id)}`, { description: label })
        } else if (nextOp === "chegou_no_local") {
          toast.info(`Chegada no local · #${shortId(id)}`, { description: label })
        } else if (nextOp === "aceite_pelo_tecnico") {
          toast.info(`Aceite pelo técnico · #${shortId(id)}`, { description: label })
        } else if (
          nextOp === "em_atendimento" &&
          prevOp !== "pausado" &&
          prevOp !== "aguardando_cliente"
        ) {
          toast.info(`Atendimento em curso · #${shortId(id)}`, { description: label })
        }
      }
    }

    prev.current = next
  }, [orders, enabled])
}
