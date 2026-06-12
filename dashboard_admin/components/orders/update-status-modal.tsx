"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  X, 
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  AlertTriangle,
  Save,
  Loader2
} from "lucide-react"
import { updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

interface UpdateStatusModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
  onStatusUpdated: () => void
}

const statusOptions = [
  {
    value: "pending",
    label: "Pendente",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-800",
    description: "Aguardando processamento"
  },
  {
    value: "in_progress",
    label: "Em Andamento",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800",
    description: "Pedido sendo executado"
  },
  {
    value: "completed",
    label: "Concluído",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-green-100 text-green-800",
    description: "Pedido finalizado com sucesso"
  },
  {
    value: "cancelled",
    label: "Cancelado",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-800",
    description: "Pedido cancelado"
  }
]

export function UpdateStatusModal({ order, isOpen, onClose, onStatusUpdated }: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(order?.status || "pending")
  const [loading, setLoading] = useState(false)

  const currentStatus = statusOptions.find(s => s.value === (order?.status || "pending"))

  const handleUpdateStatus = async () => {
    if (!order?.id) return

    setLoading(true)
    try {
      const orderRef = doc(db, 'orders', order.id)
      const updateData: any = {
        status: selectedStatus,
        updatedAt: new Date()
      }

      // Adicionar campos específicos baseado no status
      if (selectedStatus === "cancelled") {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = "admin"
      } else if (selectedStatus === "in_progress") {
        updateData.distributionStartedAt = new Date()
      } else if (selectedStatus === "completed") {
        updateData.completedAt = new Date()
        updateData.completedBy = "admin"
      }

      await updateDoc(orderRef, updateData)

      toast.success("Status atualizado com sucesso!")
      onStatusUpdated()
      onClose()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast.error("Erro ao atualizar status do pedido")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 bg-background/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl border border-border max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-bold text-orange-900">Atualizar Status do Pedido</h2>
            <p className="text-sm text-orange-700 mt-1">
              Pedido: {order.id.slice(-8)} - Cliente: {order.clientName}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-orange-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Atual */}
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Status Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {currentStatus?.icon}
                <Badge className={currentStatus?.color}>
                  {currentStatus?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentStatus?.description}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Novo Status */}
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Novo Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Selecione o novo status:
                </label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          {status.icon}
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview do novo status */}
              {selectedStatus && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {statusOptions.find(s => s.value === selectedStatus)?.icon}
                    <Badge className={statusOptions.find(s => s.value === selectedStatus)?.color}>
                      {statusOptions.find(s => s.value === selectedStatus)?.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {statusOptions.find(s => s.value === selectedStatus)?.description}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Ações */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={loading || selectedStatus === (order.status || "pending")}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? "Atualizando..." : "Atualizar Status"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
