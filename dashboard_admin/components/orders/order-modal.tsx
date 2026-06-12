"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, DollarSign, User, Star, Clock, MessageCircle } from "lucide-react"

interface Order {
  id: string
  clientId: string
  clientName: string
  providerId?: string
  providerName?: string
  serviceCategory: string
  description: string
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  budget: number
  location: string
  createdAt: string
  assignedAt?: string
  completedAt?: string
  rating?: number
}

interface OrderModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: Order["status"]) => void
}

export function OrderModal({ order, isOpen, onClose, onStatusChange }: OrderModalProps) {
  if (!order) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
      case "assigned":
        return <Badge className="bg-blue-100 text-blue-800">Atribuído</Badge>
      case "in_progress":
        return <Badge className="bg-purple-100 text-purple-800">Em Andamento</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Baixa
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="text-blue-600">
            Média
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="text-orange-600">
            Alta
          </Badge>
        )
      case "urgent":
        return (
          <Badge variant="outline" className="text-red-600">
            Urgente
          </Badge>
        )
      default:
        return <Badge variant="outline">-</Badge>
    }
  }

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(order.id, newStatus as Order["status"])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-lg sm:text-xl">Detalhes do Pedido {order.id}</span>
            {getStatusBadge(order.status)}
          </DialogTitle>
          <DialogDescription className="text-sm">Informações completas e gerenciamento do pedido</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Categoria</label>
                  <p className="text-sm sm:text-base">{order.serviceCategory}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Prioridade</label>
                  <div className="mt-1">{getPriorityBadge(order.priority)}</div>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm sm:text-base mt-1">{order.description}</p>
              </div>

              <Separator />

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{order.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs sm:text-sm">R$ {order.budget.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Criado em {new Date(order.createdAt).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client and Provider Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm sm:text-base truncate">{order.clientName}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Prestador</CardTitle>
              </CardHeader>
              <CardContent>
                {order.providerName ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm sm:text-base truncate">{order.providerName}</span>
                    </div>
                    {order.assignedAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Atribuído em {new Date(order.assignedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs sm:text-sm">Nenhum prestador atribuído</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Pedido criado</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                </div>

                {order.assignedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Prestador atribuído</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.assignedAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(order.assignedAt).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  </div>
                )}

                {order.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Pedido concluído</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.completedAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(order.completedAt).toLocaleTimeString("pt-BR")}
                      </p>
                      {order.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs">Avaliação: {order.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Alterar Status</label>
                  <Select value={order.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="assigned">Atribuído</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex items-center justify-center gap-2 bg-transparent w-full sm:w-auto">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-sm">Chat</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
