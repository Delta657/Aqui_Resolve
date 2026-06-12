"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePagarmeBalance, usePagarmeAnalytics, usePagarmeCharges } from "@/hooks/use-pagarme"
import { PagarmeService } from "@/lib/services/pagarme-service"

export function RevenueControlDashboard() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month")

  const now = new Date()
  const startDate = new Date(now)

  if (period === "week") {
    startDate.setDate(now.getDate() - 7)
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1)
  } else {
    startDate.setFullYear(now.getFullYear() - 1)
  }

  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = now.toISOString().split("T")[0]

  const {
    balance,
    loading: balanceLoading,
    warning: balanceWarning,
    refetch: refetchBalance,
  } = usePagarmeBalance(true)
  const {
    analytics,
    loading: analyticsLoading,
    warning: analyticsWarning,
    refetch: refetchAnalytics,
  } = usePagarmeAnalytics(startDateStr, endDateStr)
  const {
    charges,
    loading: chargesLoading,
    warning: chargesWarning,
  } = usePagarmeCharges({
    status: "paid",
    autoRefresh: true,
  })

  const loading = balanceLoading || analyticsLoading || chargesLoading
  const warnings = useMemo(
    () => Array.from(new Set([balanceWarning, analyticsWarning, chargesWarning].filter(Boolean) as string[])),
    [analyticsWarning, balanceWarning, chargesWarning]
  )

  const handleRefresh = () => {
    void refetchBalance()
    void refetchAnalytics()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Carregando dados financeiros...</span>
        </div>
      </div>
    )
  }

  const availableBalance = balance?.available_amount || 0
  const waitingFunds = balance?.waiting_funds_amount || 0
  const totalTransferred = balance?.transferred_amount || 0
  const totalReceived = analytics?.total_amount || 0
  const paidOrders = analytics?.status_breakdown?.paid || 0
  const totalOrders = analytics?.total_orders || 0
  const successRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0
  const nextReceivable = waitingFunds
  const periodText = period === "week" ? "Ultimos 7 dias" : period === "month" ? "Ultimo mes" : "Ultimo ano"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Controle de Recebimentos</h2>
          <p className="text-sm text-muted-foreground">Dados reais do Pagar.me</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button variant={period === "week" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("week")}>
              7 dias
            </Button>
            <Button variant={period === "month" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("month")}>
              30 dias
            </Button>
            <Button variant={period === "year" ? "default" : "ghost"} size="sm" onClick={() => setPeriod("year")}>
              1 ano
            </Button>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {warnings.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 text-amber-900">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">Aviso da integracao financeira</p>
                {warnings.map((warning) => (
                  <p key={warning} className="text-sm text-amber-800">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Disponivel</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {PagarmeService.formatCurrency(PagarmeService.fromCents(availableBalance))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pode sacar agora</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {PagarmeService.formatCurrency(PagarmeService.fromCents(nextReceivable))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Proximos dias</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recebido ({periodText})</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {PagarmeService.formatCurrency(PagarmeService.fromCents(totalReceived))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{paidOrders} pagamentos aprovados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ja Transferido</CardTitle>
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {PagarmeService.formatCurrency(PagarmeService.fromCents(totalTransferred))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total historico</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recebimentos por Metodo ({periodText})</CardTitle>
            <CardDescription>Distribuicao dos pagamentos aprovados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">PIX</p>
                    <p className="text-sm text-muted-foreground">{analytics?.payment_methods?.pix || 0} transacoes</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{analytics?.payment_methods?.pix || 0}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Cartao de Credito</p>
                    <p className="text-sm text-muted-foreground">{analytics?.payment_methods?.credit_card || 0} transacoes</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">{analytics?.payment_methods?.credit_card || 0}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Cartao de Debito</p>
                    <p className="text-sm text-muted-foreground">{analytics?.payment_methods?.debit_card || 0} transacoes</p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-800">{analytics?.payment_methods?.debit_card || 0}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Boleto</p>
                    <p className="text-sm text-muted-foreground">{analytics?.payment_methods?.boleto || 0} transacoes</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">{analytics?.payment_methods?.boleto || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatisticas de Pagamento</CardTitle>
            <CardDescription>Desempenho e aprovacao</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Taxa de Aprovacao</span>
                  <span className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${successRate}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{paidOrders} de {totalOrders} pagamentos aprovados</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-900">Pagos</span>
                  <span className="text-lg font-bold text-green-700">{analytics?.status_breakdown?.paid || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-900">Pendentes</span>
                  <span className="text-lg font-bold text-orange-700">{analytics?.status_breakdown?.pending || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-900">Falhados</span>
                  <span className="text-lg font-bold text-red-700">{analytics?.status_breakdown?.failed || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ultimos Recebimentos</CardTitle>
              <CardDescription>Transacoes pagas recentemente</CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {charges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum recebimento real encontrado</p>
              <p className="text-sm">{warnings[0] || "Os pagamentos aprovados aparecerao aqui quando a fonte financeira retornar dados reais."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {charges.slice(0, 5).map((charge) => (
                <div
                  key={charge.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{charge.customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(charge.created_at).toLocaleDateString("pt-BR")} as {new Date(charge.created_at).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {PagarmeService.formatCurrency(PagarmeService.fromCents(charge.amount))}
                    </p>
                    <Badge className="bg-green-100 text-green-800">
                      {charge.payment_method === "pix"
                        ? "PIX"
                        : charge.payment_method === "credit_card"
                          ? "Cartao"
                          : charge.payment_method === "boleto"
                            ? "Boleto"
                            : charge.payment_method}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
