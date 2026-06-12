"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Star, MapPin, UserPlus, Loader2 } from "lucide-react"
import { FirebaseProvidersService } from "@/lib/services/firebase-providers"
import { isProviderAssignableStatus } from "@/lib/providers/status"

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

interface Provider {
  id: string
  name: string
  rating: number
  totalOrders: number
  serviceCategories: string[]
  location: string
  isAvailable: boolean
}

interface AssignProviderModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onProviderAssigned: (orderId: string, providerId: string, providerName: string) => void
}

export function AssignProviderModal({ order, isOpen, onClose, onProviderAssigned }: AssignProviderModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    async function fetchProviders() {
      try {
        setLoading(true)
        setError(null)
        const fbProviders = await FirebaseProvidersService.getActiveProviders()
        setProviders(fbProviders.map(fp => ({
          id: fp.id,
          name: fp.nome,
          rating: fp.avaliacao || 0,
          totalOrders: fp.totalServicos || 0,
          serviceCategories: fp.especialidades || [],
          location: '',
          isAvailable: isProviderAssignableStatus(fp.status),
        })))
      } catch (err) {
        console.error('Erro ao buscar prestadores:', err)
        setError('Erro ao carregar prestadores')
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [isOpen])

  if (!order) return null

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase())
    const normalizedCategory = order.serviceCategory.trim().toLowerCase()
    const matchesCategory = normalizedCategory.length === 0 || provider.serviceCategories.some((category) => (
      category.toLowerCase().includes(normalizedCategory)
    ))
    return matchesSearch && matchesCategory && provider.isAvailable
  })

  const handleAssignProvider = (provider: Provider) => {
    onProviderAssigned(order.id, provider.id, provider.name)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir Prestador</DialogTitle>
          <DialogDescription>
            Selecione um prestador para o pedido {order.id} - {order.serviceCategory}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar prestadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-20"
            />
          </div>

          {/* Order Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Detalhes do Pedido</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Categoria:</span>
                <p className="font-medium">{order.serviceCategory}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Orçamento:</span>
                <p className="font-medium">R$ {order.budget.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Local:</span>
                <p className="font-medium">{order.location}</p>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="ml-2 text-muted-foreground">Carregando prestadores...</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Providers Table */}
          {!loading && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Categorias</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum prestador disponível encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProviders.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div className="font-medium">{provider.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{provider.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>{provider.totalOrders}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {provider.serviceCategories.map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{provider.location || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAssignProvider(provider)}
                            className="flex items-center gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Atribuir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
