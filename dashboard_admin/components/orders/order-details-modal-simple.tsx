"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  X, 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Eye
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrderDetailsModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailsModalSimple({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const formatDate = (timestamp: any): { relative: string; absolute: string } => {
    if (!timestamp) return { relative: 'N/A', absolute: 'N/A' }
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return {
        relative: formatDistanceToNow(date, { addSuffix: true, locale: ptBR }),
        absolute: date.toLocaleString('pt-BR'),
      }
    } catch {
      return { relative: 'N/A', absolute: 'N/A' }
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Pendente', 
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        }
      case 'in_progress':
        return { 
          label: 'Em Andamento', 
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        }
      case 'completed':
        return { 
          label: 'Concluído', 
          color: 'bg-green-50 text-green-700 border-green-200'
        }
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: 'bg-red-50 text-red-700 border-red-200'
        }
      default:
        return { 
          label: 'Pendente', 
          color: 'bg-muted/50 text-foreground border-border'
        }
    }
  }

  const statusInfo = getStatusInfo(order?.status || 'pending')

  const handleViewChat = () => {
    const chatUrl = `/dashboard/controle/chat?orderId=${order.id}&protocolo=${order.id.slice(-8)}`
    window.open(chatUrl, '_blank')
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Detalhes do Pedido - {order.clientName}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <Badge variant="outline">{order.id.slice(-8)}</Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Emergência:</span>
                  <Badge variant={order.isEmergency ? "destructive" : "secondary"}>
                    {order.isEmergency ? "Sim" : "Não"}
                  </Badge>
                </div>

                <div>
                  <span className="font-medium">Descrição:</span>
                  <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                    {order.description || 'Descrição não disponível'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.clientName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.clientEmail}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm">{order.address}</span>
                    {order.complement && (
                      <p className="text-xs text-muted-foreground">{order.complement}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{formatDate(order.createdAt).absolute}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado {formatDate(order.createdAt).relative}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Imagens */}
          {order.images && order.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Imagens do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {order.images.map((image: string, index: number) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-1 right-1 p-1 h-6 w-6"
                        onClick={() => window.open(image, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={handleViewChat} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Abrir Chat
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Atualizar Status
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Marcar Urgência
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
