"use client"

import { AlertCircle, CreditCard, DollarSign, Loader2, PieChart, TrendingUp, RefreshCw } from "lucide-react"
import { RouteGuard } from "@/components/auth/route-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePagarmeAnalytics } from "@/hooks/use-pagarme-analytics"
import { cn } from "@/lib/utils"

export default function FinanceiroPage() {
  const {
    totalRevenue,
    totalTransactions,
    successRate,
    conversionRate,
    paymentMethods,
    recentCharges,
    loading,
    error,
    warning,
    refetch,
  } = usePagarmeAnalytics()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100)

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  return (
    <RouteGuard requiredPermission="financeiro">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Financeiro</h1>
              <p className="text-sm text-muted-foreground">Dados financeiros via Pagar.me</p>
            </div>
          </div>
          {!loading && (
            <Button variant="outline" size="sm" onClick={() => refetch?.()}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Atualizar
            </Button>
          )}
        </div>

        {/* Warning */}
        {warning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {warning}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-5">
                  <div className="h-4 w-24 rounded bg-muted animate-skeleton mb-3" />
                  <div className="h-7 w-20 rounded bg-muted animate-skeleton" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="shadow-card">
            <CardContent className="py-16 text-center">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Erro ao carregar dados financeiros</p>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <Button size="sm" onClick={() => refetch?.()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Receita Total",     value: formatCurrency(totalRevenue),       icon: DollarSign,  iconBg: "bg-emerald-50 dark:bg-emerald-950/40", iconCl: "text-emerald-600", sub: "Últimos 30 dias"       },
                { label: "Transações",        value: totalTransactions,                  icon: CreditCard,  iconBg: "bg-blue-50 dark:bg-blue-950/40",       iconCl: "text-blue-600",    sub: "Últimos 30 dias"       },
                { label: "Taxa de Sucesso",   value: formatPercentage(successRate),      icon: TrendingUp,  iconBg: "bg-primary/10",                        iconCl: "text-primary",     sub: "Transações aprovadas"  },
                { label: "Conversão",         value: formatPercentage(conversionRate),   icon: PieChart,    iconBg: "bg-violet-50 dark:bg-violet-950/40",   iconCl: "text-violet-600",  sub: "Taxa de conversão"     },
              ].map(({ label, value, icon: Icon, iconBg, iconCl, sub }) => (
                <Card key={label} className="shadow-card hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-xs font-medium text-muted-foreground leading-snug">{label}</p>
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                        <Icon className={cn("h-4 w-4", iconCl)} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Payment methods */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Métodos de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Cartão de Crédito", value: paymentMethods.credit_card },
                    { label: "Cartão de Débito",  value: paymentMethods.debit_card  },
                    { label: "PIX",               value: paymentMethods.pix          },
                    { label: "Boleto",            value: paymentMethods.boleto       },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent charges */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Cobranças Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentCharges.length > 0 ? (
                    <div className="space-y-2">
                      {recentCharges.slice(0, 5).map((charge, i) => (
                        <div key={charge.id || i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                          <div>
                            <p className="text-xs font-mono font-medium text-foreground">#{charge.id?.slice(-8)}</p>
                            <p className="text-xs text-muted-foreground capitalize">{charge.status}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {formatCurrency(charge.amount || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma cobrança encontrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </RouteGuard>
  )
}
