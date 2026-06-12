"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  MessageSquare,
  Eye,
  FileText,
  Image as ImageIcon,
  Download
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface OrderDetailsModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
}

interface ProviderInfo {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  address: string
  acceptedAt?: any
  status?: string
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  // Buscar informações do prestador que aceitou o pedido
  useEffect(() => {
    const fetchProviderInfo = async () => {
      if (!order?.providerId) return
      
      setLoading(true)
      try {
        // Buscar primeiro na collection providers
        const providerDoc = await getDoc(doc(db!, 'providers', order.providerId))
        if (providerDoc.exists()) {
          const data = providerDoc.data()
          setProviderInfo({
            id: order.providerId,
            name: data.fullName || data.nome || 'Nome não disponível',
            email: data.email || 'Email não disponível',
            phone: data.phone || data.telefone || 'Telefone não disponível',
            cpf: data.cpf || 'CPF não disponível',
            address: typeof data.address === 'string' ? data.address :
                     typeof data.address === 'object' && data.address ?
                     `${data.address.street || ''} ${data.address.number || ''}, ${data.address.city || ''}, ${data.address.state || ''}`.trim().replace(/,$/, '') :
                     'Endereço não disponível',
            acceptedAt: order.acceptedAt,
            status: order.status
          })
        } else {
          // Fallback para collection users
          const userDoc = await getDoc(doc(db!, 'users', order.providerId))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setProviderInfo({
              id: order.providerId,
              name: data.nome || data.displayName || 'Nome não disponível',
              email: data.email || 'Email não disponível',
              phone: data.telefone || data.phoneNumber || 'Telefone não disponível',
              cpf: data.cpf || data.document || 'CPF não disponível',
              address: typeof data.endereco === 'string' ? data.endereco : 'Endereço não disponível',
              acceptedAt: order.acceptedAt,
              status: order.status
            })
          }
        }
      } catch (error) {
        console.error('Erro ao buscar informações do prestador:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && order) {
      fetchProviderInfo()
    }
  }, [isOpen, order])

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
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: <Clock className="h-4 w-4" />
        }
      case 'in_progress':
        return { 
          label: 'Em Andamento', 
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Truck className="h-4 w-4" />
        }
      case 'completed':
        return { 
          label: 'Concluído', 
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />
        }
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: <X className="h-4 w-4" />
        }
      default:
        return { 
          label: 'Pendente', 
          color: 'bg-muted/50 text-foreground border-border',
          icon: <Clock className="h-4 w-4" />
        }
    }
  }

  const statusInfo = getStatusInfo(order?.status || 'pending')

  const handleViewChat = () => {
    const chatUrl = `/dashboard/controle/chat?orderId=${order.id}&protocolo=${order.id.slice(-8)}`
    window.open(chatUrl, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center justify-between">
            Detalhes do Pedido
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="provider">Prestador</TabsTrigger>
            <TabsTrigger value="timeline">Histórico</TabsTrigger>
          </TabsList>

          {/* Aba Detalhes */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Informações do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ID do Pedido:</span>
                    <Badge variant="outline">{order?.id.slice(-8)}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className={statusInfo.color}>
                      {statusInfo.icon}
                      <span className="ml-1">{statusInfo.label}</span>
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Emergência:</span>
                    <Badge variant={order?.isEmergency ? "destructive" : "secondary"}>
                      {order?.isEmergency ? "Sim" : "Não"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <span className="font-medium">Descrição:</span>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {order?.description || 'Descrição não disponível'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-medium">Imagens:</span>
                    {order?.images && order.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {order.images.map((image: string, index: number) => (
                          <div key={index} className="relative">
                            <img 
                              src={image} 
                              alt={`Imagem ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border"
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
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma imagem disponível</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order?.clientName}</p>
                      <p className="text-sm text-muted-foreground">Nome do cliente</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order?.clientEmail}</p>
                      <p className="text-sm text-muted-foreground">Email de contato</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order?.address}</p>
                      {order?.complement && (
                        <p className="text-sm text-muted-foreground">{order.complement}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Endereço de entrega</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDate(order?.createdAt).absolute}</p>
                      <p className="text-sm text-muted-foreground">
                        Criado {formatDate(order?.createdAt).relative}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Ações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button onClick={handleViewChat} className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Abrir Chat
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Gerar Relatório
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Prestador */}
          <TabsContent value="provider" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando informações do prestador...</p>
                </CardContent>
              </Card>
            ) : providerInfo ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{providerInfo.name}</p>
                        <p className="text-sm text-muted-foreground">Nome completo</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{providerInfo.email}</p>
                        <p className="text-sm text-muted-foreground">Email de contato</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{providerInfo.phone}</p>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{providerInfo.cpf}</p>
                        <p className="text-sm text-muted-foreground">CPF</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{providerInfo.address}</p>
                        <p className="text-sm text-muted-foreground">Endereço</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Status da Aceitação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aceito
                      </Badge>
                    </div>

                    {providerInfo.acceptedAt && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatDate(providerInfo.acceptedAt).absolute}</p>
                          <p className="text-sm text-muted-foreground">
                            Aceito {formatDate(providerInfo.acceptedAt).relative}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Ações Disponíveis</h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Chat
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Ligar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhum prestador aceitou
                  </h3>
                  <p className="text-muted-foreground">
                    Este pedido ainda está aguardando um prestador aceitar.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Histórico */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Pedido criado</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order?.createdAt).absolute}
                      </p>
                    </div>
                  </div>

                  {order?.distributionStartedAt && (
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Distribuição iniciada</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.distributionStartedAt).absolute}
                        </p>
                      </div>
                    </div>
                  )}

                  {providerInfo?.acceptedAt && (
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Prestador aceitou</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(providerInfo.acceptedAt).absolute}
                        </p>
                      </div>
                    </div>
                  )}

                  {order?.cancelledAt && (
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Pedido cancelado</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.cancelledAt).absolute}
                        </p>
                        {order.cancellationReason && (
                          <p className="text-sm text-red-600 mt-1">
                            Motivo: {order.cancellationReason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
