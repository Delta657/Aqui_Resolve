"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirebaseAnalytics } from "@/hooks/use-firebase-analytics"
import { RealtimeDashboard } from "@/components/analytics/realtime-dashboard"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, Eye, MousePointer, FileText, AlertTriangle, Activity, BarChart3 } from "lucide-react"

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
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
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

  // Preparar dados para os gráficos
  const pageViewsData = timeSeriesData
    .filter(item => item.category === 'pageViews')
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      value: item.value
    }))

  const userActionsData = timeSeriesData
    .filter(item => item.category === 'userActions')
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      value: item.value
    }))

  const topPagesData = topPages.slice(0, 5).map(page => ({
    name: page.page.length > 20 ? page.page.substring(0, 20) + '...' : page.page,
    views: page.views
  }))

  const userActivityData = userActivity.slice(0, 5).map(activity => ({
    name: activity.action.length > 15 ? activity.action.substring(0, 15) + '...' : activity.action,
    count: activity.count,
    category: activity.category
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

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
          {/* Métricas principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.activeUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.pageViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Páginas visualizadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ações de Usuário</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.userActions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Interações registradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventos de Negócio</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.businessEvents.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Eventos importantes</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de visualizações ao longo do tempo */}
            <Card>
              <CardHeader>
                <CardTitle>Visualizações ao Longo do Tempo</CardTitle>
                <CardDescription>Evolução das visualizações de página</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pageViewsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de ações de usuário */}
            <Card>
              <CardHeader>
                <CardTitle>Ações de Usuário</CardTitle>
                <CardDescription>Evolução das interações do usuário</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userActionsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Páginas mais visitadas e atividades */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Páginas Mais Visitadas</CardTitle>
                <CardDescription>Top 5 páginas com mais visualizações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPagesData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="views" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividades Mais Comuns</CardTitle>
                <CardDescription>Top 5 ações realizadas pelos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userActivityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {userActivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo de eventos */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Financeiras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analyticsData.financialActions.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Transações processadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analyticsData.orderActions.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Operações com pedidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Relatórios Gerados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {analyticsData.reportsGenerated.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Documentos criados</p>
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
