"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, CreditCard, Percent, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { usePagarmeAnalytics, usePagarmeBalance } from "@/hooks/use-pagarme"
import { PagarmeService } from "@/lib/services/pagarme-service"

const revenueData = [
  { month: "Jan", receita: 85000, comissoes: 8500 },
  { month: "Fev", receita: 92000, comissoes: 9200 },
  { month: "Mar", receita: 127450, comissoes: 12745 },
  { month: "Abr", receita: 98000, comissoes: 9800 },
  { month: "Mai", receita: 115000, comissoes: 11500 },
  { month: "Jun", receita: 134000, comissoes: 13400 },
]

export function FinancialDashboard() {
  // Buscar dados do mês atual
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const { analytics, loading: analyticsLoading, error: analyticsError, refetch } = usePagarmeAnalytics(
    firstDayOfMonth,
    lastDayOfMonth
  )
  
  const { balance, loading: balanceLoading } = usePagarmeBalance(true) // Auto-refresh

  const loading = analyticsLoading || balanceLoading

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-skeleton rounded" />
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-skeleton rounded mb-2" />
                <div className="h-3 w-16 bg-muted animate-skeleton rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (analyticsError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive text-sm mb-4">Erro ao carregar dados financeiros: {analyticsError}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  // Calcular métricas
  const totalAmount = analytics?.total_amount || 0
  const totalOrders = analytics?.total_orders || 0
  const totalCustomers = analytics?.total_customers || 0
  const paidOrders = analytics?.status_breakdown?.paid || 0
  const successRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0

  // Saldo disponível
  const availableBalance = balance?.available_amount || 0
  const waitingFunds = balance?.waiting_funds_amount || 0

  const financialMetrics: Array<{ title: string; value: string; change: string; changeType: "positive" | "neutral" | "negative"; icon: React.ComponentType<{ className?: string }>; description: string }> = [
    {
      title: "Receita Total",
      value: PagarmeService.formatCurrency(PagarmeService.fromCents(totalAmount)),
      change: "+15.2%",
      changeType: "positive" as const,
      icon: DollarSign,
      description: "Este mês",
    },
    {
      title: "Saldo Disponível",
      value: PagarmeService.formatCurrency(PagarmeService.fromCents(availableBalance)),
      change: PagarmeService.formatCurrency(PagarmeService.fromCents(waitingFunds)),
      changeType: "neutral" as const,
      icon: DollarSign,
      description: "A liberar",
    },
    {
      title: "Transações",
      value: totalOrders.toLocaleString(),
      change: `${totalCustomers} clientes`,
      changeType: "positive" as const,
      icon: CreditCard,
      description: "Este mês",
    },
    {
      title: "Taxa de Sucesso",
      value: `${successRate.toFixed(1)}%`,
      change: `${paidOrders}/${totalOrders}`,
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "Pagamentos aprovados",
    },
  ]

  // Dados dos métodos de pagamento
  const paymentMethodsData = [
    { 
      name: "PIX", 
      value: analytics?.payment_methods?.pix || 0, 
      color: "#2196F3" 
    },
    { 
      name: "Cartão de Crédito", 
      value: analytics?.payment_methods?.credit_card || 0, 
      color: "#4CAF50" 
    },
    { 
      name: "Cartão de Débito", 
      value: analytics?.payment_methods?.debit_card || 0, 
      color: "#FF9800" 
    },
    { 
      name: "Boleto", 
      value: analytics?.payment_methods?.boleto || 0, 
      color: "#9C27B0" 
    },
  ].filter(item => item.value > 0) // Mostrar apenas métodos utilizados

  return (
    <div className="space-y-6">
      {/* Header com botão de atualizar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Métricas Financeiras</h2>
          <p className="text-sm text-muted-foreground">Dados do Pagar.me em tempo real</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialMetrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground tabular-nums">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs">
                <span
                  className={`font-medium flex items-center gap-1 ${
                    metric.changeType === "positive" 
                      ? "text-green-600" 
                      : metric.changeType === "negative"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {metric.changeType === "positive" && <ArrowUpRight className="h-3 w-3" />}
                  {metric.changeType === "negative" && <ArrowDownRight className="h-3 w-3" />}
                  {metric.change}
                </span>
                <span className="text-muted-foreground">{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita e Comissões</CardTitle>
            <CardDescription>Evolução mensal da receita total e comissões geradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, ""]} />
                <Line type="monotone" dataKey="receita" stroke="#2196F3" strokeWidth={2} name="Receita Total" />
                <Line type="monotone" dataKey="comissoes" stroke="#4CAF50" strokeWidth={2} name="Comissões" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        {paymentMethodsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Distribuição por tipo de pagamento este mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} transações`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pedidos</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Pagos</span>
                <span className="text-sm font-bold text-green-600">
                  {analytics?.status_breakdown?.paid || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Pendentes</span>
                <span className="text-sm font-bold text-orange-600">
                  {analytics?.status_breakdown?.pending || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Falhados</span>
                <span className="text-sm font-bold text-red-600">
                  {analytics?.status_breakdown?.failed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Cancelados</span>
                <span className="text-sm font-bold text-muted-foreground">
                  {analytics?.status_breakdown?.canceled || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
