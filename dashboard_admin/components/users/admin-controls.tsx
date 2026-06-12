"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  UserPlus, 
  Users, 
  Filter, 
  Search,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit,
  Shield,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminControlsProps {
  onRefresh: () => void
  onExport: () => void
  onImport: () => void
  onBulkAction: (action: string, userIds: string[]) => void
  totalUsers: number
  activeUsers: number
  blockedUsers: number
}

export function AdminControls({ 
  onRefresh, 
  onExport, 
  onImport, 
  onBulkAction,
  totalUsers,
  activeUsers,
  blockedUsers
}: AdminControlsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState("")
  const { toast } = useToast()

  const handleBulkAction = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um usuário para realizar a ação.",
        variant: "destructive",
      })
      return
    }

    if (!bulkAction) {
      toast({
        title: "Atenção", 
        description: "Selecione uma ação para realizar.",
        variant: "destructive",
      })
      return
    }

    onBulkAction(bulkAction, selectedUsers)
    setSelectedUsers([])
    setBulkAction("")
    
    toast({
      title: "Sucesso",
      description: `Ação ${bulkAction} aplicada a ${selectedUsers.length} usuário(s).`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg" style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Total</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{totalUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--chart-1)' }}>
                <Users className="h-6 w-6" style={{ color: 'var(--primary-foreground)' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Ativos</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--chart-2)' }}>{activeUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--chart-2)' }}>
                <Shield className="h-6 w-6" style={{ color: 'var(--primary-foreground)' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Bloqueados</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--destructive)' }}>{blockedUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--destructive)' }}>
                <AlertTriangle className="h-6 w-6" style={{ color: 'var(--destructive-foreground)' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles Administrativos */}
      <Card className="border-0 shadow-lg" style={{ backgroundColor: 'var(--card)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Settings className="h-5 w-5" />
            Controles Administrativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ações em Lote */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>Ações em Lote</h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="bulk-action">Ação</Label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Ativar Usuários</SelectItem>
                    <SelectItem value="deactivate">Desativar Usuários</SelectItem>
                    <SelectItem value="block">Bloquear Usuários</SelectItem>
                    <SelectItem value="unblock">Desbloquear Usuários</SelectItem>
                    <SelectItem value="verify">Verificar Prestadores</SelectItem>
                    <SelectItem value="delete">Excluir Usuários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction || selectedUsers.length === 0}
                className="h-10"
              >
                <Edit className="h-4 w-4 mr-2" />
                Aplicar Ação
              </Button>
            </div>
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedUsers.length} usuário(s) selecionado(s)
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  Limpar Seleção
                </Button>
              </div>
            )}
          </div>

          {/* Ações de Sistema */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>Ações de Sistema</h4>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar Dados
              </Button>
              <Button 
                variant="outline" 
                onClick={onExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={onImport}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
            </div>
          </div>

          {/* Busca Avançada */}
          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>Busca Avançada</h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar usuários</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                  <Input
                    id="search"
                    placeholder="Nome, email, telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-20"
                  />
                </div>
              </div>
              <Button 
                variant="outline"
                className="h-10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
