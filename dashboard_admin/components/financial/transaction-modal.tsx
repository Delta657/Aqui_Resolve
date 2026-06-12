"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, CreditCard, User, AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"

interface Transaction {
  id: string
  orderId: string
  clientId: string
  clientName: string
  providerId: string
  providerName: string
  amount: number
  commission: number
  status: "pending" | "completed" | "failed" | "refunded"
  paymentMethod: string
  createdAt: string
  completedAt?: string
  failureReason?: string
}

interface TransactionModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

export function TransactionModal({ transaction, isOpen, onClose }: TransactionModalProps) {
  if (!transaction) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>
      case "refunded":
        return <Badge className="bg-purple-100 text-purple-800">Reembolsado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "refunded":
        return <RefreshCw className="h-5 w-5 text-purple-600" />
      default:
        return null
    }
  }

  const providerEarnings = transaction.amount - transaction.commission

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes da Transação {transaction.id}</span>
            {getStatusBadge(transaction.status)}
          </DialogTitle>
          <DialogDescription>Informações completas da transação financeira</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon(transaction.status)}
                Status da Transação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID da Transação</label>
                  <p className="text-sm font-mono">{transaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pedido Relacionado</label>
                  <p className="text-sm font-mono">{transaction.orderId}</p>
                </div>
              </div>

              {transaction.status === "failed" && transaction.failureReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Motivo da Falha</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{transaction.failureReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Valor Total</span>
                  </div>
                  <p className="text-xl font-bold text-blue-900">R$ {transaction.amount.toFixed(2)}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Comissão (10%)</span>
                  </div>
                  <p className="text-xl font-bold text-green-900">R$ {transaction.commission.toFixed(2)}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Ganho do Prestador</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900">R$ {providerEarnings.toFixed(2)}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Método de Pagamento</span>
                  <p className="text-sm text-muted-foreground">{transaction.paymentMethod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{transaction.clientName}</p>
                    <p className="text-sm text-muted-foreground">ID: {transaction.clientId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prestador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{transaction.providerName}</p>
                    <p className="text-sm text-muted-foreground">ID: {transaction.providerId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico da Transação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Transação iniciada</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(transaction.createdAt).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(transaction.createdAt).toLocaleTimeString("pt-BR")}
                    </div>
                  </div>
                </div>

                {transaction.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">
                        {transaction.status === "completed" ? "Transação concluída" : "Transação processada"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(transaction.completedAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(transaction.completedAt).toLocaleTimeString("pt-BR")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {transaction.status === "failed" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Tentar Novamente
                  </Button>
                  <Button variant="outline">Contatar Cliente</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
