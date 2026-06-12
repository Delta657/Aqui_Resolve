"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  User,
  Calendar,
  Phone,
  Building
} from "lucide-react"
import { Servico } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ServicesListProps {
  services: Servico[]
  loading: boolean
  onUpdateStatus?: (serviceId: string, newStatus: string) => void
  onDelete?: (serviceId: string) => void
  onView?: (serviceId: string) => void
  onEdit?: (serviceId: string) => void
}

const statusConfig = {
  agendado: { color: "bg-blue-100 text-blue-800", label: "Agendado" },
  aceito: { color: "bg-green-100 text-green-800", label: "Aceito" },
  aguardando: { color: "bg-yellow-100 text-yellow-800", label: "Aguardando" },
  nao_enviado: { color: "bg-muted text-muted-foreground", label: "Não Enviado" },
  em_andamento: { color: "bg-orange-100 text-orange-800", label: "Em Andamento" },
  concluido: { color: "bg-green-100 text-green-800", label: "Concluído" },
  cancelado: { color: "bg-red-100 text-red-800", label: "Cancelado" }
}

const priorityConfig = {
  baixa: { color: "bg-green-100 text-green-800", label: "Baixa" },
  media: { color: "bg-yellow-100 text-yellow-800", label: "Média" },
  alta: { color: "bg-orange-100 text-orange-800", label: "Alta" },
  urgente: { color: "bg-red-100 text-red-800", label: "Urgente" }
}

export function ServicesList({ 
  services, 
  loading, 
  onUpdateStatus, 
  onDelete, 
  onView, 
  onEdit 
}: ServicesListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.cidade.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || service.status === statusFilter
    const matchesPriority = !priorityFilter || service.prioridade === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-skeleton space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-20"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as Prioridades</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("")
                setPriorityFilter("")
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Serviços */}
      <div className="space-y-4">
        {filteredServices.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Nenhum serviço encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header com Protocolo e Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {service.protocolo}
                        </h3>
                        <Badge className={statusConfig[service.status].color}>
                          {statusConfig[service.status].label}
                        </Badge>
                        <Badge variant="outline" className={priorityConfig[service.prioridade].color}>
                          {priorityConfig[service.prioridade].label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView?.(service.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(service.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Informações do Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{service.clienteNome}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{service.empresa}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{service.telefone}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {service.cidade} - {service.bairro}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(service.dataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {service.responsavel && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{service.responsavel}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    {(service.veiculo || service.observacoes) && (
                      <div className="pt-3 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {service.veiculo && (
                            <div>
                              <span className="text-sm font-medium text-foreground">Veículo:</span>
                              <span className="text-sm text-muted-foreground ml-2">{service.veiculo}</span>
                            </div>
                          )}
                          {service.observacoes && (
                            <div>
                              <span className="text-sm font-medium text-foreground">Observações:</span>
                              <span className="text-sm text-muted-foreground ml-2">{service.observacoes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {filteredServices.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredServices.length} de {services.length} serviços
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
