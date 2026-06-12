"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOrdersRealtime } from "@/hooks/use-orders-realtime"
import { OrderDetailsModalFixed } from "@/components/orders/order-details-modal-fixed"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Calendar,
  MapPin,
  Mail,
  Truck,
  Activity,
  BarChart3
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ServicosPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { orders: allOrders, stats, loading: statsLoading } = useOrdersRealtime()

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  const handleOrderUpdated = () => {
    // A página já atualiza automaticamente via useOrdersRealtime
    // Esta função é chamada quando o status é atualizado
  }

  const getStatusBadge = (order: any) => {
    const status = order.status || 'pending'
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Em Andamento</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>
      default:
        return <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">Pendente</Badge>
    }
  }

  const getPriorityIcon = (order: any) => {
    if (order.isEmergency) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    return null
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="space-y-6 container mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe todos os pedidos e serviços em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </Button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelados</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergência</p>
                <p className="text-2xl font-bold text-red-600">{stats.emergency}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Urgência */}
      {stats.emergency > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Pedidos de Emergência</h3>
                <p className="text-sm text-red-700">
                  {stats.emergency} pedido(s) marcado(s) como emergência requerem atenção imediata
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo Principal */}
      <div className="space-y-4">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pedidos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pedidos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPriorityIcon(order)}
                        <p className="font-medium text-sm">{order.clientName || "—"}</p>
                        {getStatusBadge(order)}
                      </div>
                      {order.serviceType && (
                        <p className="text-xs font-medium text-primary mt-0.5">{order.serviceType}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{order.address || "Endereço não informado"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)} className="h-8 px-3 gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-xs">Ver</span>
                      </Button>
                      {order.clientPhone && (
                        <p className="text-xs text-muted-foreground">{order.clientPhone}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Métricas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Indicadores de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
                  <span className="font-semibold text-green-600">
                    {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pedidos Pendentes</span>
                  <span className="font-semibold text-yellow-600">{stats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Em Andamento</span>
                  <span className="font-semibold text-blue-600">{stats.inProgress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa de Cancelamento</span>
                  <span className="font-semibold text-red-600">
                    {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      <OrderDetailsModalFixed
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  )
}