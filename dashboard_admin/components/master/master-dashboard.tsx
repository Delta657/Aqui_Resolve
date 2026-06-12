"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useMasterAuth } from "@/hooks/use-master-auth"
import type { MasterUser } from "@/lib/services/admin-master-service"
import { Logo } from "@/components/logo"
import {
  Users,
  Plus,
  Save,
  Edit,
  Trash2,
  Shield,
  LogOut,
  User,
  Mail,
  Settings,
  LayoutDashboard,
  MousePointer,
  ShoppingCart,
  DollarSign,
  BarChart3,
  CheckCircle,
  X,
  Key,
} from "lucide-react"

// Força renderização dinâmica dessa árvore
export const dynamic = 'force-dynamic'
export const revalidate = 0

export function MasterDashboard() {
  const { 
    masterUser, 
    masterLogout, 
    usuarios, 
    addUsuario, 
    updateUsuario, 
    deleteUsuario,
    changeUserPassword,
    loading 
  } = useMasterAuth()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<MasterUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    password: "",
    permissoes: {
      dashboard: false,
      controle: false,
      gestaoUsuarios: false,
      gestaoPedidos: false,
      financeiro: false,
      relatorios: false,
      configuracoes: false
    }
  })
  const [tempPermissions, setTempPermissions] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleAddUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.password) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    // Verificar se pelo menos uma permissão foi selecionada
    const hasPermissions = Object.values(newUser.permissoes).some(Boolean)
    if (!hasPermissions) {
      setError('Selecione pelo menos uma permissão para o usuário')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const resp = await fetch('/api/adminmaster/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newUser.nome,
          email: newUser.email,
          password: newUser.password,
          permissoes: newUser.permissoes,
        })
      })

      const data = await resp.json()
      
      if (!resp.ok) {
        throw new Error(data.error || 'Falha ao criar usuário')
      }

      setSuccess('Usuário criado com sucesso!')
      // Recarregar lista de usuários imediatamente
      try {
        await fetch('/master', { cache: 'no-store' })
        // opção preferível: chamar refreshUsuarios do contexto
        if (typeof window !== 'undefined') {
          // forçar revalidação do hook de autenticação master
          const event = new CustomEvent('refresh-master-usuarios')
          window.dispatchEvent(event)
        }
      } catch (_) {}
      setNewUser({
        nome: "",
        email: "",
        password: "",
        permissoes: {
          dashboard: false,
          controle: false,
          gestaoUsuarios: false,
          gestaoPedidos: false,
          financeiro: false,
          relatorios: false,
          configuracoes: false
        }
      })
      
      // Fechar modal após 1 segundo
      setTimeout(() => {
        setIsAddModalOpen(false)
        setSuccess(null)
      }, 1000)

    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error)
      setError(error.message || 'Erro ao criar usuário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (userId: string) => {
    try {
      await updateUsuario(userId, tempPermissions[userId])
      setEditingUser(null)
      setTempPermissions({})
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        await deleteUsuario(userId)
      } catch (error) {
        console.error('Erro ao deletar usuário:', error)
      }
    }
  }

  const handleChangePassword = async () => {
    if (!selectedUser) return

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsChangingPassword(true)
    setError(null)
    setSuccess(null)

    try {
      await changeUserPassword(selectedUser.id, newPassword)
      setSuccess('Senha alterada com sucesso!')
      
      // Limpar campos e fechar modal
      setNewPassword("")
      setConfirmPassword("")
      setSelectedUser(null)
      
      setTimeout(() => {
        setIsPasswordModalOpen(false)
        setSuccess(null)
      }, 1500)
    } catch (error: any) {
      setError(error.message || 'Erro ao alterar senha')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const openPasswordModal = (user: MasterUser) => {
    setSelectedUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
    setSuccess(null)
    setIsPasswordModalOpen(true)
  }

  const startEditing = (user: any) => {
    setEditingUser(user.id)
    setTempPermissions({
      [user.id]: { ...user.permissoes }
    })
  }

  const updatePermission = (userId: string, permission: string, value: boolean) => {
    setTempPermissions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [permission]: value
      }
    }))
  }

  const updateNewUserPermission = (permission: string, value: boolean) => {
    setNewUser(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [permission]: value
      }
    }))
  }

  const permissionLabels = {
    dashboard: "Dashboard",
    controle: "Controle",
    gestaoUsuarios: "Gestão de Usuários",
    gestaoPedidos: "Gestão de Pedidos",
    financeiro: "Financeiro",
    relatorios: "Relatórios",
    configuracoes: "Configurações"
  }

  const permissionTemplates = {
    admin: {
      name: "Administrador Completo",
      description: "Acesso total ao sistema",
      permissions: {
        dashboard: true,
        controle: true,
        gestaoUsuarios: true,
        gestaoPedidos: true,
        financeiro: true,
        relatorios: true,
        configuracoes: true
      }
    },
    manager: {
      name: "Gerente",
      description: "Acesso a gestão e relatórios",
      permissions: {
        dashboard: true,
        controle: true,
        gestaoUsuarios: false,
        gestaoPedidos: true,
        financeiro: true,
        relatorios: true,
        configuracoes: false
      }
    },
    operator: {
      name: "Operador",
      description: "Acesso básico ao sistema",
      permissions: {
        dashboard: true,
        controle: true,
        gestaoUsuarios: false,
        gestaoPedidos: true,
        financeiro: false,
        relatorios: false,
        configuracoes: false
      }
    },
    viewer: {
      name: "Visualizador",
      description: "Apenas visualização",
      permissions: {
        dashboard: true,
        controle: false,
        gestaoUsuarios: false,
        gestaoPedidos: false,
        financeiro: false,
        relatorios: true,
        configuracoes: false
      }
    }
  }

  const permissionIcons = {
    dashboard: LayoutDashboard,
    controle: MousePointer,
    gestaoUsuarios: Users,
    gestaoPedidos: ShoppingCart,
    financeiro: DollarSign,
    relatorios: BarChart3,
    configuracoes: Settings
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ borderBottom: '2px solid #F7931E', borderLeft: '2px solid #F7931E', borderRight: '2px solid #F7931E', borderTop: '2px solid transparent' }}></div>
          <p style={{ color: '#1F2B3D' }}>Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="shadow-sm" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Logo className="h-6 sm:h-8" showText={true} />
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" style={{ color: '#F7931E' }} />
                <span className="text-sm sm:text-lg font-semibold truncate" style={{ color: '#203864' }}>
                  Área Master
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium truncate max-w-32" style={{ color: '#1F2B3D' }}>
                  {masterUser?.nome}
                </p>
                <p className="text-xs truncate max-w-32" style={{ color: '#6B7280' }}>
                  {masterUser?.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={masterLogout}
                className="hover:opacity-90 text-xs sm:text-sm"
                style={{ color: '#1F2B3D', borderColor: '#E5E7EB' }}
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#1F2B3D' }}>
            Gestão de Usuários e Permissões
          </h1>
          <p className="text-sm sm:text-base" style={{ color: '#6B7280' }}>
            Configure as permissões de acesso para cada usuário do sistema
          </p>
        </div>

        {/* Add User Button */}
        <div className="mb-6">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="text-white" style={{ backgroundColor: '#F7931E' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E67E00')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F7931E')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden bg-card shadow-2xl border-2 border-border rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl" style={{ color: '#1F2B3D' }}>Adicionar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto px-1">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center">
                      <X className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-red-800">{error}</span>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-green-800">{success}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="nome" style={{ color: '#1F2B3D' }}>Nome</Label>
                  <Input
                    id="nome"
                    value={newUser.nome}
                    onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                    placeholder="Nome completo"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#1F2B3D' }}
                  />
                </div>
                <div>
                  <Label htmlFor="email" style={{ color: '#1F2B3D' }}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#1F2B3D' }}
                  />
                </div>
                <div>
                  <Label htmlFor="password" style={{ color: '#1F2B3D' }}>Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Defina uma senha segura"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#1F2B3D' }}
                  />
                      </div>
                <div>
                  <Label style={{ color: '#1F2B3D' }}>Tipo de Usuário</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-4">
                    {Object.entries(permissionTemplates).map(([key, template]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setNewUser(prev => ({
                            ...prev,
                            permissoes: template.permissions
                          }))
                        }}
                        className="flex flex-col items-start p-3 rounded-md border text-left focus:outline-none focus:ring-2 transition-colors hover:opacity-90 bg-card border-border hover:border-primary"
                      >
                        <span className="font-medium text-sm" style={{ color: '#1F2B3D' }}>
                          {template.name}
                        </span>
                        <span className="text-xs" style={{ color: '#6B7280' }}>
                          {template.description}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: '#F0F9FF', border: '1px solid #E0F2FE' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: '#1F2B3D' }}>
                        Permissões Selecionadas
                      </span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        {Object.values(newUser.permissoes).filter(Boolean).length} de {Object.keys(newUser.permissoes).length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(newUser.permissoes)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: '#F7931E', color: '#FFFFFF' }}
                          >
                            {permissionLabels[key as keyof typeof permissionLabels]}
                          </span>
                        ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label style={{ color: '#1F2B3D' }}>Permissões Detalhadas</Label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewUser(prev => ({
                            ...prev,
                            permissoes: {
                              dashboard: true,
                              controle: true,
                              gestaoUsuarios: true,
                              gestaoPedidos: true,
                              financeiro: true,
                              relatorios: true,
                              configuracoes: true
                            }
                          }))
                        }}
                        className="text-xs px-2 py-1 rounded border hover:bg-muted/50"
                        style={{ borderColor: '#E5E7EB', color: '#1F2B3D' }}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewUser(prev => ({
                            ...prev,
                            permissoes: {
                              dashboard: false,
                              controle: false,
                              gestaoUsuarios: false,
                              gestaoPedidos: false,
                              financeiro: false,
                              relatorios: false,
                              configuracoes: false
                            }
                          }))
                        }}
                        className="text-xs px-2 py-1 rounded border hover:bg-muted/50"
                        style={{ borderColor: '#E5E7EB', color: '#1F2B3D' }}
                      >
                        Nenhuma
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    {Object.entries(permissionLabels).map(([key, label]) => {
                      const checked = Boolean(newUser.permissoes[key as keyof typeof newUser.permissoes])
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateNewUserPermission(key, !checked)}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-3 border text-left focus:outline-none focus:ring-2 transition-colors hover:opacity-90 min-h-[48px] ${
                            checked ? 'bg-[#FEECDC] border-[#F7931E]' : 'bg-white border-[#E5E7EB] hover:border-[#F7931E]'
                          }`}
                          aria-pressed={checked}
                        >
                          <span className="text-sm font-medium" style={{ color: '#1F2B3D' }}>{label}</span>
                          <span
                            aria-hidden
                            className={`inline-block h-5 w-9 rounded-full transition-colors shrink-0 ${
                              checked ? 'bg-[#F7931E]' : 'bg-[#E5E7EB]'
                            }`}
                          >
                            <span
                              className={`block h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
                                checked ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setError(null)
                      setSuccess(null)
                    }} 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto min-h-[44px]"
                    style={{ borderColor: '#E5E7EB', color: '#1F2B3D' }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddUser} 
                    disabled={isSubmitting}
                    className="text-white w-full sm:w-auto min-h-[44px]" 
                    style={{ backgroundColor: isSubmitting ? '#9CA3AF' : '#F7931E' }}
                    onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#E67E00')} 
                    onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#F7931E')}
                  >
                    {isSubmitting ? 'Criando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users List */}
        <div className="grid gap-4 sm:gap-6">
          {usuarios.map((user) => (
            <Card key={user.id} className="shadow-lg border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' }}>
              <CardHeader style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEECDC' }}>
                      <User className="h-5 w-5" style={{ color: '#F7931E' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate" style={{ color: '#1F2B3D' }}>{user.nome}</CardTitle>
                      <div className="flex items-center space-x-1 text-xs sm:text-sm" style={{ color: '#6B7280' }}>
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 flex-wrap gap-2">
                    {editingUser === user.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateUser(user.id)}
                          className="text-white text-xs sm:text-sm min-h-[36px] px-3"
                          style={{ backgroundColor: '#22C55E' }}
                        >
                          <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Salvar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(null)
                            setTempPermissions({})
                          }}
                          className="text-xs sm:text-sm min-h-[36px] px-3"
                          style={{ borderColor: '#E5E7EB', color: '#1F2B3D' }}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(user)}
                          className="text-xs sm:text-sm min-h-[36px] px-3"
                          style={{ borderColor: '#E5E7EB', color: '#1F2B3D' }}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPasswordModal(user)}
                          className="text-xs sm:text-sm min-h-[36px] px-3"
                          style={{ borderColor: '#E5E7EB', color: '#1F2B3D' }}
                        >
                          <Key className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Senha</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm min-h-[36px] px-3"
                              style={{ borderColor: '#FCA5A5' }}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card shadow-2xl border-2 border-border rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Remover usuário?</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Esta ação não pode ser desfeita. O usuário será removido da lista de permissões da Área Master.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteUser(user.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Resumo das permissões */}
                <div className="mb-4 p-4 rounded-lg border-2" style={{ backgroundColor: '#F8FAFC', border: '2px solid #E2E8F0' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>
                      Permissões Ativas
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#F7931E', color: '#FFFFFF' }}>
                      {Object.values(user.permissoes).filter(Boolean).length} de {Object.keys(user.permissoes).length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(user.permissoes)
                      .filter(([_, value]) => value)
                      .map(([key, _]) => (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                          style={{ backgroundColor: '#F7931E', color: '#FFFFFF' }}
                        >
                          {permissionLabels[key as keyof typeof permissionLabels]}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(permissionLabels).map(([key, label]) => {
                    const Icon = permissionIcons[key as keyof typeof permissionIcons]
                    const isChecked = editingUser === user.id 
                      ? tempPermissions[user.id]?.[key] ?? user.permissoes[key as keyof typeof user.permissoes]
                      : user.permissoes[key as keyof typeof user.permissoes]
                    
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => editingUser === user.id && updatePermission(user.id, key, !isChecked)}
                        className={`flex items-center justify-between rounded-lg px-4 py-4 border-2 text-left w-full transition-all duration-200 min-h-[52px] ${
                          isChecked ? 'bg-[#FEF3C7] border-[#F7931E] shadow-md' : 'bg-white border-[#D1D5DB] hover:border-[#9CA3AF]'
                        } ${editingUser !== user.id ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                        aria-pressed={isChecked}
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Icon className="h-4 w-4 shrink-0" style={{ color: '#6B7280' }} />
                          <span className="text-sm font-medium truncate" style={{ color: '#1F2B3D' }}>{label}</span>
                        </div>
                        <span
                          aria-hidden
                          className={`inline-block h-5 w-9 rounded-full transition-colors shrink-0 ${
                            isChecked ? 'bg-[#F7931E]' : 'bg-[#E5E7EB]'
                          }`}
                        >
                          <span
                            className={`block h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
                              isChecked ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usuarios.length === 0 && (
          <Card className="text-center py-12 border-2 border-dashed shadow-lg" style={{ backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' }}>
            <CardContent>
              <Users className="h-16 w-16 mx-auto mb-6" style={{ color: '#6B7280' }} />
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1E293B' }}>
                Nenhum usuário cadastrado
              </h3>
              <p className="mb-6 max-w-md mx-auto" style={{ color: '#64748B' }}>
                Comece adicionando usuários para gerenciar suas permissões e controlar o acesso ao sistema
              </p>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="text-white px-6 py-3"
                size="lg"
                style={{ backgroundColor: '#F7931E' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E67E00')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F7931E')}
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Primeiro Usuário
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modal de Alteração de Senha */}
        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent className="bg-card shadow-2xl border-2 border-border rounded-xl w-full max-w-md sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-foreground">
                <Key className="h-5 w-5" style={{ color: '#F7931E' }} />
                <span>Alterar Senha</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border-2 bg-muted/50 border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-amber-100">
                      <User className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{selectedUser.nome}</p>
                      <p className="text-xs font-medium text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword" className="font-semibold text-foreground">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="mt-2 border-2 bg-background border-border text-foreground"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword" className="font-semibold text-foreground">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                      className="mt-2 border-2 bg-background border-border text-foreground"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-lg border-2 bg-red-50 border-red-200">
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-lg border-2 bg-green-50 border-green-200">
                    <p className="text-sm font-medium text-green-700">{success}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsPasswordModalOpen(false)
                      setSelectedUser(null)
                      setNewPassword("")
                      setConfirmPassword("")
                      setError(null)
                      setSuccess(null)
                    }} 
                    disabled={isChangingPassword}
                    className="w-full sm:w-auto min-h-[44px] border-border text-foreground hover:bg-muted/50"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isChangingPassword}
                    className="w-full sm:w-auto min-h-[44px] text-white bg-amber-500 hover:bg-amber-600 disabled:bg-muted" 
                  >
                    {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
