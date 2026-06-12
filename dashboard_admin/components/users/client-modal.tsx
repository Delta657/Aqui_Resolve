"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MapPin, Phone, Mail, Calendar, ShoppingBag, DollarSign } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  address: string
  createdAt: string
  lastLogin: string
  status: "active" | "inactive" | "blocked"
  totalOrders: number
  totalSpent: number
}

interface ClientModalProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
}

export function ClientModal({ client, isOpen, onClose }: ClientModalProps) {
  if (!client) return null

  const toDisplayText = (value: unknown, fallback = "Nao informado") => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }
    if (typeof value === "number") {
      return String(value)
    }
    return fallback
  }

  const formatDateSafe = (value: unknown) => {
    if (!value) return "Nao informado"

    const date = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(date.getTime())) {
      return "Nao informado"
    }

    return date.toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "inactive":
        return <Badge className="bg-muted text-muted-foreground">Inativo</Badge>
      case "blocked":
        return <Badge className="bg-red-100 text-red-800">Bloqueado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Perfil do Cliente
            {getStatusBadge(client.status)}
          </DialogTitle>
          <DialogDescription>Informações detalhadas do cliente</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-sm">{toDisplayText(client.name)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CPF</label>
                  <p className="text-sm">{toDisplayText(client.cpf)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{toDisplayText(client.email)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{toDisplayText(client.phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{toDisplayText(client.address)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atividade na Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cadastrado em</p>
                      <p className="text-sm text-muted-foreground">{formatDateSafe(client.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Último login</p>
                      <p className="text-sm text-muted-foreground">{formatDateSafe(client.lastLogin)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Total de Pedidos</p>
                      <p className="text-sm text-muted-foreground">{client.totalOrders} pedidos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Total Gasto</p>
                      <p className="text-sm text-muted-foreground">R$ {client.totalSpent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
