"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Ban, CheckCircle, Shield, Star, Loader2, RefreshCw } from "lucide-react"
import { ProviderModal } from "./provider-modal"
import { FirebaseProvidersService, type FirebaseProvider } from "@/lib/services/firebase-providers"
import { mapProviderStatusToLegacy } from "@/lib/providers/status"
import { mapRawVerificationStatus } from "@/lib/verification-status"
import { toIsoStringFromUnknown } from "@/lib/date-utils"

interface Provider {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  address: string
  serviceCategories: string[]
  experience: string
  isVerified: boolean
  rating: number
  totalOrders: number
  totalEarnings: number
  status: "active" | "inactive" | "pending" | "blocked"
  createdAt: string
}

function convertFirebaseToProvider(provider: FirebaseProvider): Provider {
  const vs = mapRawVerificationStatus((provider as any).verificationStatus)
  const isVerified = vs === "approved"
  const status =
    vs === "rejected"
      ? "blocked"
      : vs === "pending"
        ? "pending"
        : mapProviderStatusToLegacy(provider.status)

  return {
    id: provider.id,
    name: provider.nome,
    email: provider.email || "",
    phone: provider.telefone || "",
    cpf: String((provider as any).cpf || (provider as any).documento || ""),
    address: String((provider as any).endereco || (provider as any).address || ""),
    serviceCategories: provider.especialidades || [],
    experience: String((provider as any).experience || (provider as any).experiencia || ""),
    isVerified,
    rating: provider.avaliacao || 0,
    totalOrders: provider.totalServicos || 0,
    totalEarnings: Number((provider as any).totalEarnings || (provider as any).totalGanhos || 0),
    status,
    createdAt: provider.createdAt ? toIsoStringFromUnknown(provider.createdAt) : "",
  }
}

export function ProvidersTable() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingProviderId, setUpdatingProviderId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const firebaseProviders = await FirebaseProvidersService.getProviders()
      setProviders(firebaseProviders.map(convertFirebaseToProvider))
    } catch (err) {
      console.error("Erro ao buscar prestadores:", err)
      setError("Erro ao carregar prestadores")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        providers.flatMap((provider) => provider.serviceCategories).filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right, "pt-BR"))
  }, [providers])

  const filteredProviders = providers.filter((provider) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      provider.name.toLowerCase().includes(normalizedSearch) ||
      provider.email.toLowerCase().includes(normalizedSearch) ||
      provider.phone.toLowerCase().includes(normalizedSearch) ||
      provider.cpf.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || provider.status === statusFilter
    const matchesCategory =
      categoryFilter === "all" || provider.serviceCategories.some((category) => category === categoryFilter)

    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: Provider["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "inactive":
        return <Badge className="bg-muted text-muted-foreground">Inativo</Badge>
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
      case "blocked":
        return <Badge className="bg-red-100 text-red-800">Bloqueado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const handleStatusChange = async (provider: Provider, newStatus: "active" | "blocked") => {
    try {
      setUpdatingProviderId(provider.id)
      setError(null)
      const firebaseStatus = newStatus === "active" ? "disponivel" : "offline"
      await FirebaseProvidersService.updateProviderStatus(provider.id, firebaseStatus)
      await fetchProviders()
    } catch (err) {
      console.error("Erro ao atualizar status do prestador:", err)
      setError("Erro ao atualizar status do prestador")
    } finally {
      setUpdatingProviderId(null)
    }
  }

  const handleViewProvider = (provider: Provider) => {
    setSelectedProvider(provider)
    setIsModalOpen(true)
  }

  const handleProviderCategoriesUpdated = (categories: string[]) => {
    if (!selectedProvider) {
      return
    }

    setSelectedProvider({
      ...selectedProvider,
      serviceCategories: categories,
    })

    setProviders((current) =>
      current.map((provider) =>
        provider.id === selectedProvider.id
          ? {
              ...provider,
              serviceCategories: categories,
            }
          : provider
      )
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Prestadores cadastrados</CardTitle>
              <CardDescription>
                {filteredProviders.length} de {providers.length} prestadores exibidos
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchProviders} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, telefone ou CPF"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-3 text-muted-foreground">Carregando prestadores...</span>
            </div>
          ) : null}

          {error && !loading ? (
            <div className="py-12 text-center">
              <p className="font-medium text-red-600">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchProviders}>
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!loading && !error && filteredProviders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium text-muted-foreground">Nenhum prestador encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros para ampliar a busca.</p>
            </div>
          ) : null}

          {!loading && !error && filteredProviders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Categorias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Avaliacao</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Ganhos</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            {provider.name}
                            {provider.isVerified ? <Shield className="h-4 w-4 text-blue-600" /> : null}
                          </div>
                          <div className="text-sm text-muted-foreground">{provider.cpf || "Sem CPF"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{provider.email || "Sem email"}</div>
                          <div className="text-sm text-muted-foreground">{provider.phone || "Sem telefone"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {provider.serviceCategories.length > 0 ? (
                            provider.serviceCategories.map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Sem categorias</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(provider.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <span>{provider.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{provider.totalOrders}</TableCell>
                      <TableCell>
                        {provider.totalEarnings > 0
                          ? `R$ ${provider.totalEarnings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewProvider(provider)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {provider.status === "active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(provider, "blocked")}
                              disabled={updatingProviderId === provider.id}
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(provider, "active")}
                              disabled={updatingProviderId === provider.id}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ProviderModal
        provider={selectedProvider}
        isOpen={isModalOpen}
        onUpdated={fetchProviders}
        onCategoriesUpdated={handleProviderCategoriesUpdated}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProvider(null)
        }}
      />
    </>
  )
}
