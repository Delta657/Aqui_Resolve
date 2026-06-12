"use client"

import { useMemo, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  OPERATIONAL_STATUS_BADGE_CLASS,
  OPERATIONAL_STATUS_LABELS,
  previewOperationalMetrics,
  resolveOperationalStatus,
} from "@/lib/orders/operational"
import { AlertTriangle, Clock, Truck, UserCheck, Users } from "lucide-react"

interface OperationalDashboardStripProps {
  orders: Array<Record<string, unknown>>
}

export function OperationalDashboardStrip({ orders }: OperationalDashboardStripProps) {
  const stats = useMemo(() => {
    let pending = 0
    let inField = 0
    let availableTechHint = 0
    let overdue = 0
    let nearSla = 0
    const techIdsInField = new Set<string>()

    const fifteenMin = 15 * 60 * 1000

    for (const o of orders) {
      const op = resolveOperationalStatus(o)
      if (op === "pendente") pending += 1

      if (["em_deslocamento", "chegou_no_local", "em_atendimento", "pausado", "aguardando_cliente"].includes(op)) {
        inField += 1
        const tech = o.assignedTechnician as { id?: string } | undefined
        if (tech?.id) techIdsInField.add(String(tech.id))
      }

      const m = previewOperationalMetrics(o)
      if (m.delayMs != null && m.delayMs > 0) overdue += 1
      if (m.slaRemainingMs != null && m.slaRemainingMs < fifteenMin && m.slaRemainingMs > 0) nearSla += 1

      if (op === "aceite_pelo_tecnico") availableTechHint += 1
    }

    return {
      pending,
      inField,
      availableTechHint,
      overdue,
      nearSla,
      techsInField: techIdsInField.size,
      total: orders.length,
    }
  }, [orders])

  return (
    <Card className="border-primary/20 bg-card shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-orange-900">
          <Truck className="h-5 w-5" />
          Painel operacional (tempo real)
        </CardTitle>
        <CardDescription>
          Agregação em tempo real sobre todos os pedidos (lista completa), independente dos filtros da tabela.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Stat icon={<Clock className="h-4 w-4" />} label="Pendentes" value={stats.pending} />
          <Stat icon={<Truck className="h-4 w-4" />} label="Pedidos em campo" value={stats.inField} />
          <Stat icon={<Users className="h-4 w-4" />} label="Técnicos distintos em campo" value={stats.techsInField} />
          <Stat icon={<UserCheck className="h-4 w-4" />} label="Aceitos (sem deslocar)" value={stats.availableTechHint} />
          <Stat icon={<AlertTriangle className="h-4 w-4 text-red-600" />} label="SLA estourado" value={stats.overdue} warn />
          <Stat icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} label="SLA &lt; 15 min" value={stats.nearSla} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          SLA: usa slaDueAt quando existir; senão createdAt + slaTargetMinutes (padrão 240 min). Toasts de operação: hook
          useOperationalOrdersNotifications na listagem.
        </p>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  icon,
  warn,
}: {
  label: string
  value: number
  icon: ReactNode
  warn?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-3 shadow-card ${warn ? "border-red-200" : "border-border"}`}>
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${warn ? "text-red-600" : "text-foreground"}`}>{value}</p>
      </div>
    </div>
  )
}

export function OperationalStatusMini({ order }: { order: Record<string, unknown> }) {
  const op = resolveOperationalStatus(order)
  return (
    <Badge variant="outline" className={`${OPERATIONAL_STATUS_BADGE_CLASS[op]} text-xs`}>
      {OPERATIONAL_STATUS_LABELS[op]}
    </Badge>
  )
}
