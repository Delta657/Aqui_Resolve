"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useServicesAnalytics } from "@/hooks/use-services-analytics"
import {
  ShoppingCart, CheckCircle, Clock, Activity,
  AlertTriangle, Star, DollarSign, TrendingUp,
} from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  completed:   "Concluído",
  in_progress: "Em Andamento",
  cancelled:   "Cancelado",
  pending:     "Pendente",
  accepted:    "Aceito",
  assigned:    "Atribuído",
}

const STATUS_COLORS: Record<string, string> = {
  completed:   "bg-emerald-500",
  in_progress: "bg-blue-500",
  cancelled:   "bg-red-500",
  pending:     "bg-amber-500",
  accepted:    "bg-violet-500",
  assigned:    "bg-teal-500",
}

interface StatCardProps {
  label: string
  value: number | string
  icon: typeof ShoppingCart
  iconClass: string
  iconBg: string
}

function StatCard({ label, value, icon: Icon, iconClass, iconBg }: StatCardProps) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-5 w-5", iconClass)} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ServicesAnalytics() {
  const { analytics, loading, error } = useServicesAnalytics()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-4">
                <div className="h-10 w-10 rounded-lg bg-muted animate-skeleton mb-3" />
                <div className="h-3 w-20 rounded bg-muted animate-skeleton mb-2" />
                <div className="h-6 w-12 rounded bg-muted animate-skeleton" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-4">
                <div className="h-16 w-full rounded bg-muted animate-skeleton" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm font-medium text-foreground">Erro ao carregar analytics</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total"      value={analytics.totalServices}     icon={ShoppingCart} iconClass="text-blue-600"    iconBg="bg-blue-50 dark:bg-blue-950/40"    />
        <StatCard label="Concluídos" value={analytics.completedServices} icon={CheckCircle}  iconClass="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" />
        <StatCard label="Ativos"     value={analytics.activeServices}    icon={Activity}     iconClass="text-primary"     iconBg="bg-primary/10"                      />
        <StatCard label="Pendentes"  value={analytics.pendingServices}   icon={Clock}        iconClass="text-amber-600"   iconBg="bg-amber-50 dark:bg-amber-950/40"   />
      </div>

      {/* Financial row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Receita Total"   value={`R$ ${analytics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}   icon={DollarSign}  iconClass="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" />
        <StatCard label="Receita Mensal"  value={`R$ ${analytics.monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}  icon={TrendingUp}  iconClass="text-blue-600"    iconBg="bg-blue-50 dark:bg-blue-950/40"      />
        <StatCard label="Avaliação Média" value={`${Math.round(analytics.averageRating)} ★`}                                              icon={Star}        iconClass="text-amber-600"   iconBg="bg-amber-50 dark:bg-amber-950/40"    />
      </div>

      {/* Status distribution + Top services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" aria-hidden />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {analytics.servicesByStatus.map((s) => (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_COLORS[s.status] ?? "bg-muted-foreground")} />
                      <span className="text-xs font-medium text-foreground">
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">{s.count}</span>
                      <span>{Math.round(s.percentage)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", STATUS_COLORS[s.status] ?? "bg-muted-foreground")}
                      style={{ width: `${Math.min(s.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              Top Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2.5">
              {analytics.topServices.slice(0, 5).map((svc, i) => (
                <div key={svc.serviceType} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground capitalize truncate">
                      {svc.serviceType.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      R$ {svc.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums shrink-0">{svc.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency alert */}
      {analytics.emergencyServices > 0 && (
        <Card className="shadow-card border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">
                {analytics.emergencyServices} serviço{analytics.emergencyServices !== 1 ? "s" : ""} de emergência
              </p>
              <p className="text-xs text-destructive/70 mt-0.5">Requerem atenção imediata</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
