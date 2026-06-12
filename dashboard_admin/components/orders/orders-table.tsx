"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { useOperationalOrdersNotifications } from "@/hooks/use-operational-orders-notifications"
import { useOrdersFilteredRealtime } from "@/hooks/use-orders-filtered-realtime"
import { OperationalDashboardStrip, OperationalStatusMini } from "@/components/orders/operational-dashboard-strip"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

type EmergencyFilter = "all" | "emergency" | "standard"

interface OrdersTableProps {
  filters?: {
    status?: string
    isEmergency?: boolean
    searchTerm?: string
  }
  onView?: (order: any) => void
  onEdit?: (orderId: string) => void
}

const STATUS_OPTIONS = [
  { value: "all",         label: "Todos os status"  },
  { value: "pending",     label: "Pendentes"        },
  { value: "assigned",    label: "Atribuídos"       },
  { value: "in_progress", label: "Em andamento"     },
  { value: "completed",   label: "Concluídos"       },
  { value: "cancelled",   label: "Cancelados"       },
]

const PAGE_SIZE = 15

function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === "function") {
    const d = value.toDate()
    return d instanceof Date ? d : null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getStatusBadge(order: any) {
  if (order.cancelledAt || order.status === "cancelled") {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <XCircle className="h-3 w-3" />
        Cancelado
      </Badge>
    )
  }
  if (order.status === "completed") {
    return (
      <Badge className="gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
        <CheckCircle className="h-3 w-3" />
        Concluído
      </Badge>
    )
  }
  if (order.status === "assigned") {
    return (
      <Badge className="gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white">
        <Clock className="h-3 w-3" />
        Atribuído
      </Badge>
    )
  }
  if (order.isEmergency) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <ShieldAlert className="h-3 w-3" />
        Emergência
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <Clock className="h-3 w-3" />
      Em andamento
    </Badge>
  )
}

function formatRelativeDate(value: any) {
  const date = toDate(value)
  if (!date) return "—"
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
}

function getOrderAmount(order: any): number | null {
  const candidates = [order.estimatedPrice, order.budget, order.price, order.valor, order.amount, order.total]
  const amount = candidates.find((c) => typeof c === "number" && Number.isFinite(c))
  return typeof amount === "number" ? amount : null
}

function getServiceLabel(order: any): string {
  return order.serviceCategory || order.serviceName || order.serviceType || order.description || "Serviço não informado"
}

function getAddressLabel(order: any): string {
  return (
    order.location ||
    order.address ||
    order.serviceAddress ||
    [order.city, order.state].filter(Boolean).join(", ") ||
    "Endereço não informado"
  )
}

export function OrdersTable({ filters, onView }: OrdersTableProps) {
  const [searchTerm, setSearchTerm]     = useState(filters?.searchTerm || "")
  const [statusFilter, setStatusFilter] = useState(filters?.status || "all")
  const [emergencyFilter, setEmergencyFilter] = useState<EmergencyFilter>(
    filters?.isEmergency === true ? "emergency" : filters?.isEmergency === false ? "standard" : "all"
  )
  const [page, setPage] = useState(1)

  const activeFilters = useMemo(
    () => ({
      status:      statusFilter === "all" ? undefined : statusFilter,
      isEmergency: emergencyFilter === "all" ? undefined : emergencyFilter === "emergency",
      searchTerm:  searchTerm.trim() || undefined,
    }),
    [emergencyFilter, searchTerm, statusFilter]
  )

  const { orders, allOrders, loading, error, reconnect } = useOrdersFilteredRealtime(activeFilters)

  useOperationalOrdersNotifications(allOrders as unknown as Record<string, unknown>[], {
    enabled: !loading && !error,
  })

  useEffect(() => {
    setPage(1)
  }, [activeFilters])

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
  const paginated  = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="border-b border-border">
          <div className="h-5 w-32 rounded bg-muted animate-skeleton" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-24 rounded bg-muted animate-skeleton" />
                <div className="h-4 w-36 rounded bg-muted animate-skeleton" />
                <div className="h-4 w-28 rounded bg-muted animate-skeleton ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-16 text-center">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Erro ao carregar pedidos</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button size="sm" onClick={reconnect}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ─── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <OperationalDashboardStrip orders={allOrders as unknown as Record<string, unknown>[]} />

      <Card className="shadow-card">
        {/* Filters */}
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold">Todos os pedidos</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {orders.length} pedido{orders.length !== 1 ? "s" : ""} encontrado{orders.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_180px] xl:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar cliente, email, endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={emergencyFilter} onValueChange={(v) => setEmergencyFilter(v as EmergencyFilter)}>
                <SelectTrigger className="h-9 text-sm md:col-span-2 xl:col-span-1">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="emergency">Emergências</SelectItem>
                  <SelectItem value="standard">Comuns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhum pedido encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Ajuste os filtros para ampliar a busca</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden xl:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serviço</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endereço</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Operação</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((order: any) => {
                      const amount = getOrderAmount(order)
                      return (
                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{String(order.id).slice(-8)}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-foreground leading-tight">
                              {order.clientName || "Não informado"}
                            </p>
                            <p className="text-xs text-muted-foreground">{order.clientEmail || "—"}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-foreground truncate max-w-[180px]">{getServiceLabel(order)}</p>
                            {order.description && order.description !== getServiceLabel(order) && (
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{order.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-1.5 max-w-40">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground truncate">{getAddressLabel(order)}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <OperationalStatusMini order={order as Record<string, unknown>} />
                          </TableCell>
                          <TableCell>{getStatusBadge(order)}</TableCell>
                          <TableCell>
                            <p className="text-xs text-foreground">{formatRelativeDate(order.createdAt)}</p>
                            {order.cancelledAt && (
                              <p className="text-xs text-destructive">Cancelado {formatRelativeDate(order.cancelledAt)}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-sm font-semibold tabular-nums",
                              amount !== null ? "text-emerald-600" : "text-muted-foreground"
                            )}>
                              {amount === null
                                ? "—"
                                : `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView?.(order)}
                              className="h-7 gap-1.5 px-2.5 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 xl:hidden">
                {paginated.map((order: any) => {
                  const amount = getOrderAmount(order)
                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border border-border bg-card p-4 space-y-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">#{String(order.id).slice(-8)}</p>
                          <p className="text-sm font-medium text-foreground truncate mt-0.5">
                            {order.clientName || "Não informado"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{order.clientEmail || "—"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:max-w-[220px] sm:justify-end">
                          {getStatusBadge(order)}
                          <OperationalStatusMini order={order as Record<string, unknown>} />
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-border pt-2.5">
                        <p className="text-xs text-muted-foreground break-words">
                          <span className="font-medium text-foreground">Serviço: </span>
                          {getServiceLabel(order)}
                        </p>
                        <p className="text-xs text-muted-foreground break-words">
                          <span className="font-medium text-foreground">Local: </span>
                          {getAddressLabel(order)}
                        </p>
                        <div className="flex flex-col gap-1 pt-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-muted-foreground">{formatRelativeDate(order.createdAt)}</p>
                          <span className={cn(
                            "text-sm font-bold tabular-nums",
                            amount !== null ? "text-emerald-600" : "text-muted-foreground"
                          )}>
                            {amount === null
                              ? "—"
                              : `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </span>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => onView?.(order)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Ver detalhes
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, orders.length)} de {orders.length}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "...")[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...")
                        acc.push(p)
                        return acc
                      }, [])
                      .map((item, i) =>
                        item === "..." ? (
                          <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                        ) : (
                          <Button
                            key={item}
                            variant={page === item ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(item as number)}
                            className="h-7 w-7 p-0 text-xs"
                          >
                            {item}
                          </Button>
                        )
                      )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
