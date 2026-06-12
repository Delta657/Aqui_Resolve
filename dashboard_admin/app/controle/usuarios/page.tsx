"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagementDashboard } from "@/components/users/user-management-dashboard"
import { UsersTable } from "@/components/users/users-table"
import { useUsers } from "@/hooks/use-users"
import { useAnalytics } from "@/hooks/use-analytics"
import { useEffect, useMemo, useState } from "react"
import { Plus, Users, UserCheck, Shield } from "lucide-react"
import { isClientUser, isProviderUser } from "@/lib/user-schema"

export default function UsuariosPage() {
  const { users, loading, deleteUser, toggleUserStatus, blockUser, unblockUser } = useUsers()
  const { trackPageView, trackUserAction } = useAnalytics()
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    trackPageView('Gestao de Usuarios')
  }, [trackPageView])

  const clients = useMemo(() => users.filter((user) => isClientUser(user as unknown as Record<string, unknown>)), [users])
  const providers = useMemo(() => users.filter((user) => isProviderUser(user as unknown as Record<string, unknown>)), [users])

  const handleDelete = async (userId: string) => {
    trackUserAction('deletar_usuario', 'usuarios', { userId })
    if (confirm('Tem certeza que deseja deletar este usuario?')) {
      await deleteUser(userId)
    }
  }

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    trackUserAction('alterar_status_usuario', 'usuarios', { userId, isActive })
    await toggleUserStatus(userId, isActive)
  }

  const handleBlock = async (userId: string) => {
    trackUserAction('bloquear_usuario', 'usuarios', { userId })
    if (confirm('Tem certeza que deseja bloquear este usuario?')) {
      await blockUser(userId)
    }
  }

  const handleUnblock = async (userId: string) => {
    trackUserAction('desbloquear_usuario', 'usuarios', { userId })
    await unblockUser(userId)
  }

  const handleView = (userId: string) => {
    trackUserAction('visualizar_usuario', 'usuarios', { userId })
  }

  const handleEdit = (userId: string) => {
    trackUserAction('editar_usuario', 'usuarios', { userId })
  }

  const handleNewUser = () => {
    trackUserAction('novo_usuario', 'usuarios')
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestao de Usuarios</h1>
            <p className="text-muted-foreground">Gerenciamento completo de usuarios do sistema</p>
          </div>
          <Button onClick={handleNewUser} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuario
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="prestadores" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Prestadores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <UserManagementDashboard />
          </TabsContent>

          <TabsContent value="clientes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes</CardTitle>
                <p className="text-sm text-muted-foreground">Gerenciamento de clientes do sistema</p>
              </CardHeader>
            </Card>
            <UsersTable
              users={clients}
              loading={loading}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onView={handleView}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="prestadores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prestadores</CardTitle>
                <p className="text-sm text-muted-foreground">Gerenciamento de prestadores de servico</p>
              </CardHeader>
            </Card>
            <UsersTable
              users={providers}
              loading={loading}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onView={handleView}
              onEdit={handleEdit}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
