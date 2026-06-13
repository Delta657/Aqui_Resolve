"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  UserCheck, 
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Star,
  Clock
} from "lucide-react"
import type { User as UserType } from "@/types"
// dados vindos do Firestore podem ter campos adicionais ao tipo base
type UserRecord = Record<string, any>
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface UserModalProps {
  user: UserRecord | null
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<UserType>) => void
  mode: 'create' | 'edit' | 'view'
}

const roleConfig = {
  admin: { color: "bg-red-100 text-red-800", label: "Administrador" },
  operador: { color: "bg-blue-100 text-blue-800", label: "Operador" },
  prestador: { color: "bg-green-100 text-green-800", label: "Prestador" },
  cliente: { color: "bg-muted text-muted-foreground", label: "Cliente" },
  provider: { color: "bg-green-100 text-green-800", label: "Prestador" },
  client: { color: "bg-muted text-muted-foreground", label: "Cliente" }
}

const statusConfig = {
  ativo: { color: "bg-green-100 text-green-800", label: "Ativo" },
  inativo: { color: "bg-muted text-muted-foreground", label: "Inativo" },
  bloqueado: { color: "bg-red-100 text-red-800", label: "Bloqueado" }
}

export function UserModal({ user, isOpen, onClose, onSave, mode }: UserModalProps) {
  const { toast } = useToast()
  const rawUser = user as unknown as Record<string, unknown> | null
  const toText = (value: unknown, fallback = "") => {
    if (typeof value === "string") return value
    if (typeof value === "number") return String(value)
    return fallback
  }

  const toRole = (value: unknown): UserType["role"] => {
    if (value === "admin" || value === "operador" || value === "prestador" || value === "cliente") {
      return value
    }
    if (value === "provider") return "prestador"
    if (value === "client") return "cliente"
    return "cliente"
  }

  const toStatus = (value: unknown): UserType["status"] => {
    if (value === "ativo" || value === "inativo" || value === "bloqueado") {
      return value
    }
    return "ativo"
  }

  const toUserType = (value: unknown): "client" | "provider" => {
    return value === "provider" ? "provider" : "client"
  }

  const [formData, setFormData] = useState<{
    nome: string
    email: string
    telefone: string
    cpf: string
    endereco: string
    role: UserType["role"]
    userType: "client" | "provider"
    status: UserType["status"]
    rating: number
  }>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: '',
    role: 'cliente',
    userType: 'client',
    status: 'ativo',
    rating: 0
  })

  useEffect(() => {
    if (user && mode !== 'create') {
      setFormData({
        nome: toText(user.fullName || user.nome || user.name, ''),
        email: toText(user.email, ''),
        telefone: toText(user.telefone || user.phone, ''),
        cpf: toText(user.cpf, ''),
        endereco: toText(user.endereco, ''),
        role: toRole(user.role),
        userType: toUserType(user.userType),
        status: toStatus(user.status),
        rating: typeof user.rating === "number" ? user.rating : 0
      })
    } else if (mode === 'create') {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        endereco: '',
        role: 'cliente' as UserType["role"],
        userType: 'client' as "client" | "provider",
        status: 'ativo' as UserType["status"],
        rating: 0
      })
    }
  }, [user, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "create" && !String(formData.telefone || "").trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Informe um telefone para contato operacional e suporte.",
        variant: "destructive",
      })
      return
    }
    onSave(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    const parsedValue =
      field === "rating"
        ? Number.isNaN(Number.parseFloat(value))
          ? 0
          : Number.parseFloat(value)
        : value

    setFormData(prev => ({
      ...prev,
      [field]: parsedValue
    }))
  }

  const isReadOnly = mode === 'view'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-card">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center space-x-3 text-2xl font-bold">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              {mode === 'create' && <User className="h-5 w-5 text-white" />}
              {mode === 'edit' && <UserCheck className="h-5 w-5 text-white" />}
              {mode === 'view' && <Shield className="h-5 w-5 text-white" />}
            </div>
            <span className="text-foreground">
              {mode === 'create' && 'Novo Usuário'}
              {mode === 'edit' && 'Editar Usuário'}
              {mode === 'view' && 'Detalhes do Usuário'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            {mode === 'create' && 'Preencha os dados para criar um novo usuário'}
            {mode === 'edit' && 'Atualize as informações do usuário'}
            {mode === 'view' && 'Visualize as informações completas do usuário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <Card className="bg-muted/50 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-semibold text-foreground">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Digite o nome completo"
                    required
                    readOnly={isReadOnly}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Digite o email"
                    required
                    readOnly={isReadOnly}
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-sm font-semibold text-foreground">
                    Telefone{mode === "create" ? " *" : ""}
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    required={mode === "create"}
                    readOnly={isReadOnly}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-semibold text-foreground">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    readOnly={isReadOnly}
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-sm font-semibold text-foreground">
                  Endereço
                </Label>
                <Textarea
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Digite o endereço completo"
                  readOnly={isReadOnly}
                  className="min-h-[80px] text-base"
                />
              </div>
            </CardContent>
          </Card>

          {user && mode !== "create" ? (
            <Card className="border-0 bg-muted/50 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Perfil operacional
                </CardTitle>
                <CardDescription>Campos adicionais quando existirem no documento Firestore.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Cidade</p>
                  <p className="text-foreground">{toText(rawUser?.city ?? rawUser?.cidade, "—")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Estado</p>
                  <p className="text-foreground">{toText(rawUser?.state ?? rawUser?.estado, "—")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Tipo de usuário</p>
                  <p className="text-foreground">{toText(rawUser?.userType ?? rawUser?.tipo, "—")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Aprovação / verificação</p>
                  <p className="text-foreground">
                    {toText(rawUser?.approvalStatus ?? rawUser?.verificationStatus ?? rawUser?.verificado, "—")}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground">Notas internas</p>
                  <p className="whitespace-pre-wrap text-foreground">{toText(rawUser?.internalNotes, "—")}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Configurações de Acesso */}
          <Card className="bg-muted/50 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Configurações de Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold text-foreground">
                    Função *
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-foreground">
                    Status *
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.role === 'prestador' && (
                <div className="space-y-2">
                  <Label htmlFor="rating" className="text-sm font-semibold text-foreground">
                    Avaliação
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => handleInputChange('rating', e.target.value)}
                      placeholder="0.0"
                      readOnly={isReadOnly}
                      className="h-11 text-base w-24"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= formData.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Sistema (apenas visualização) */}
          {mode === 'view' && user && (
            <Card className="bg-muted/50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Informações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3 p-4 bg-card rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Data de Criação</p>
                      <p className="text-sm text-muted-foreground">
                        {format(user.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-card rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Último Login</p>
                      <p className="text-sm text-muted-foreground">
                        {user.lastLogin 
                          ? format(user.lastLogin, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Nunca'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${(roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.cliente).color} px-3 py-1`}>
                      {(roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.cliente).label}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${(statusConfig[user.status as keyof typeof statusConfig] ?? statusConfig.ativo).color} px-3 py-1`}>
                      {(statusConfig[user.status as keyof typeof statusConfig] ?? statusConfig.ativo).label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 sm:flex-none h-11"
              >
                <X className="h-4 w-4 mr-2" />
                {mode === 'view' ? 'Fechar' : 'Cancelar'}
              </Button>
              {mode !== 'view' && (
                <Button 
                  type="submit" 
                  className="flex-1 sm:flex-none bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-11"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
