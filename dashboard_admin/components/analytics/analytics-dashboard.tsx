"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirebaseAnalytics } from "@/hooks/use-firebase-analytics"
import { RealtimeDashboard } from "@/components/analytics/realtime-dashboard"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts"
import { TrendingUp, Users, ShoppingCart, CheckCircle, AlertTriangle, Activity, BarChart3, Package } from "lucide-react"

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#ec4899"]

// Pivota a série temporal por data para o LineChart multi-linha
function pivotTimeSeries(data: { date: string; value: number; category: string }[]) {
  const map = new Map<string, Record<string, number>>()
  data.forEach(({ date, value, category }) => {
    if (!map.has(date)) map.set(date, {})
    map.get(date)![category] = value
  })
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      ...vals,
    }))
}

export function AnalyticsDashboard() {
  const { analyticsData, timeSeriesData, topPages, userActivity, loading, error } = useFirebaseAnalytics()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Erro ao carregar dados do analytics: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pivota série temporal para múltiplas linhas no mesmo gráfico
  const timeSeriesPivoted = pivotTimeSeries(timeSeriesData)
  const categories = Array.from(new Set(timeSeriesData.map(d => d.category)))

  // Top serviços (substitui "top pages" — são tipos de serviço reais)
  const topServicesData = topPages.slice(0, 8).map(p => ({
    name: p.page.length > 22 ? p.page.slice(0, 22) + "…" : p.page,
    Pedidos: p.views,
  }))

  // Distribuição por status (para o PieChart)
  const pieData = userActivity.filter(a => a.count > 0).map(a => ({ name: a.action, value: a.count }))

  return (
    <div className="space-y-6">
      <Tabs defaultValue="historical" className="space-y-4">
        <TabsList>
          <TabsTrigger value="historical" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Tempo Real
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historical" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.activeUsers.toLocaleString("pt-BR")}</div>
                <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos (30 dias)</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.orderActions.toLocaleString("pt-BR")}</div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analyticsData.businessEvents.toLocaleString("pt-BR")}</div>
                <p className="text-xs text-muted-foreground">Serviços entregues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prestadores</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.providerActions.toLocaleString("pt-BR")}</div>
                <p className="text-xs text-muted-foreground">Ativos na plataforma</p>
              </CardContent>
            </Card>
          </div>

          {/* Série temporal — multi-linha por status */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos ao Longo do Tempo</CardTitle>
              <CardDescription>Evolução diária por status nos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              {timeSeriesPivoted.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  <ShoppingCart className="h-6 w-6 mr-2 opacity-40" />
                  Nenhum pedido no período
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesPivoted} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      {categories.map((cat, i) => (
                        <Line
                          key={cat}
                          type="monotone"
                          dataKey={cat}
                          stroke={COLORS[i % COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Serviços mais solicitados + Distribuição por status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Mais Solicitados</CardTitle>
                <CardDescription>Top tipos de serviço por volume de pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                {topServicesData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    Nenhum serviço registrado
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topServicesData}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="Pedidos" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>Proporção de pedidos por status atual</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    Nenhum dado disponível
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          innerRadius={40}
                          dataKey="value"
                          nameKey="name"
                          labelLine={false}
                          label={(props: Record<string, unknown>) => {
                            const percent = props.percent as number | undefined
                            if ((percent ?? 0) < 0.05) return null
                            const RADIAN = Math.PI / 180
                            const cx = props.cx as number
                            const cy = props.cy as number
                            const midAngle = props.midAngle as number
                            const innerR = props.innerRadius as number
                            const outerR = props.outerRadius as number
                            const radius = innerR + (outerR - innerR) * 0.5
                            const x = cx + radius * Math.cos(-midAngle * RADIAN)
                            const y = cy + radius * Math.sin(-midAngle * RADIAN)
                            return (
                              <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
                                {`${((percent ?? 0) * 100).toFixed(0)}%`}
                              </text>
                            )
                          }}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo de operações */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações Financeiras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analyticsData.financialActions.toLocaleString("pt-BR")}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Pedidos concluídos com pagamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Operações com Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analyticsData.orderActions.toLocaleString("pt-BR")}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Total de pedidos nos últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taxa de Conclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {analyticsData.orderActions > 0
                    ? `${((analyticsData.businessEvents / analyticsData.orderActions) * 100).toFixed(1)}%`
                    : "—"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Pedidos concluídos / total</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <RealtimeDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
