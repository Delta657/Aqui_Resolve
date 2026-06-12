"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle,
  Clock,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { FirestoreAnalyticsService } from "@/lib/services/firestore-analytics-simple"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface OrdersDashboardProps {
  filters?: {
    status?: string
    priority?: string
    serviceCategory?: string
    search?: string
  }
}

interface RealStats {
  total: number
  active: number
  completed: number
  cancelled: number
  urgent: number
  today: number
  last7Days: number
  last30Days: number
}

export function OrdersDashboard(_props: OrdersDashboardProps) {
  const [firestoreData, setFirestoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await FirestoreAnalyticsService.getDashboardMetrics()
        setFirestoreData(data)
      } catch (err) {
        console.error('Erro ao buscar dados de pedidos:', err)
        setError('Erro ao carregar dados de pedidos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = useMemo<RealStats>(() => {
    const ordersData = firestoreData?.orders || {}

    return {
      total: ordersData.totalOrders || 0,
      active: ordersData.activeOrders || 0,
      completed: ordersData.completedOrders || 0,
      cancelled: ordersData.cancelledOrders || 0,
      urgent: ordersData.emergencyOrders || 0,
      today: ordersData.ordersToday || 0,
      last7Days: ordersData.ordersLast7Days || 0,
      last30Days: ordersData.ordersLast30Days || 0,
    }
  }, [firestoreData])

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
  const cancellationRate = stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0

  const statusRows = [
    { label: "Em aberto", value: stats.active, color: "bg-yellow-500" },
    { label: "Concluidos", value: stats.completed, color: "bg-green-500" },
    { label: "Cancelados", value: stats.cancelled, color: "bg-red-500" },
    { label: "Urgentes", value: stats.urgent, color: "bg-orange-500" },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !firestoreData) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Erro ao carregar dados reais de pedidos</p>
            <p className="text-sm mt-1 text-destructive/70">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total de Pedidos",    value: stats.total,     valueClass: "text-foreground",  icon: ShoppingCart, iconCl: "text-primary",     borderCl: "border-l-primary"    },
          { label: "Pedidos em Aberto",   value: stats.active,    valueClass: "text-amber-600",   icon: Clock,        iconCl: "text-amber-600",   borderCl: "border-l-amber-500"  },
          { label: "Pedidos Concluidos",  value: stats.completed, valueClass: "text-emerald-600", icon: CheckCircle,  iconCl: "text-emerald-600", borderCl: "border-l-emerald-500"},
          { label: "Pedidos Cancelados",  value: stats.cancelled, valueClass: "text-destructive", icon: XCircle,      iconCl: "text-destructive", borderCl: "border-l-destructive"},
        ].map(({ label, value, valueClass, icon: Icon, iconCl, borderCl }) => (
          <Card key={label} className={`shadow-card border-l-4 ${borderCl}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${iconCl}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tabular-nums mb-1 ${valueClass}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuicao Atual</CardTitle>
            <CardDescription>Status calculados a partir dos pedidos reais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusRows.map((row) => {
              const width = stats.total > 0 ? (row.value / stats.total) * 100 : 0

              return (
                <div key={row.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{row.label}</span>
                    <span className="text-xs text-muted-foreground">{row.value}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`${row.color} h-2 rounded-full`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Janela Recente</CardTitle>
            <CardDescription>Volumes observados nas datas reais de criacao</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Hoje</p>
                <p className="text-xs text-muted-foreground">Pedidos criados hoje</p>
              </div>
              <Badge variant="outline">{stats.today}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Ultimos 7 dias</p>
                <p className="text-xs text-muted-foreground">Pedidos criados na semana</p>
              </div>
              <Badge variant="outline">{stats.last7Days}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Ultimos 30 dias</p>
                <p className="text-xs text-muted-foreground">Pedidos criados no mes</p>
              </div>
              <Badge variant="outline">{stats.last30Days}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Pedidos urgentes</p>
                <p className="text-xs text-muted-foreground">Marcados como emergencia</p>
              </div>
              <Badge variant="outline">{stats.urgent}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Indicadores Reais</span>
          </CardTitle>
          <CardDescription>
            Taxas calculadas apenas com os dados disponiveis no Firestore
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-3">
          {[
            { label: "Taxa de Conclusao",          value: `${completionRate.toFixed(1)}%`,    valueClass: "text-emerald-600", sub: "Pedidos concluidos sobre o total"     },
            { label: "Taxa de Cancelamento",        value: `${cancellationRate.toFixed(1)}%`,  valueClass: "text-destructive", sub: "Pedidos cancelados sobre o total"     },
            { label: "Pedidos nos Ultimos 30 Dias", value: stats.last30Days,                   valueClass: "text-primary",     sub: "Volume recente"                       },
          ].map(({ label, value, valueClass, sub }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4 sm:p-6 text-center">
              <div className={`text-3xl font-bold tabular-nums mb-2 ${valueClass}`}>{value}</div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
