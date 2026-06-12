"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FirestoreAnalyticsService } from "@/lib/services/firestore-analytics-simple"
import { useEffect, useState } from "react"
import { Users, UserCheck, UserX, Shield, UserCog, Activity, AlertCircle, TrendingUp } from "lucide-react"

interface UserManagementDashboardProps {
  filters?: {
    role?: string
    status?: string
    search?: string
  }
}

export function UserManagementDashboard({ filters }: UserManagementDashboardProps) {
  const [firestoreData, setFirestoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await FirestoreAnalyticsService.getDashboardMetrics()
        setFirestoreData(data)
      } catch (err) {
        console.error('Erro ao buscar dados de usuarios:', err)
        setError('Erro ao carregar dados de usuarios')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filters?.role, filters?.search, filters?.status])

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
      </div>
    )
  }

  if (error || !firestoreData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar dados: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalUsers = firestoreData?.users?.totalUsers || 0
  const activeUsers = firestoreData?.users?.activeUsers || 0
  const blockedUsers = firestoreData?.users?.blockedUsers || 0
  const inactiveUsers = Math.max(totalUsers - activeUsers, 0)
  const roleCounts = firestoreData?.users?.roleCounts || {}
  const safePercent = (value: number) => (totalUsers > 0 ? ((value / totalUsers) * 100).toFixed(1) : '0.0')

  const stats = {
    total: totalUsers,
    ativos: activeUsers,
    inativos: inactiveUsers,
    clientes: roleCounts.client || 0,
    prestadores: roleCounts.provider || 0,
    admins: roleCounts.admin || 0,
    operadores: roleCounts.operator || 0,
    novosHoje: firestoreData?.users?.newUsersToday || 0,
    onlineHoje: firestoreData?.users?.onlineUsersToday || 0,
    bloqueados: blockedUsers,
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">+{stats.novosHoje} novos hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground">{stats.onlineHoje} online hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <UserCog className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.clientes}</div>
            <p className="text-xs text-muted-foreground">{safePercent(stats.clientes)}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestadores</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.prestadores}</div>
            <p className="text-xs text-muted-foreground">{safePercent(stats.prestadores)}% do total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Status dos Usuarios</span>
            </CardTitle>
            <CardDescription>Distribuicao por status de atividade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ativos</span>
                <Badge variant="outline">{stats.ativos} ({safePercent(stats.ativos)}%)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inativos</span>
                <Badge variant="outline">{stats.inativos} ({safePercent(stats.inativos)}%)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bloqueados</span>
                <Badge variant="outline">{stats.bloqueados} ({safePercent(stats.bloqueados)}%)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCog className="h-5 w-5" />
              <span>Distribuicao por Funcao</span>
            </CardTitle>
            <CardDescription>Usuarios por tipo de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm">Clientes</span><Badge variant="outline">{stats.clientes}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-sm">Prestadores</span><Badge variant="outline">{stats.prestadores}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-sm">Administradores</span><Badge variant="outline">{stats.admins}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-sm">Operadores</span><Badge variant="outline">{stats.operadores}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Atividade Recente</span>
          </CardTitle>
          <CardDescription>Resumo das atividades dos usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.novosHoje}</div>
              <p className="text-sm font-medium">Novos Hoje</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.onlineHoje}</div>
              <p className="text-sm font-medium">Online Hoje</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{safePercent(stats.ativos)}%</div>
              <p className="text-sm font-medium">Taxa de Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
